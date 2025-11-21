export type NCAValue = number | string | boolean | number[] | string[] | boolean[] | null | undefined | { [id: string]: NCAValue };

//#region Maps
export type ObjectMap = {
    [oid: number]: ObjectHolder
}

export type PropertyMap = {
    [oid: number]: BlockHolder
}

export type Methods = {
    [oid: number]: NcMethodDescriptor[]
}

export type StateMap = {
    [oid: number]: PropStates
}

export type NCDatatypeMap = {
    [name: string]: NcDatatype
}

export type GenericMap = {
    [name: string]: any
}
//#endregion

//#region Holders
export type ObjectHolder = {
    classId: number[]
    role: string
    description: string
    userLabel: string
    oid: number
    owner: number
    children: number[]
}

export type MethodMap = {
    [name: string]: MethodHolder
}

export type MethodHolder = {
    Descriptor: NcMethodDescriptor
    ParameterMap: NodeProps
    ValueHolderMap: ValueHolderMap
}

export type BlockHolder = {
    Node: ObjectHolder
    State: PropStates | null
    ValueHolderMap: ValueHolderMap
    Methods: MethodMap
}

type StateFunc = {
    (val: NCAValue): void
}

export type PropStates = {
    [id: string]: StateFunc // Join of level and index (form: 2.1 = lvl 2 index 1)

}

export type NcEnum = {
    value: number
    name: string
    description: string
}

export enum NcDatatypeType {
    NcPrimitive = 0, //primitive, e.g. NcUint16
    NcTypeDef = 1, // typedef, i,e. simple alias of another datatype
    NcStruct = 2, // data structure
    NcEnum = 3 // enum datatype
}

// Assume this is an enum for time being
export type NcDatatype = {
    type: NcDatatypeType
    typeName: string
    enum: NcEnum[] | null // for enum types
    fields: NcFieldDescriptor[] | null //for struct types
    sequenceType: boolean
}
//#endregion

export type ValueHolder = {
    value : NCAValue | undefined // add a ValueHolderMap and ValueHolder[] here to simplify
    values : ValueHolder[] | undefined // use for sequence
    valueMap : ValueHolderMap | undefined // use for struct
    datatype: NcDatatype
    name: string | undefined
    description: string | undefined
    isReadOnly: boolean
    typeName: string
}

export type ValueHolderMap = {
    [id: string]: ValueHolder | ValueHolder[]
}
export type NodeProps = {
    [id: string]: Prop
}

export type Prop = {
    name: string
    description: string
    isReadOnly: boolean
    isSequence: boolean
    typeName: string
    datatype: NcDatatype
    valueHolder: ValueHolder | ValueHolder[] | ValueHolderMap | null
}

export type NcElementId = {
    level: number
    index: number
}

//#region NCA

// NCA = types when communicating with Nodes

export enum NcMethodStatus {
    OK = 200,
    PropertyDeprecated = 298, // Method call was successful but targeted property is deprecated
    MethodDeprecated = 299, //Method call was successful but method is deprecated
    BadCommandFormat = 400,
    Unauthorized = 401,
    BadOid = 404,
    Readonly = 405,
    InvalidRequest = 406,
    Conflict = 409,
    BufferOverflow = 413,
    IndexOutOfBounds = 414,        // Index is outside the available range
    ParameterError = 417,
    Locked = 423,
    DeviceError = 500,
    MethodNotImplemented = 501,
    PropertyNotImplemented = 502,
    NotReady = 503,
    Timeout = 504
}

export enum NcPropertyChangeType {
    ValueChanged = 0,
    SequenceItemAdded = 1,
    SequenceItemChanged = 2,
    SequenceItemRemoved = 3
}

export type NCAMessage = {
    handle: number
    oid?: number
    methodId?: {
        level: number
        index: number
    }
    arguments?: {
        id?: {
            level: number
            index: number
        }
        value?: NCAValue
        classId?: number[]
        includeInherited?: boolean
        oid?: number
        recurse?: boolean
        index?: number
    }
}

export type NCACommand = {
    messageType: number
    commands: NCAMessage[]
    sessionId?: number
    subscriptions?: number[]
}

export type NCAResult = {
    status: NcMethodStatus
    value?: NCAGeneralResponseValue[] | NcClassDescriptor | NCAValue | NcDatatypeDescriptorEnum[] | NcDatatypeDescriptorStruct[] //TODO NEW SPEC
    errorMessage?: any
}

export type NCAItem = {
    description: string
    name: string
    value: NCAValue
}

export type NCAGeneralResponseValue = {
    oid: number
    classId: number[]
    constantOid: boolean
    constraints: any
    description: string
    owner: number
    role: string
    userLabel: string
}

export type InheritedNCAGeneralResponseValue = { // TODO new spec
    description: string
    name: string
    type: number
    constraints: any
    items: NCAItem[]
}

export type NcFieldDescriptor = {
    description: string // optional user facing description
    name: string           // name of field
    typeName: string       // name of field's datatype. Can only ever be null if the type is any
    isNullable: boolean     // TRUE iff the field is nullable
    isSequence: boolean     // TRUE iff the field is a sequence
    constraints: any    // NcParameterConstraints optional constraints on top of the underlying data type
    datatype: NcDatatype | null
}

export type NcDatatypeDescriptorEnum = {
    description: string // optional user facing description
    name: string
    type: number
    constraints: any
    items: NCAItem[]
}

export type NcDatatypeDescriptorStruct = {
    description: string // optional user facing description
    name: string
    type: number
    constraints: any
    fields: NcFieldDescriptor[] // one item descriptor per field of the struct
    parentType: string                 // name of the parent type if any or null if it has no parent
}

export type NcDatatypeDescriptorTypeDef = {
    description: string // optional user facing description
    name: string
    type: number
    constraints: any
    isSequence: boolean
    parentType: string // name of the parent type if any or null if it has no parent
}

export type NcDatatypeDescriptorPrimitive = {
    description: string // optional user facing description
    name: string
    type: number
    constraints: any
}

export type NCACommandResponseMessage = {
    handle: number
    result: NCAResult
}

export type NCANotificationResponseMessage = {
    oid: number
    eventId: NcElementId
    eventData: {
        propertyId: NcElementId
        changeType: number
        value: NCAValue
        sequenceItemIndex: any
    }
}

export type NCAResponse = {
    messageType: number
    responses?: NCACommandResponseMessage[]
    notifications?: NCANotificationResponseMessage[]
    subscriptions?: number[]
    errorMessage?: string
}

export type NcClassDescriptor = {
    description: string
    events: NcEventDescriptor[]
    methods: NcMethodDescriptor[]
    properties: NcPropertyDescriptor[]
}

export type NcEventDescriptor = {
    description: string
    eventDatatype: string
    id: NcElementId
    name: string
}

export type NcParameterDescriptor = {
    constraints: any // unknown since not used
    description: string
    isNullable: boolean
    isSequence: boolean
    name: string
    typeName: string
}

export type NcMethodDescriptor = {
    description: string
    id: NcElementId
    name: string
    parameters: NcParameterDescriptor[]
    resultDatatype: string
}

export type NcPropertyDescriptor = {
    constraints: any // unknown since not used
    description: string
    id: NcElementId
    isNullable: boolean
    isSequence: boolean
    name: string
    persistent: boolean
    isReadOnly: boolean
    typeName: string
}

export type NCANotificationFunc = (data: NCANotificationResponseMessage[]) => void
export type NCACloseFunc = () => void

//#endregion