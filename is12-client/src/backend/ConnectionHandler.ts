/**
 * By David Patyk - 2022 - david.patyk@sony.com
 * Connector:
 *  Used for NCA communication to a device through a websocket.
 *  Handles command send/response and notifications from subscriptions.
 */

import {HANDLES, MSGTYPES} from '../global/IS12CommandTemplates'
import {
    NCACloseFunc,
    NCACommand,
    NCANotificationFunc,
    NCAResponse,
    NCAResult,
    NcMethodStatus
} from '../global/Types'

/**
 * An instance of a command
 * @property {object} object - The commandInstance as an object.
 * @property {number} handle - The handle of the commandInstance.
 * @property {any} promise - This is the promise that will be returned to the caller.
 */
type commandInstance = {
    cmd: object
    promise: any
}


/**
 * CommandHolder is used to store all pending commands until they complete or timeout
 */
type commandHolder = {
    [handle: string]: commandInstance
}


/**
 * @class
 * NCA WebSocket handler for sending and receiving all messages
 */
export class NCAConnection {
    //#region PRIVATES
    private ws!: WebSocket;
    private readonly WSAddress: string;
    private readonly debug: boolean;
    private readonly validWS = new RegExp("ws://[a-z0-9.]+:[0-9]{2,8}(/[a-z0-9-._]{1,40}){0,10}");
    private currentHandle = HANDLES.commands[0];
    private commandList: commandHolder = {};
    private readonly notificationCallback: NCANotificationFunc | undefined;
    private readonly closeCallback: NCACloseFunc | undefined;
    private isReady: boolean;
    //#endregion

    /**
     * Creates new NCAConnector object.
     * Once initialised, start websocket with startWS().
     * @param {string} WS - The WebSocket address of the NCA node.
     * @param {boolean} [debug] - if true, the class will print out debug messages
     * @param {function} notificationFunc - optional func, if provided will be called when notification received
     * @param {function} closeFunc - optional func, if provided will be called when websocket closes
     */
    constructor(
        WS: string,
        debug: boolean = false,
        notificationFunc?: NCANotificationFunc,
        closeFunc?: NCACloseFunc) {

        // Checks whether the websocket address provided is valid
        if (this.validWS.test(WS)) {

            this.WSAddress = WS;
            this.debug = debug;
            this.notificationCallback = notificationFunc;
            this.closeCallback = closeFunc;
            this.isReady = false;

        } else
            throw new Error(`Websocket URL is invalid, it should have the form 'ws://address:port/properties' but is instead ${WS}`)
    }

    /**
     * Starts the websocket and awaits for it to be ready
     * @returns {Promise<string>} A promise that websocket is ready. ('true' or error string)
     */
    public async startWS(): Promise<string> {

        // Originally this just blocked sendMessage(), but it is best to start it like this in current use-case
        return await new Promise((resolve, reject) => {
            this.startSocket(resolve, reject)
        })
    }

    /**
     * If the debug flag is set to true, all debug messages will send to console
     * @param {any} [message] - The message to be logged.
     * @param {string} [type=log] - 'log' ,'error' or 'info'
     * @param {any} [optionalParams] - This is an optional parameter that you can pass in to the function.
     */
    private debugLog = (message?: any, type: 'log' | 'error' | 'info' = 'log', optionalParams: any = ''): void => {
        if (!this.debug) return;

        if (type === 'log') {

            console.log(message, optionalParams)

        } else if (type === 'error') {

            console.error(message, optionalParams)

        } else if (type === 'info') {

            console.info(message, optionalParams)
        }
    }

