/**
 * By David Patyk - 2022 - david.patyk@sony.com
 * Block Node Commands:
 *  Functions to make it easier to carry out operations to Node Blocks
 *  > Get list of all parent and child nodes from getFormattedBlockNodes
 *  > Get all properties for a node with getBlockProps
 *  > Subscribe to all properties of a node list with subscribeAllProps
 */

import {NCAConnection} from './ConnectionHandler';
import {
    getControlClass,
    getMemberDescriptors,
    getPropertyValue,
    subscription,
    PROPERTY_IDS, ROOT_BLOCK_OID
} from "../global/IS12CommandTemplates";
import {
    GenericMap,
    NcClassDescriptor,
    NCAGeneralResponseValue,
    NCAResult,
    NcDatatypeDescriptorEnum,
    NcDatatypeDescriptorStruct,
    NcDatatypeDescriptorTypeDef,
    NcDatatypeDescriptorPrimitive,
    NCDatatypeMap,
    NcDatatypeType,
    NcEnum,
    NcFieldDescriptor,
    NcMethodStatus,
    NodeProps,
    ObjectHolder,
    ObjectMap
} from '../global/Types'

/** This function will get the block info from the node and return it as a `ObjectMap` object
 * @param {NCAConnection} NCASocket - The socket connection to the node.
 * @param {boolean} debug - Whether to show debug messages
 * @param filterManagers - Whether to filter out general managers
 * @returns A promise that resolves to a ObjectMap.
 */
export const getFormattedBlockNodes = async (NCASocket: NCAConnection, debug: boolean, filterManagers: boolean): Promise<ObjectMap> => {

    // Gets the member descriptors of root blocks
    let blocks = await getBlockMembers(NCASocket, ROOT_BLOCK_OID, filterManagers);

    if (blocks === undefined) return {};

    return blocks;
}


export const getRootBlock = async (NCASocket: NCAConnection): Promise<number[]> => {
    const result: NCAResult = await NCASocket.sendMessage(getMemberDescriptors(ROOT_BLOCK_OID))

    // Error case
    if (result.status !== NcMethodStatus.OK || result.value === undefined) return []

    // Formatting result
    let oidArray: number[] = []

    for (const value of result.value as NCAGeneralResponseValue[]) {
        oidArray.push(value.oid)
    }

    return oidArray.sort((n1,n2) => n1 - n2);
}

/**
 * Gets the direct members of the given oid (with optionally filtered out values)
 * @param {NCAConnection} NCASocket - The socket that is connected to the NCA server
 * @param {number} oid - The oid of the block you want to get the nodes of
 * @param {ObjectMap} objectMap - The object that will be returned with the nodes
 * @param filterManagers - Whether to filter out managers
 * @returns A map of nodes
 */
const getBlockMembers = async (NCASocket: NCAConnection, oid: number, filterManagers: boolean): Promise<ObjectMap> => {

    const objectMap: ObjectMap = {};

    // Gets descriptors of root block
    const result: NCAResult = await NCASocket.sendMessage(getMemberDescriptors(oid))

    // Error case
    if (result.status !== NcMethodStatus.OK || result.value === undefined) return {}

    // Formatting result
    let val = result.value as NCAGeneralResponseValue[]

    // Getting the useful elements from descriptor
    for (const elem of val) {

        if (filterManagers && elem.role.toLowerCase().includes("manager")
            && elem.role !== "DeviceManager") continue;

        objectMap[elem.oid] = {
            classId: elem.classId,
            role: elem.role,
            description: elem.description,
            userLabel: elem.userLabel,
            oid: elem.oid,
            owner: elem.owner,
            children: []
        };

        // Checking this is a block
        if (elem.classId[0] !== 1 || elem.classId[1] !== 1)
            continue

        let childObjectMap = await getBlockMembers(NCASocket, elem.oid, filterManagers)

        for (let childOid in childObjectMap) {
            if (childObjectMap[childOid].owner === elem.oid) {
                objectMap[elem.oid].children.push(parseInt(childOid))
            }
            objectMap[childOid] = childObjectMap[childOid]
        }
    }

    return objectMap;
}

/**
 * It takes a node and returns a dictionary of all the properties of that node
 * @param {NCAConnection} NCASocket - The socket connection to the NCA server.
 * @param {ObjectHolder} objectHolder - The node you want to get the properties of.
 * @returns a promise that resolves to an object that contains the properties of the node or null
 */
export const getBlockProps = async (NCASocket: NCAConnection, datatypeMap: NCDatatypeMap, objectHolder: ObjectHolder): Promise<NodeProps | null> => {
    let tmpProps: NodeProps = {}

    // Gets descriptor of class which contains all properties
    const descriptor = await getClassDescriptor(NCASocket, objectHolder)

    if (descriptor === null) return null;

    for (const prop of descriptor.properties) {

        // Filters out common props apart from userLabel
        if (prop.id && prop.id.level === 1 && prop.id.index !== PROPERTY_IDS.OBJECT.USER_LABEL.index) continue;

        // Look up class manager datatype
        var datatype = datatypeMap[prop.typeName]

        // Adds property to list
        tmpProps[`${prop.id.level}.${prop.id.index}`] = {
            name: prop.name,
            description: prop.description,
            isReadOnly: prop.isReadOnly,
            isSequence: prop.isSequence,
            typeName: prop.typeName,
            datatype: datatype,
            valueHolder: null
        }
    }

    // If object has properties
    if (Object.keys(tmpProps).length > 0) return tmpProps

    else return null
}


