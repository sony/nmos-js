/**
 * By David Patyk - 2022 - david.patyk@sony.com
 * IS12 Command Templates:
 *  A set of functions that make it easier to send commands
 */

import {NcElementId, NCACommand, NCAValue, GenericMap} from './Types'

export const ROOT_BLOCK_OID = 1

const METHOD_IDS = {
    OBJECT: {
        GET: {
            level: 1,
            index: 1,
        },
        SET: {
            level: 1,
            index: 2,
        },
        SET_SEQUENCE_ITEM: {
            level: 1,
            index: 4,
        }
    },
    BLOCK: {
        GET_MEMBERS_DESCRIPTORS: {
            level: 2,
            index: 1,
        }
    },
    CLASS_MANAGER: {
        GET_CONTROL_CLASS: {
            level: 3,
            index: 1,
        }
    }
}

export const PROPERTY_IDS = {
    OBJECT: {
        USER_LABEL: {
            level: 1,
            index: 6
        }
    },
    CLASS_MANAGER: {
        DATATYPE_DESCRIPTORS: {
            level: 3,
            index: 2
        }
    }
}

export enum MSGTYPES {
    Command,
    CommandResponse,
    Notification,
    Subscription, // NEW SPEC (14/02)
    SubscriptionResponse,
    Error
}

export const HANDLES = {
    subscription: 3,
    commands: [9000, 10000] // (range of handles used for commands)
};


/**
 * It returns a command that will get the value of a property with the given id from the object with the given oid
 * @param {number} oid - The object ID of the object you want to get the property value from.
 * @param {NcElementId} id - The id of the property you want to get.
 * @returns The value of the property.
 */
export const getPropertyValue = (oid: number, id: NcElementId): NCACommand => {
    return {
        messageType: MSGTYPES.Command,
        commands: [
            {
                handle: HANDLES.commands[0],
                oid: oid,
                methodId: METHOD_IDS.OBJECT.GET,
                arguments: {
                    id: id,
                },
            },
        ],
    }
}

/**
 * It takes an object ID and a string, and returns a message that will set the value of the object with that ID to the
 * string
 * @param {number} oid - The object OID of the object you want to change.
 * @param {NcElementId} propId - The level and index of the property
 * @param {string} value - The value to set the property to.
 * @returns The set property value command
 */
export const setPropertyValue = (oid: number, propId: NcElementId, value: NCAValue): NCACommand => {
    return {
        messageType: MSGTYPES.Command,
        commands: [
            {
                handle: HANDLES.commands[0],
                oid: oid,
                methodId: METHOD_IDS.OBJECT.SET,
                arguments: {
                    id: propId,
                    value: value,
                },
            },
        ],
    }
}

/**
 * It takes an object ID and a string, and returns a message that will set the value of the object with that ID to the
 * string
 * @param {number} oid - The object OID of the object you want to change.
 * @param {NcElementId} propId - The level and index of the sequence property
 * @param {index} index - The index of the sequence item
 * @param {string} value - The value to set the property to.
 * @returns The set sequence item command
 */
export const setSequenceItem = (oid: number, propId: NcElementId, index: number, value: NCAValue): NCACommand => {
    return {
        messageType: MSGTYPES.Command,
        commands: [
            {
                handle: HANDLES.commands[0],
                oid: oid,
                methodId: METHOD_IDS.OBJECT.SET_SEQUENCE_ITEM,
                arguments: {
                    id: propId,
                    index: index,
                    value: value,
                },
            },
        ],
    }
}

/**
 * It returns a message that will request the member descriptors of the object with the given oid
 * @param {number} oid - The object ID of the object you want to get the member descriptors for.
 * @returns The member descriptors command.
 */
export const getMemberDescriptors = (oid: number): NCACommand => {
    return {
        messageType: MSGTYPES.Command,
        commands: [
            {
                handle: HANDLES.commands[0],
                oid: oid,
                methodId: METHOD_IDS.BLOCK.GET_MEMBERS_DESCRIPTORS,
                arguments: {
                    recurse: false
                },
            },
        ],
    }
}

/**
 * Returns a message object that will get the class descriptors for the given class ID
 * @param {number[]} id - The class ID of the class you want to get the method descriptors for.
 * @returns The class manager method descriptors.
 */
export const getControlClass = (id: number[], classManagerOid: number): NCACommand => {
    return {
        messageType: MSGTYPES.Command,
        commands: [
            {
                handle: HANDLES.commands[0],
                oid: classManagerOid,
                methodId: METHOD_IDS.CLASS_MANAGER.GET_CONTROL_CLASS,
                arguments: {
                    classId: id,
                    includeInherited: true
                },
            },
        ],
    }
}

/**
 * Invokes method on object
 * @param {number} oid - The object OID of the target object.
 * @param {NcElementId} methodId - The level and index of the method
 * @param {GenericMap} args - arguments to be passed to the method
 */
export const invokeMethod = (oid: number, methodId: NcElementId, args: GenericMap): NCACommand => {
    return {
        messageType: MSGTYPES.Command,
        commands: [
            {
                handle: HANDLES.commands[0],
                oid: oid,
                methodId: methodId,
                arguments: args
            },
        ],
    }
}


/**
 * Creates a message that creates subscriptions given object oids
 * @param {number[]} oids - list of all the object oids wanting subscription
 * @returns A subscription command that will subscribe to all events
 */
export const subscription = (oids: number[]): NCACommand => {
    return {
        messageType: MSGTYPES.Subscription,
        subscriptions: [...oids],
        commands: [
            {
                handle: HANDLES.subscription
            }
        ]
    }
}


export const multiCommand = (commands: NCACommand[]): NCACommand => {
    let base_message: NCACommand = {
        messageType: MSGTYPES.Command,
        commands: []
    }
    commands.forEach((cmd) => {
        base_message.commands.push(cmd.commands[0])
    })
    return base_message
}



