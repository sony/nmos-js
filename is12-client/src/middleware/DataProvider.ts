/**
 * By David Patyk - 2022 - david.patyk@sony.com
 * Data Provider:
 *  Middleware that handles incoming and outgoing data, as well as causes updates to front-end.
 *  > Gets blocks and their descriptors, subscribes to property changes and updates states
 */

/*
*  DONE: Communication with backend to get notifications and update values from it
*  DONE: Functions for commands instead of object in IS12CommandTemplates
*  DONE: Make this into a class already man
*  DONE: SOCKET SHOULD BE DONE INSIDE HERE!!!
*  DONE: Update with new NMOS specs (no create session and heartbeat)
*/

import type {
    GenericMap,
    MethodMap,
    NCACloseFunc,
    NCAResult,
    NCAValue,
    NcElementId,
    NodeProps,
    ObjectMap,
    PropertyMap,
    StateMap,
    ValueHolder,
    ValueHolderMap
} from "../global/Types"
import {NCANotificationResponseMessage, NcMethodStatus} from "../global/Types";
import {getClassDescriptor, getBlockProps, getFormattedBlockNodes, subscribeToObjects, getDatatypes, getRootBlock } from "../backend/BlockNodeCommands";
import {NCAConnection} from "../backend/ConnectionHandler";
import {getPropertyValue, setPropertyValue, setSequenceItem, invokeMethod} from "../global/IS12CommandTemplates";
import {makeValueHolder} from "./HelperFunctions"

export default class DataProvider {

    private propertyMap: PropertyMap = {};
    private rootBlock: number[] = [];
    private readonly NCAWebsocket: NCAConnection;
    private readonly debug: boolean;
    private readonly wsAddress: string;
    private readonly loadStateCallback: Function;
    public isClosed: boolean;
    private readonly showClassManager: boolean;

    /**
     * Takes an address, creates a new NCAConnection object, and then calls the
     * createProviderStructure function
     * @param {string} address - The address of the NCA server (format IP:PORT).
     * @param {boolean} debug - Whether the program should output debug messages
     * @param {Function} setIsLoading - The state change function for callback 'isLoading'
     * @param {NCACloseFunc} onClose - Function callback for when websocket closes
     */
    constructor(address: string, debug: boolean, setIsLoading: Function, onClose: NCACloseFunc, showClassManager: boolean) {

        // Creates initial connection object - See ConnectionHandler.ts
        this.NCAWebsocket = new NCAConnection(
            address,
            debug,
            this.notificationFunc,
            this.closeFunc
        )

        this.wsAddress = address;
        this.debug = debug;
        this.isClosed = false;
        this.loadStateCallback = setIsLoading;
        this.showClassManager = showClassManager;

        // Begins Websocket NCAConnection
        this.NCAWebsocket.startWS().then(() => {

            /* Starts dataProvider main setup */
            this.createProviderStructure(setIsLoading).then(() => {})

        }).catch((err) => {
            this.stopProvider(err)
        })
    }

    private updateProperty = (valueHolder: any, newValue: any, itemIndex: any): ValueHolder => {
        if (itemIndex !== null) {
            var index = itemIndex as number
            valueHolder.values[index] = this.updateProperty(valueHolder.values[index], newValue, null)
        }
        else {
            if (valueHolder.valueMap) { // is it a struct
                let nv = newValue as any
                for (const elem of Object.keys(nv)) {
                    valueHolder.valueMap[elem] = this.updateProperty(valueHolder.valueMap[elem], nv[elem], null)
                }
            } else {
                valueHolder.value = newValue
            }
        }
        return valueHolder
    }

    // Runs whenever a notification is received to update values in front-end ( called by ConnectionHandler )
    private notificationFunc = (data: NCANotificationResponseMessage[]) => {
        let propId = ''

        data.forEach((prop) => {
            if (!prop.eventData) return

            propId = `${prop.eventData.propertyId.level}.${prop.eventData.propertyId.index}`

            var newValue = prop.eventData.value

            var valueHolder = this.propertyMap[prop.oid].ValueHolderMap![propId] as any
            valueHolder = this.updateProperty(valueHolder, newValue, prop.eventData.sequenceItemIndex)
            this.propertyMap[prop.oid].ValueHolderMap![propId] = valueHolder
            this.propertyMap[prop.oid].State![propId](valueHolder)
        })
    }