    /**
     * Creates a new websocket, and then sets up the onopen, onerror, and onmessage functions
     */
    private startSocket = (resolveCallback: Function, rejectCallback: Function) => {

        this.ws = new WebSocket(this.WSAddress);

        // WebSocket times out after 3 seconds if invalid
        setTimeout(() => {
            if (!this.isReady && !this.ws.CLOSED && !this.ws.CLOSING) {
                this.closeWS()
                rejectCallback(`WebSocket connection to \n${this.WSAddress} timed out`)
            }
        }, 3000)

        /* Called when the websocket is successfully opened. Resolves ready promise that allows sending of messages. */
        this.ws.onopen = () => {

            this.debugLog(`Connected to WebSocket: ${this.WSAddress}`)
            this.debugLog('| Session created!');
            this.isReady = true;
            resolveCallback('true');

        }

        /* Called when the websocket encounters an error. */
        this.ws.onerror = (err) => {

            this.debugLog(
                'Socket encountered error: ',
                'error',
                err,
            );
            this.closeWS()
            rejectCallback(`WebSocket connection to ${this.WSAddress} failed`);

        };

        /* Completely halts activity when websocket is closed */
        this.ws.onclose = () => {
            this.debugLog("Websocket has closed")
            this.isReady = false;
            if (this.closeCallback) this.closeCallback()
        }

        this.ws.onmessage = (msg) => {
            this.messageHandler(msg);
        }
    }


    /* Called when the websocket receives a message. */
    private messageHandler(msg: MessageEvent<any>) {

        const data: NCAResponse = JSON.parse(msg.data)

        //===================================== NOTIFICATION ========================================
        if (data.messageType === MSGTYPES.Notification) {

            const notifications = data.notifications!

            this.debugLog('| Notification:', 'info', data)

            // Triggers notification update function that was provided with message
            if (this.notificationCallback !== undefined)
                this.notificationCallback(notifications)
            else // Unknown message received
                this.debugLog(data, "error", "line 178");
        }

        //================================== COMMAND RESPONSE ======================================
        /*
        * Checking if the message is a response to a commandInstance sent by the client.
        * If it is, it will resolve the promise.
        */
        else if (data.messageType === MSGTYPES.CommandResponse) {

            const responses = data.responses!
            const handle = data.responses![0].handle
            const result = data.responses![0].result

            /*----- LOGGING ----*/
            this.debugLog('/========Receiving=======\\')
            if (responses.length > 1)
                this.debugLog(`| Handle: ${handle}-${responses[responses.length - 1].handle}`)
            else
                this.debugLog(`| Handle: ${handle}`)
            this.debugLog(`| Status: ${NcMethodStatus[responses[0].result.status]}`)
            /*------------------*/

            let matching_handle: commandInstance;
            let errorValue: number = -1;
            let to_debug: Object;

            // Scans every command to see current command is in it
            matching_handle = this.commandList[handle.toString()]
            responses.forEach((msg, index) => {
                if (msg.result.status !== NcMethodStatus.OK && msg.result.status !== NcMethodStatus.PropertyDeprecated) errorValue = index //
            })


            /*----- LOGGING ----*/
            if (responses.length === 1)
                to_debug = responses[0]
            else
                to_debug = responses.map((elem) => {
                    return elem.result
                })
            this.debugLog('| Message:', 'info', to_debug)
            /*------------------*/


            // No sending message found
            if (!matching_handle) {
                console.error('Could not find commandInstance responsible for this message')
            }

            // Resolves message and error logs
            if (errorValue === -1)
                matching_handle.promise.resolve(result);
            else {
                matching_handle.promise.reject(responses[errorValue].result);
                if (responses[errorValue].result.status === NcMethodStatus.ParameterError) {
                    alert(responses[errorValue].result.errorMessage)
                    console.error(responses[errorValue].result.errorMessage)
                }
            }

            /*----- LOGGING ----*/
            this.debugLog('\\========================/')
            this.debugLog('')
            /*------------------*/

        }
        //=============================== Subscription Response ===================================
        else if (data.messageType === MSGTYPES.SubscriptionResponse) {

            const subscriptions = data.subscriptions!

            this.debugLog('/========Receiving=======\\')
            this.debugLog(`| Successful subscriptions: ${data.subscriptions}`)

            let matching_handle: commandInstance;

            matching_handle = this.commandList[HANDLES.subscription]

            // Resolve the command to successful
            if (!matching_handle) {
                console.error('Could not find subscriptionMessage responsible for this message')
            } else {
                matching_handle.promise.resolve(subscriptions);
            }

            /*----- LOGGING ----*/
            this.debugLog('\\========================/')
            this.debugLog('')
            /*------------------*/

        } else if (data.messageType === MSGTYPES.Error) {
            //alert(data.errorMessage)
            console.error(data)
        }
        else
        {
            throw Error("No such message type")
        }
    }

