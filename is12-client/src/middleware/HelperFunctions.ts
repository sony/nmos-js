/**
 * It takes an object and returns a list of objects that can be used to create a table
 * @param id - This is the id of the embed field.
 * @param name - The name of the command.
 * @param value - The value of the property.
 * @returns An array of objects with the following properties:
 *     id: a string
 *     name: a string
 *     value: a string
*/
import {
    NcDatatype,
    NcDatatypeType,
    NcFieldDescriptor,
    ValueHolder,
    ValueHolderMap,
    } from "../global/Types";

/**
 * HSL to RGB converter
 * @param oid - Object ID
 * @param id - unique property id
 * @param props - property map
 * @returns value structure
 */

// Value object for rendering NcObject property
export function makePropValue(oid: number, id: string, valueHolder: ValueHolder) {
    return {
        oid: oid,
        id: id,
        key: oid + "." + id,
        name: valueHolder.name,
        description: valueHolder.description,
        valueHolder: valueHolder
    };
}

// Value object for rendering Struct
export function makeStructValue(oid: number, id: string, parentKey: string, name: string, valueHolder: any) {
   return {
       oid: oid,
       id: id,
       key: parentKey + "." + name + "." + valueHolder.name,
       name: valueHolder.name,
       description: valueHolder.description,
       valueHolder: valueHolder
   };
}

// Value object for rendering sequence item
export function makeSequenceValue(oid: number, id: string, parentKey: string, name: string, valueHolder: ValueHolder, index: number) {
    return {
        oid: oid,
        id: id,
        key: parentKey + "." + name + "." + index,
        valueHolder: valueHolder,
        index: index
    };
}

// Is this value read only
export function isReadOnly(valueHolder: ValueHolder) {
    return valueHolder.isReadOnly;
}

// Is this value a struct
export function isStructDatatype(valueHolder: ValueHolder) {
    if (valueHolder.datatype) {
        return valueHolder.datatype.type === NcDatatypeType.NcStruct;
    }
    return false;
}

export function makeDefaultValue(datatype: string | undefined) {
    if (datatype === "NcInt16" || datatype === "NcInt32" || datatype === "NcInt64" || datatype === "NcUint16" || datatype === "NcUint32" || datatype === "NcUint64") {
        return 0;
    }
    if (datatype === "NcFloat32" || datatype === "NcFloat64") {
        return 0.0;
    }
    if (datatype === "NcBoolean") {
        return false;
    }

    return ""
}


export const makeValueHolder = async (value: any, isSequence: boolean, datatype: NcDatatype, isReadOnly: boolean, typeName: string, name: string | undefined, description: string | undefined, defaultValues?: boolean ): Promise<ValueHolder> => {

    if (datatype === undefined) {
        return {
            value: defaultValues ? "" : value,
            values: undefined,
            valueMap: undefined,
            datatype: datatype,
            name: name,
            description: description,
            isReadOnly: isReadOnly,
            typeName: typeName
        }
    }

    if (value !== undefined && value !== null && value.constructor === Object) {
        // In the case of sequences of structs where each value in the struct had no top level identifier (name/description),
        // if the struct itself has a name/role and description we'll use them
        if (name === undefined ) {
            if("name" in value) {
                name = value["name"]
            }
        }
        if (name === undefined ) {
            if("role" in value) {
                name = value["role"]
            }
        }

        if (description === undefined) {
            if("description" in value) {
                description = value["description"]
            }
        }
    }
    if (value !== null || defaultValues) {
        if (isSequence) {
            var sequenceValues = [] as any
            if (Array.isArray(value)) {
                for (const elem of value) {
                    var sv = makeValueHolder(elem, false, datatype, isReadOnly, typeName, undefined, undefined) as Promise<ValueHolder>
                    sequenceValues.push(await sv)
                }
            }
            else {
                var ssv = makeValueHolder(makeDefaultValue(typeName), false, datatype, isReadOnly, typeName, undefined, undefined) as Promise<ValueHolder>
                sequenceValues.push(await ssv)
            }
            return {
                    value: undefined,
                    values: sequenceValues,
                    valueMap: undefined,
                    datatype: datatype,
                    name: name,
                    description: description,
                    isReadOnly: isReadOnly,
                    typeName: typeName
            }
        }

        if (datatype.type === NcDatatypeType.NcStruct)
        {
            if (datatype.fields) {
                var fields = datatype.fields as NcFieldDescriptor[]

                var structValues = {} as ValueHolderMap

                for (const field of fields) {
                    let actualValue = defaultValues ? makeDefaultValue(field.datatype?.typeName) : typeof value === 'object' ? value[field.name] : undefined
                    var stv = makeValueHolder(actualValue, field.isSequence, field.datatype as NcDatatype, isReadOnly, field.typeName, field.name, field.description) as Promise<ValueHolder>
                    structValues[field.name] = await stv
                }

            //    return structValues
                return {
                    value: undefined,
                    values: undefined,
                    valueMap: structValues,
                    datatype: datatype,
                    name: name,
                    description: description,
                    isReadOnly: isReadOnly,
                    typeName: typeName
                }
            }
        }
    }

    return {
        value: defaultValues ? makeDefaultValue(typeName) : value,
        values: undefined,
        valueMap: undefined,
        datatype: datatype,
        name: name,
        description: description,
        isReadOnly: isReadOnly,
        typeName: typeName
    }
}