    // Runs when the websocket closes ( called by ConnectionHandler )
    private closeFunc = () => {
        if (this.debug) console.warn('Closing socket due to external close')
        this.stopProvider()
        this.loadStateCallback('Websocket has closed unexpectedly... Please refresh or select a different node')
    }

    // Runs when the provider is created to fetch structure from NCA Node
    private createProviderStructure = async (setIsLoading: Function): Promise<void> => {

        if (this.debug) console.info('Getting all NCA blocks from root block descriptor (filtering managers out)')

        this.rootBlock = await getRootBlock(this.NCAWebsocket);

        // Gets the blocks inside the Node Descriptor (without sub and class managers )
        const Nodes: ObjectMap = await getFormattedBlockNodes(this.NCAWebsocket, this.debug, !this.showClassManager)

        if (Object.keys(Nodes).length === 0) {
            this.stopProvider()
            return;
        }

        let datatypeMap = await getDatatypes(this.NCAWebsocket)

        let tmpProps: NodeProps | null;
        let formattedId: string[];
        let tempId: NcElementId;
        let result: NCAResult;

        let valueHolderMap: ValueHolderMap;
        let methodMap: MethodMap;

        // For every node ( stored as dictionary of 'oid: {values}' )
        for (let nodeOid in Nodes) {

            valueHolderMap = {}

            tmpProps = await getBlockProps(this.NCAWebsocket, datatypeMap, Nodes[nodeOid])

            // === For each property of each node ===
            for (let propKey in tmpProps) {

                formattedId = propKey.split('.')
                tempId = {
                    level: Number(formattedId[0]),
                    index: Number(formattedId[1])
                }

                // --- Get initial property value ---
                if (this.debug) console.info(`Getting property value of ${nodeOid}:${propKey}`)

                result = await this.NCAWebsocket.sendMessage(
                    getPropertyValue(Number(nodeOid), tempId)
                )

                if (result.status !== NcMethodStatus.OK && result.status !== NcMethodStatus.PropertyDeprecated) {
                    console.error("Error occurred while fetching value", NcMethodStatus[result.status])

                    valueHolderMap[propKey] = await makeValueHolder(null, tmpProps[propKey].isSequence, tmpProps[propKey].datatype, tmpProps[propKey].isReadOnly, tmpProps[propKey].typeName, tmpProps[propKey].name, tmpProps[propKey].description)
                    continue;
                }

                const value = result.value as NCAValue;
                valueHolderMap[propKey] = await makeValueHolder(value, tmpProps[propKey].isSequence, tmpProps[propKey].datatype, tmpProps[propKey].isReadOnly, tmpProps[propKey].typeName, tmpProps[propKey].name, tmpProps[propKey].description)
                // -----------------------------------
            }

            methodMap = {}

            // Gets descriptor of class which contains all properties
            const descriptor = await getClassDescriptor(this.NCAWebsocket, Nodes[nodeOid])

            if (descriptor === null) continue;

            let parameterProperties: NodeProps;
            let methodValueHolderMap: ValueHolderMap;

            for (const methodDescriptor of descriptor.methods) {

                parameterProperties = {}
                methodValueHolderMap = {}
                for (const parameterDescriptor of methodDescriptor.parameters) {
                    let valueHolder = await makeValueHolder(null, parameterDescriptor.isSequence, datatypeMap[parameterDescriptor.typeName], false, parameterDescriptor.typeName, parameterDescriptor.name, parameterDescriptor.description, true)
                    parameterProperties[parameterDescriptor.name] = {
                        name: parameterDescriptor.name,
                        description: parameterDescriptor.description,
                        isReadOnly: false,
                        isSequence: parameterDescriptor.isSequence,
                        typeName: parameterDescriptor.typeName,
                        datatype: datatypeMap[parameterDescriptor.typeName],
                        valueHolder: valueHolder
                    }
                    methodValueHolderMap[parameterDescriptor.name] = valueHolder
                }
                let methodId = methodDescriptor.id.level + '.' + methodDescriptor.id.index
                methodMap[methodId] = {
                    Descriptor: methodDescriptor,
                    ParameterMap: parameterProperties,
                    ValueHolderMap: methodValueHolderMap
                }
            }

            // === All blocks stored like this ===
            this.propertyMap[nodeOid] = {
                Node: Nodes[nodeOid],
                State: null,
                ValueHolderMap: valueHolderMap,
                Methods: methodMap
            }
        }
        setIsLoading('false')
    }


    // Return func to let the front-end form a structure using the data
    public getPropertyMap = (): PropertyMap => {
        return {...this.propertyMap}
    }