    /**
     * Closes the socket
     */
    closeWS() {
        this.debugLog("Closing Websocket...")
        this.ws.close()
    }


    /**
     * It increments the currentHandle property, and if it's greater than limit, it resets it to starting number
     * @returns The next handle.
     */
    private nextHandle = () => {
        this.currentHandle++;
        if (this.currentHandle > HANDLES.commands[1]) this.currentHandle = HANDLES.commands[0]
        return this.currentHandle
    }


    /**
     * @function
     * @this NCAConnection
     * Sends a message/commandInstance to the NCA node
     * Only supports a single message at the moment...
     *
     * @example
     * (To get user label)
     * socketHandler.sendMessage( getMemberDescriptors(oid) )
     *
     * @param command {NCACommand} The NCACommand to be run
     * @returns
     */
    public sendMessage = async (command: NCACommand): Promise<NCAResult> => {
        let current_handle = this.currentHandle

        // Program has to wait for connection to finish before it sends any messages;
        if (!this.isReady)
            return {status: NcMethodStatus.NotReady, errorMessage: 'Error occurred while sending message, Websocket not yet active'}


        /*-----DEBUG LOG------*/
        this.debugLog('/---------Sending--------\\')
        if (command.messageType !== MSGTYPES.Subscription) {
            let to_send = `| Handle: ${current_handle}`
            if (command.commands.length > 1) {
                to_send += `-${current_handle + command.commands.length - 1}`
            } else {
                this.debugLog(`| OID: ${command.commands[0].oid}`)
            }
            this.debugLog(to_send)
            if (command.commands.length === 1) {
                this.debugLog('Msg:', 'log', command.commands[0])
            } else {
                this.debugLog('Msgs:', 'log', command.commands)
            }
        } else {
            this.debugLog('Subscribing to oids:', 'log', command.subscriptions)
        }
        this.debugLog('\\------------------------/')
        this.debugLog('')
        /*--------------------*/

        // Gives each message an incremented handle - supports multi-commands (multiple commands in a single message)
        if (command.messageType !== MSGTYPES.Subscription) {
            command.commands.forEach((cmd) => {
                cmd.handle = current_handle;
                current_handle = this.nextHandle()
            })
        }

        // Executes commandInstance with assigned handle and waits for message to be completed
        return await this.runCommand(command)
            .catch((err) => {
                return err
            });
    }

    /**
     * @function
     * @this runCommand
     * Sends the commandInstance through the websocket and awaits the onmessage commandInstance to resolve or reject. Times out after 2s
     * @param {object} command - the IS12 commandInstance to be run. Templates available in IS12CommandTemplates.ts
     */
    private runCommand = async (command: NCACommand): Promise<NCAResult> => {

        const result = await new Promise<NCAResult>((resolve, reject) => {

            // Resolved by ws.onmessage when it matches handles
            this.commandList[command.commands[0].handle] = {
                cmd: {...command},
                promise: {resolve, reject}
            }

            // Sends message
            this.ws.send(JSON.stringify(command))

            // Auto timeout command after 1 second of no response
            setTimeout(() => {
                reject('Command took too long...')
            }, 1000)

            // When message rejects, error
        }).catch((err) => {
            console.error(err)
            return err;
        })

        // Removing from commandList
        delete this.commandList[command.commands[0].handle]

        // Returns value from message
        return result;
    }
}