/**
 * Gets the class descriptor of an object
 * @param {NCAConnection} NCASocket - NCAConnection - The socket connection to the server
 * @param {ObjectHolder} objectHolder - NodeHolder - This is the node that you want to get the descriptors for.
 * @returns The return value is a promise that resolves to an NcClassDescriptor or null.
 */
export const getClassDescriptor = async (NCASocket: NCAConnection, objectHolder: ObjectHolder): Promise<NcClassDescriptor | null> => {

    const classManagerOid = await getClassManagerOid(NCASocket);

    // Only used by DevApp and getBlockProps
    const response: NCAResult = await NCASocket.sendMessage(
        getControlClass(objectHolder.classId, classManagerOid)
    )

    const descriptors = response.value as NcClassDescriptor;

    let descriptor: NcClassDescriptor | null;

    if (descriptors)
        descriptor = descriptors;
    else
        descriptor = null

    return descriptor;
}

/**
 * It takes an array of object OIDs and subscribes to all events for each of them
 * @param {NCAConnection} NCASocket - The socket connection to the NCA server.
 * @param {number[]} oids - An array of the oids of the objects you want to subscribe to.
 */
export const subscribeToObjects = (NCASocket: NCAConnection, oids: number[]): void => {

    // Subscribes to all properties in one message
    NCASocket.sendMessage(
        subscription(oids)
    ).then((result) => {
        return true
    })

}

export const getDatatypes = async (NCASocket: NCAConnection): Promise<NCDatatypeMap> => {

    const result: NCDatatypeMap = {}

    const classManagerOid = await getClassManagerOid(NCASocket)

    let datatypeDescriptors = await NCASocket.sendMessage(
        getPropertyValue(Number(classManagerOid), PROPERTY_IDS.CLASS_MANAGER.DATATYPE_DESCRIPTORS)
    ) as { status: number, value: any}

    const descriptorMap: GenericMap = {}

    for (const descriptor of datatypeDescriptors.value) {
        descriptorMap[descriptor.name] = descriptor
    }

    for (const descriptor of datatypeDescriptors.value) {

        if (descriptor.type === NcDatatypeType.NcEnum) {

            let datatype = descriptor as NcDatatypeDescriptorEnum;

            let enums: NcEnum[] = [];

            for (const itemVal of datatype.items) {
                let name = itemVal.name
                let description = itemVal.description
                let value = itemVal.value as number

                enums.push({ value, name, description})
            }

            result[datatype.name] = {
                type: NcDatatypeType.NcEnum,
                typeName: descriptor.name,
                enum: enums,
                fields: null,
                sequenceType: false
            }
        }
        else if (descriptor.type === NcDatatypeType.NcStruct) {

            let datatype = descriptor as NcDatatypeDescriptorStruct;

            var name = datatype.name
            var fields = datatype.fields.slice()

            // add inherited fields
            while (datatype.parentType !== null) {
                datatype = descriptorMap[datatype.parentType]
                fields = fields.concat(datatype.fields)
            }

            result[name] = {
                type: NcDatatypeType.NcStruct,
                typeName: descriptor.name,
                enum: null,
                fields: fields,
                sequenceType: false
            }
        }
        else if (descriptor.type === NcDatatypeType.NcTypeDef) {
            let datatype = descriptor as NcDatatypeDescriptorTypeDef;

            result[datatype.name] = {
                type: NcDatatypeType.NcTypeDef,
                typeName: descriptor.name,
                enum: null,
                fields: null,
                sequenceType: datatype.isSequence
            }
        }
        else {
            let datatype = descriptor as NcDatatypeDescriptorPrimitive;

            result[datatype.name] = {
                type: NcDatatypeType.NcPrimitive,
                typeName: descriptor.name,
                enum: null,
                fields: null,
                sequenceType: false
            }
        }
    }
    // Resolve typedefs
    for (const descriptor of datatypeDescriptors.value) {
        if (descriptor.type === NcDatatypeType.NcTypeDef) {
            let datatype = descriptor as NcDatatypeDescriptorTypeDef;
            let originalName = datatype.name
            let name = datatype.name
            let sequenceType = datatype.isSequence

            while (datatype.type === NcDatatypeType.NcTypeDef && datatype.parentType !== null) {
                datatype = descriptorMap[datatype.parentType]
                name = datatype.name
            }

            var mappedType = {...result[name]}

            mappedType.sequenceType = sequenceType

            result[originalName] = mappedType
        }
    }
    // Decorate any NcStruct fields with datatype definitions
    for (const elem of Object.keys(result) )
    {
        if (result[elem].type === NcDatatypeType.NcStruct) {
            for (var field of result[elem].fields as NcFieldDescriptor[]) {
                field.datatype = result[field.typeName]
            }
        }
    }

    return result
}

export const getClassManagerOid = async (NCASocket: NCAConnection): Promise<number> => {

    let result: number = 0
    let rootBlockOid = 1

    const blocks: NCAResult = await NCASocket.sendMessage(getMemberDescriptors(rootBlockOid))

    // Error case
    if (blocks.status !== NcMethodStatus.OK || blocks.value === undefined) return result

    // Formatting result
    let val = blocks.value as NCAGeneralResponseValue[]

    // Getting the useful elements from descriptor
    for (const elem of val) {

        if (elem.role.toLowerCase() === "classmanager") {
            result = elem.oid
        }
    }

    return result
}