    public getRootBlock = (): number[] => {
        return this.rootBlock
    }

    public getWSAddress = (): string => {
        return this.wsAddress
    }

    /* Starts the live operation of the data provider */
    public startProvider = (setStates: StateMap, setIsActive: Function) => {
        if (this.isClosed) return;

        // Copies across states into propertyMap
        for (let stateKey in setStates) {
            this.propertyMap[stateKey].State = setStates[stateKey]
        }

        // Subscribes to all events from every node in propertyMap
        if (this.debug) console.info('Subscribing to all properties')
        subscribeToObjects(
            this.NCAWebsocket,
            [...Object.keys(this.propertyMap).map((elem) => {return Number(elem)})]
        )

        // Tells callback function that provider is now active
        setIsActive(true)
    }


    // Closes the websocket
    public stopProvider = (type?: string) => {
        if (type === 'safe') this.loadStateCallback('true')
        this.isClosed = true;
        this.NCAWebsocket.closeWS()
    }

    private castValue = (datatype: string, value: any) => {
        if (datatype === "NcInt16" || datatype === "NcInt32" || datatype === "NcInt64" || datatype === "NcUint16" || datatype === "NcUint32" || datatype === "NcUint64") {
            return parseInt(value);
        }
        if (datatype === "NcFloat32" || datatype === "NcFloat64") {
            return parseFloat(value);
        }
        if (datatype === "NcBoolean") {
            if (typeof value === "boolean" ) {
                return value
            }
            if (typeof value === "string" && (value.toLowerCase() === "true" || value === "1")) {
                return true
            }
            return false
        }

        return value
    }


    // Used for making changes from program to server
    // parentValue is undefined unless this value is part of a struct
    // in which case parentValue will be the struct this value is part of (this is because when setting a property of a struct we have to
    // send the entire updated struct to the Node)
    public changeValue = (prop_parent_oid: number, propId: NcElementId, newVal: NCAValue, parentValue: ValueHolderMap | undefined, valueHolder: ValueHolder) => {

        const castVal = this.castValue(valueHolder.datatype.typeName, newVal)

        if (parentValue) {
            // This is an object
            var objectVal = {} as GenericMap
            for (const elem of Object.keys(parentValue)) {
                var vh = parentValue[elem] as ValueHolder
                let name = vh.name as string
                objectVal[name] = vh.value
            }
            let name = valueHolder.name as string
            objectVal[name] = castVal
            this.NCAWebsocket.sendMessage(
            setPropertyValue(prop_parent_oid, propId, objectVal)
            ).then(r => {
                if (r.status !== NcMethodStatus.OK && r.status !== NcMethodStatus.PropertyDeprecated) {
                    console.error(NcMethodStatus[r.status] + ': ' + r.errorMessage)
                }
                if (r.status === NcMethodStatus.PropertyDeprecated) {
                    alert('WARNING! Property deprecated')
                }

            })
        }
        else {
            // Sends message to change value provided by the user
            if (this.debug) console.info('Sending value change request to server')
            this.NCAWebsocket.sendMessage(
                setPropertyValue(prop_parent_oid, propId, castVal)
            ).then(r => {
                if (r.status !== NcMethodStatus.OK && r.status !== NcMethodStatus.PropertyDeprecated) {
                    console.error(NcMethodStatus[r.status] + ': ' + r.errorMessage)
                }
                if (r.status === NcMethodStatus.PropertyDeprecated) {
                    alert('WARNING! Property deprecated')
                }
            })
        }
    }

    // Change sequence value
    // parentValue is undefined unless this value is part of a struct
    // in which case parentValue will be the struct this value is part of (this is because when setting a property of a struct we have to
    // send the entire updated struct to the Node)
    public changeSequencePropertyValue = (prop_parent_oid: number, propId: NcElementId, index: number, newVal: NCAValue, parentValue: ValueHolderMap | undefined, valueHolder: ValueHolder) => {

        const castVal = this.castValue(valueHolder.datatype.typeName, newVal)

        if (parentValue) {
            // This is an object
            var objectVal = {} as GenericMap
            for (const elem of Object.keys(parentValue)) {
                var vh = parentValue[elem] as ValueHolder
                let name = vh.name as string
                objectVal[name] = vh.value
            }
            let name = valueHolder.name as string
            objectVal[name] = castVal
            this.NCAWebsocket.sendMessage(
                setSequenceItem(prop_parent_oid, propId, index, objectVal)
            ).then(r => {
                if (r.status !== NcMethodStatus.OK && r.status !== NcMethodStatus.PropertyDeprecated) {
                    console.error(NcMethodStatus[r.status] + ': ' + r.errorMessage)
                }
                if (r.status === NcMethodStatus.PropertyDeprecated) {
                    alert('WARNING! Property deprecated')
                }

            })
        }
        else {
            // Sends message to change value provided by the user
            if (this.debug) console.info('Sending sequence value change request to server')
            this.NCAWebsocket.sendMessage(
                setSequenceItem(prop_parent_oid, propId, index, castVal)
            ).then(r => {
                if (r.status !== NcMethodStatus.OK && r.status !== NcMethodStatus.PropertyDeprecated) {
                    console.error(NcMethodStatus[r.status] + ': ' + r.errorMessage)
                }
                if (r.status === NcMethodStatus.PropertyDeprecated) {
                    alert('WARNING! Property deprecated')
                }
            })
        }
    }

    // Change method parameter value
    public changeParameter = (oid: number, methodId: NcElementId, parameterName: string, newVal: NCAValue, parentValue: ValueHolderMap | undefined, valueHolder: ValueHolder, invariantHint: string | undefined) => {

        // If this an invariant type then use the invariantHint to set a typeName on the ValueHolder
        if (valueHolder.datatype === undefined && invariantHint !== undefined) {
            valueHolder.typeName = invariantHint
        }

        var methodIdString = `${methodId.level}.${methodId.index}` as string

        valueHolder.value = newVal
        if (parentValue === undefined) {
            this.propertyMap[oid].Methods![methodIdString].ValueHolderMap![parameterName] = valueHolder
        }
        else {
            var tmpValueHolder = this.propertyMap[oid].Methods![methodIdString].ValueHolderMap![parameterName] as ValueHolder
            var tmpValueHolderMap = tmpValueHolder.valueMap as ValueHolderMap
            var name = valueHolder.name as string
            tmpValueHolderMap[name] = valueHolder

            tmpValueHolder.valueMap = tmpValueHolderMap
            this.propertyMap[oid].Methods![methodIdString].ValueHolderMap![parameterName] = tmpValueHolder
        }
        var method_id = 'm' + methodIdString + '.' + parameterName

        this.propertyMap[oid].State![method_id](valueHolder.value)
    }

    // Not currently supported
    public changeSequenceParameter = (prop_parent_oid: number, propId: NcElementId, index: number, parameterName: string, newVal: NCAValue, parentValue: ValueHolderMap | undefined, valueHolder: ValueHolder) => {
        alert("Sequence parameters not supported by client")
    }

    private makeParameter = (valueHolder: ValueHolder): GenericMap => {
        if (valueHolder.valueMap) { // is it a struct
            var param = {} as GenericMap

            for (const elem of Object.keys(valueHolder.valueMap)) {
                var vh = valueHolder.valueMap[elem] as ValueHolder
                param[elem] = this.makeParameter(vh)
            }

            return param
        }

        var typeName = valueHolder.datatype ? valueHolder.datatype.typeName : (valueHolder.typeName ? valueHolder.typeName : "NcString")
        return this.castValue(typeName, valueHolder.value)
    }

    public invokeMethod = async (oid: number, methodId: NcElementId) => {

        var method_args = {} as GenericMap

        var methodIdString = `${methodId.level}.${methodId.index}` as string
        var valueHolderMap = this.propertyMap[oid].Methods![methodIdString].ValueHolderMap

        for (const param of Object.keys(valueHolderMap)) {

            var valueHolder = valueHolderMap[param] as ValueHolder
            var name = valueHolder.name as string

            method_args[name] = this.makeParameter(valueHolder)
        }

        var result = await this.NCAWebsocket.sendMessage(
           invokeMethod(oid, methodId, method_args)
        )

        if (typeof result === 'object' && 'status' in result) {
            if (result.status === NcMethodStatus.OK) {
                var message = result.value ? JSON.stringify(result.value) : 'OK'
                alert(message)
            }
            else if (result.status === NcMethodStatus.MethodDeprecated){
                alert('Method deprecated: ' + JSON.stringify(result.value))
            }
            else{
                // error
                alert(NcMethodStatus[result.status] + ': ' + result.errorMessage)
            }
        }
        else {
            // Some sort of error has occurred
            alert('ERROR! ' + result)
        }
    }
}