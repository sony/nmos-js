/**
 * By David Patyk - 2022 - david.patyk@sony.com
 * Data Tables:
 *  Table generator for displaying data from NCA blocks
 */
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import {useContext, useState} from "react";
import UploadIcon from "@mui/icons-material/Backup";
import EditIcon from "@mui/icons-material/Edit";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SendIcon from '@mui/icons-material/Send';
import PropTypes from "prop-types";
import { DataProviderContext } from "./NCAController";
import { makePropValue, makeStructValue, makeSequenceValue, isReadOnly, isStructDatatype } from "../middleware/HelperFunctions";
import { PROPERTY_IDS } from "../global/IS12CommandTemplates";
import { NcDatatypeType } from "../global/Types"

import {
    Box,
    Button,
    Card,
    Checkbox,
    Collapse,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
    Typography
} from "@mui/material";

/**
 * Main tables object which holds the list of tables
 */

function addObjects(children, structure, state, tables) {
    children.map((oid) => {
        if (oid in structure) {
            let node = structure[oid].Node;
            let valueHolderMap = structure[oid].ValueHolderMap;
            let methods = structure[oid].Methods;

            let table = {
                classId: node.classId,
                oid: node.oid,
                name: node.role,
                description: node.description,
                userLabel: (state[`${node.oid}.${PROPERTY_IDS.OBJECT.USER_LABEL.level}.${PROPERTY_IDS.OBJECT.USER_LABEL.index}`] !== '' ? state[`${node.oid}.${PROPERTY_IDS.OBJECT.USER_LABEL.level}.${PROPERTY_IDS.OBJECT.USER_LABEL.index}`] : 'none'),
                valueHolderMap: valueHolderMap,
                children: node.children,
                childNodes: [],
                methods: methods
            }
            addObjects(table.children, structure, state, table.childNodes)

            tables.push(table)
        }
        else {
            console.log("oid not in structure " + oid)
        }
        return 0;
    })
}


export default function Tables(state) {
    if (!state.providerActive) return
    let structure = state.structure;
    let rootBlock = state.rootBlock;

    let tables = []

    addObjects(rootBlock, structure, state, tables)

    return (
        <>
        {[...tables].map((elem) =>
            <Tab state={state} node={elem} key={elem.name}/>
        )}
        </>
    )
}

/**
 * Each Tab is a section with a block header and children nodes
 */
function Tab(valueRow) {

    const { node } = valueRow
    const { state } = valueRow

    const [openTab, setOpenTab] = useState(false);

    return (

        <Card variant="outlined" sx={{ width: '100%', display: 'flex-start', flexDirection: 'row' }} key={node.name}>
            <Box sx={{ pl: 1, pt: 1, display: 'flex', bgcolor: '#212a2f' }}>
                <Grid>
                <IconButton
                    aria-label='expand row'
                    size='small'
                    onClick={() => setOpenTab(!openTab)}
                >{openTab ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
                </Grid>
                <Grid>
                    <Typography component="h3" variant="h6" color="white" gutterBottom> { node.name } </Typography>
                </Grid>
            </Box>
            <Collapse in={openTab} timeout='auto' unmountOnExit>
                <BlockTable key={node.name} row={node} state={state}/>
            </Collapse>
        </Card>
    )
}

// JSX Element for most rows
function BlockTable(valueRow) {
    const { row } = valueRow;
    const { state } = valueRow;

    return (
        <>
            <Table stickyHeader aria-label='collapsible table'>
                <TableBody>
                    <TableRow>
                        <TableCell sx={{ width: '35%' }}>{row.description}</TableCell>
                        <TableCell sx={{ width: '20%' }}><UserLabelSection row={row.valueHolderMap} oid={row.oid}/></TableCell>
                    </TableRow>
                    <TableRow>
                    <TableCell colSpan={2}>
                    {row.childNodes.length > 0 ?
                        <ChildBlockTable key={row.name + 'blocks'} row={row} state={state}/>
                        : null
                    }
                    {row.valueHolderMap !== null && Object.keys(row.valueHolderMap).length > 0 ?
                        <PropsTable key={row.name + 'props'} row={row} state={state} />
                        : null
                    }
                    {row.methods !== null & Object.keys(row.methods).length > 0 ?
                        <MethodsTable key={row.name + 'methods'} row={row} state={state}/>
                        : null
                    }
                    </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </>
    );
}

// JSX Element for Child Blocks of a given Block
function ChildBlockTable(valueRow) {
    const { row } = valueRow;
    const { state } = valueRow;

    const [openBlock, setOpenBlock] = useState(false);

    return (
        <>
            <Box sx={{ pl: 1, pt: 1, display: 'flex', bgcolor: '#212a2f' }}>
                <Grid>
                <IconButton
                    aria-label='expand row'
                    size='small'
                    onClick={() => setOpenBlock(!openBlock)}
                >{openBlock ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
                </Grid>
                <Grid>
                <Typography component="h3" variant="h6" color="white" gutterBottom>Child Members</Typography>
                </Grid>
            </Box>
            <Collapse in={openBlock} timeout='auto' unmountOnExit>
                <Box sx={{ margin: 1 }}>
                    {row.childNodes.map((child) => <BlockTable key={child.name + 'childblock'} row={child} state={state} />
                    )}
                </Box>
            </Collapse>
        </>
    );
}

function MethodsTable(valueRow) {
    const { row } = valueRow;
    const methodMapKeys = Object.keys(row.methods)
    const [openProps, setOpenProps] = useState(false);

    let values = []

    // Each property is formatted for the table
    methodMapKeys.forEach((methodKey) => {
        values.push({
            oid: row.oid,
            id: methodKey,
            key: row.oid + ".m" + methodKey,
            name: row.methods[methodKey].Descriptor.name,
            description: row.methods[methodKey].Descriptor.description,
            valueHolderMap: row.methods[methodKey].ValueHolderMap
        });
    });
    return (
        <>
            <Box sx={{ pl: 1, pt: 1, display: 'flex', bgcolor: '#212a2f' }}>
                <Grid>
                <IconButton
                    aria-label='expand row'
                    size='small'
                    onClick={() => setOpenProps(!openProps)}
                >{openProps ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
                </Grid>
                <Grid>
                <Typography component="h3" variant="h6" color="white" gutterBottom>Methods</Typography>
                </Grid>
            </Box>
            <Collapse in={openProps} timeout='auto' unmountOnExit>
                <Box sx={{ margin: 1 }}>
                    <Table size='small' aria-label='Props'>
                        <TableBody>
                            {values.map((value) => (
                                <ParametersTable key={value.key} row={value}/>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Collapse>
        </>
    );
}

function ParametersTable(valueRow) {
    const { row } = valueRow;
    const valueHolderKeys = Object.keys(row.valueHolderMap)
    const [openProps, setOpenProps] = useState(false);

    const DataProvider = useContext(DataProviderContext)

    // Hmmm, should we avoid these sorts of conversions?
    let formattedId = row.id.split('.')
    let methodId = {
        level: Number(formattedId[0]),
        index: Number(formattedId[1])
    }

    let values = []

    // Each property is formatted for the table
    valueHolderKeys.forEach((propKey) => {
        values.push(
        {
            oid: row.oid,
            id: row.id,
            key: row.oid + ".m" + row.id + "." + propKey,
            name: row.valueHolderMap[propKey].name,
            description: row.valueHolderMap[propKey].description,
            valueHolder: row.valueHolderMap[propKey]
        })
    })

    return (
        <>
            <TableRow>
                <TableCell style={{ width: "3rem" }}>
                    <IconButton
                        aria-label='expand row'
                        size='small'
                        onClick={() => setOpenProps(!openProps)}
                    >{openProps ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
                </TableCell>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Typography variant='h6' gutterBottom component='div'>
                        {row.name}
                    </Typography>
                </TableCell>
                <TableCell style={{ width: "3rem" }}>
                    <Button
                        variant='outlined'
                        endIcon={<SendIcon />}
                        onClick={() => {
                            DataProvider.invokeMethod(row.oid, methodId)
                        }}>Invoke</Button>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={openProps} timeout='auto' unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Table size='small' aria-label='Props'>
                                <TableHead>
                                    <TableRow>
                                        {/* Each roll-down option*/}
                                        <TableCell>Name</TableCell>
                                        <TableCell>Value</TableCell>
                                        <TableCell>Description</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {values.map((value) => (
                                       Array.isArray(value.valueHolder.values) ? <SequenceProperty key={value.key} row={value} isTopLevelProperty={true} isMethod={true} parameterName={value.name}/> : isStructDatatype(value.valueHolder) ? <StructProperty key={value.key} row={value} isMethod={true} parameterName={value.name}/> : <PropertyRow key={value.key} row={value} showDescription={true} isMethod={true} parameterName={value.name}/>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
}


// JSX Element for Child Blocks of a given Block
function PropsTable(valueRow) {
    const { row } = valueRow;
    const valueHolderKeys = Object.keys(row.valueHolderMap)
    const [openProps, setOpenProps] = useState(false);

    let values = []

    // Each property is formatted for the table
    valueHolderKeys.forEach((propKey) => {
        values.push(makePropValue(
            row.oid,
            propKey,
            row.valueHolderMap[propKey]
        ))
    })

    return (
        <>
            <Box sx={{ pl: 1, pt: 1, display: 'flex', bgcolor: '#212a2f' }}>
                <Grid>
                <IconButton
                    aria-label='expand row'
                    size='small'
                    onClick={() => setOpenProps(!openProps)}
                >{openProps ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
                </Grid>
                <Grid>
                <Typography component="h3" variant="h6" color="white" gutterBottom>Properties</Typography>
                </Grid>
            </Box>
            <Collapse in={openProps} timeout='auto' unmountOnExit>
                <Box sx={{ margin: 1 }}>
                    <Table size='small' aria-label='Props'>
                        <TableHead>
                            <TableRow>
                                {/* Each roll-down option*/}
                                <TableCell>Name</TableCell>
                                <TableCell>Value</TableCell>
                                <TableCell>Description</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {values.map((value) => (
                                Array.isArray(value.valueHolder.values) ? <SequenceProperty key={value.key} row={value} isTopLevelProperty={true}/> : isStructDatatype(value.valueHolder) ? <StructProperty key={value.key} row={value}/> : <PropertyRow key={value.key} row={value} showDescription={true}/>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Collapse>
        </>
    );
}

function PropertyRow(valueRow) {
    const { row } = valueRow;
    const { structValue } = valueRow // used if this property is part of a struct. Undefined otherwise.
    const { isMethod } = valueRow
    const { parameterName } = valueRow
    const { index } = valueRow // used if this property is part of a struct which is part of a sequence. Undefined otherwise.
    const { showDescription } = valueRow

    return(<>
        <TableRow>
        <TableCell sx={{ width: "15%", paddingLeft: 2 }}>{row.name}</TableCell>
        <TableCell sx={{ width: '45%' }}>{isReadOnly(row.valueHolder) ? <ReadOnlyProperty row={row} /> : <EditableProperty row={row} structValue={structValue} index={index} isMethod={isMethod} parameterName={parameterName}/>}</TableCell>
        {showDescription ? <TableCell>{row.description}</TableCell> :<></>}
        </TableRow>
        </>)
}

function ValueRow(valueRow) {
    const { row } = valueRow
    const { index } = valueRow
    const { isMethod } = valueRow
    const { parameterName } = valueRow

    return(<>
        <TableRow>
        <TableCell sx={{ width: '45%' }}>{isReadOnly(row.valueHolder) ? <ReadOnlyProperty row={row} /> : <EditableProperty row={row} index={index} isMethod={isMethod} parameterName={parameterName}/>}</TableCell>
        </TableRow>
        </>)
}

function StructProperty(valueRow) {
    const { row } = valueRow;
    const { index } = valueRow
    const { isMethod } = valueRow
    const { parameterName } = valueRow
    const [openProps, setOpenProps] = useState(false);

    var values_map = []
    let valueMap = row.valueHolder.valueMap //map of the values for this struct

    for (let key in valueMap) {
        var valueHolder = valueMap[key]
        values_map.push(
            makeStructValue(
                row.oid,
                row.id,
                row.key,
                row.name,
                valueHolder
            )
        )
    }

    return(
    <>
    <TableRow>
        <TableCell colSpan={4}>
        <Box sx={{ pl: 1, pt: 1, display: 'flex', bgcolor: '#212a2f' }}>
            <Grid>
            <IconButton
                aria-label='expand row'
                size='small'
                onClick={() => setOpenProps(!openProps)}
            >{openProps ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
            </Grid>
            <Grid>
            <Typography component="h3" variant="h6" color="white" gutterBottom>{row.valueHolder.name}</Typography>
            </Grid>
        </Box>
        <Collapse in={openProps} timeout='auto' unmountOnExit>
            <Box sx={{ margin: 1 }}>
                <Table size='small' aria-label='Props'>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {values_map.map((value) => (
                            Array.isArray(value.valueHolder.values) ? <SequenceProperty key={value.key} row={value} index={index} isMethod={isMethod} parameterName={parameterName}/> : isStructDatatype(value.valueHolder) ? <StructProperty key={value.key} row={value} index={index} isMethod={isMethod} parameterName={parameterName}/> : <PropertyRow key={value.key} row={value} structValue={valueMap} index={index} showDescription={true} isMethod={isMethod} parameterName={parameterName}/>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </Collapse>
        </TableCell>
        </TableRow>
    </>)
}

function SequenceProperty(valueRow) {
    const { row } = valueRow
    const { isTopLevelProperty } = valueRow // Is this a sequence property (true) or is it a sequence as part of a struct
    const { isMethod } = valueRow
    const { parameterName } = valueRow
    const { index } = valueRow
    const [openProps, setOpenProps] = useState(false);

    var values = []
    var sequenceIndex = 0;

    row.valueHolder.values.forEach((valueHolder)=>{
        values.push(
            makeSequenceValue(
                row.oid,
                row.id,
                row.key,
                row.name,
                valueHolder,
                isTopLevelProperty ? sequenceIndex : index
            )
        )
        sequenceIndex++
    })

    return(
    <><TableRow>
        <TableCell style={{ width: "3rem" }}>
            <IconButton
                aria-label='expand row'
                size='small'
                onClick={() => setOpenProps(!openProps)}
            >{openProps ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}</IconButton>
        </TableCell>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Typography variant='h6' gutterBottom component='div'>
                {row.name}
            </Typography>
        </TableCell>
    </TableRow>
     <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={openProps} timeout='auto' unmountOnExit>
                <Box sx={{ margin: 1 }}>
                    <Table size='small' aria-label='Props'>
                        <TableBody>
                            {values.map((value) => (
                                isStructDatatype(value.valueHolder) ? <StructProperty key={value.key} row={value} index={value.index} isMethod={isMethod} parameterName={parameterName}/> : <ValueRow key={value.key} row={value} index={value.index} isMethod={isMethod} parameterName={parameterName}/>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            </Collapse>
        </TableCell>
      </TableRow>
    </>)
}

function EditableProperty(valueRow) {
    const { row } = valueRow;
    const { isMethod } = valueRow
    const { parameterName } = valueRow
    const { structValue } = valueRow
    const { index } = valueRow

    let formattedId = row.id.split('.')
    let propertyId = {
        level: Number(formattedId[0]),
        index: Number(formattedId[1])
    }

    return CreateEditableProperty(row.valueHolder, row.oid, propertyId, isMethod, structValue, index, parameterName)
}

/**
 * Used for a modifiable user label
 */
function UserLabelSection(props) {
    const { row } = props;
    const { oid } = props;

    let userLabel = row["1.6"]

    return CreateEditableProperty(userLabel, oid, PROPERTY_IDS.OBJECT.USER_LABEL, false, undefined, undefined, undefined)
}

// need to use state of underlying array in state not value of single element
function CreateEditableProperty(row, oid, propertyId, isMethod, structValue, index, parameterName) {
    let valueHolder = row
    let datatype = valueHolder.datatype
    let value = valueHolder.value
    let invariantType = undefined // use by method parameters where we have an invariant type ("any") and need to hint what the cast should be

    let isSequence = index !== undefined

    const [editable, setEditable] = useState(false)
    const [newValue, setNewValue] = useState(value)
    const [newInvariantType, setInvariantType] = useState(invariantType)

    const DataProvider = useContext(DataProviderContext)

    // If datatype is null then this property is an invariant 'any' property. Model as a string
    if (datatype && datatype.type === NcDatatypeType.NcEnum) {
        return (
            <>
                {/* DROP DOWN LIST: */}
                <FormControl fullWidth>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        sx={{ fontSize: '0.9rem', width: `${((value ? value.length : 5)/ 2.5) + 3}rem`, maxWidth: '14rem' }}
                        size='small'
                        value={value}
                        onChange={(e) => {
                            setNewValue(e.target.value)
                            if(isMethod){
                                if(isSequence) {
                                    DataProvider.changeSequenceParameter(oid, propertyId, index, parameterName, e.target.value, structValue, valueHolder)
                                }else{
                                    DataProvider.changeParameter(oid, propertyId, parameterName, e.target.value, structValue, valueHolder)
                                }
                            }
                            else {
                                if(isSequence) {
                                    DataProvider.changeSequencePropertyValue(oid, propertyId, index, e.target.value, structValue, valueHolder)
                                }else{
                                    DataProvider.changeValue(oid, propertyId, e.target.value, structValue, valueHolder)
                                }
                            }
                        }}
                    >
                        {datatype.enum.map((enumValue) => (<MenuItem value={enumValue.value} key={row.id + enumValue.name} >{enumValue.name}</MenuItem>))}
                    </Select>
                </FormControl>
            </>)
    }

    if (datatype && datatype.typeName === "NcBoolean") {
        const handleChange = () => {
            if(isMethod){
                if(isSequence) {
                    DataProvider.changeSequenceParameter(oid, propertyId, index, parameterName, !value, structValue, valueHolder)
                }else{
                    DataProvider.changeParameter(oid, propertyId, parameterName, !value, structValue, valueHolder)
                }
            }
            else {
                if(isSequence) {
                    DataProvider.changeSequencePropertyValue(oid, propertyId, index, !value, structValue, valueHolder)
                }else{
                    DataProvider.changeValue(oid, propertyId, !value, structValue, valueHolder)
                }
            }
        };

        return (
            <>
                {/* Checkbox: */}
                <FormControl>
                    <Checkbox
                      checked={value}
                      onChange={handleChange}
                      inputProps={{ 'aria-label': 'controlled' }}
                    />
                </FormControl>
            </>)
    }

    return (
        <>
            {/* EDIT STRING: */}
            {editable ?
                <FormControl>
                    <InputLabel htmlFor="defInput">{row.name}</InputLabel>
                    <OutlinedInput
                        id="defInput"
                        sx={{ fontSize: '0.9rem', width: `${((newValue ? newValue.length : 5)/ 2.5) + 3}rem`, maxWidth: '14rem' }}
                        label="User Label"
                        size='small'
                        autoFocus={true}
                        error={newValue && (newValue === '' || newValue.length > 30)}
                        onKeyDown={(key) => {
                            if (key.code === "Enter" && newValue !== '' && newValue.length <= 30) {
                                setEditable(!editable)
                                if(isMethod){
                                    if(isSequence) {
                                        DataProvider.changeSequenceParameter(oid, propertyId, index, parameterName, newValue, structValue, valueHolder)
                                    }else{
                                        DataProvider.changeParameter(oid, propertyId, parameterName, newValue, structValue, valueHolder)
                                    }
                                }
                                else {
                                    if(isSequence) {
                                        DataProvider.changeSequencePropertyValue(oid, propertyId, index, newValue, structValue, valueHolder)
                                    }else{
                                        DataProvider.changeValue(oid, propertyId, newValue, structValue, valueHolder)
                                    }
                                }
                            }
                        }}
                        onChange={(e) => {
                            setNewValue(e.target.value)
                        }}
                        value={newValue}
                    />
                </FormControl>
                :
                <span
                    style={{ maxWidth: '5rem', overflowWrap: 'break-word' }}
                    onDoubleClick={() => setEditable(!editable)}
                >{value}</span>
            }
            {/* ICON NEXT TO STRING: */}
            {editable ?
                <IconButton
                    aria-label='edit value'
                    type='submit'
                    onClick={() => {
                        setEditable(!editable)
                        if(isMethod){
                            if(isSequence) {
                                DataProvider.changeSequenceParameter(oid, propertyId, index, parameterName, newValue, structValue, valueHolder)
                            }else{
                                DataProvider.changeParameter(oid, propertyId, parameterName, newValue, structValue, valueHolder, newInvariantType)
                            }
                        }
                        else {
                            if(isSequence) {
                                DataProvider.changeSequencePropertyValue(oid, propertyId, index, newValue, structValue, valueHolder)
                            } else {
                                DataProvider.changeValue(oid, propertyId, newValue, structValue, valueHolder)
                            }
                        }
                    }}>
                    {newValue && (newValue !== '' && newValue.length <= 30) ?
                        <UploadIcon />
                        :
                        <></>
                    }
                </IconButton>
                :
                <IconButton
                    aria-label='submit value'
                    size='small'
                    onClick={() => {
                        setNewValue(value)
                        setEditable(!editable)
                    }}
                ><EditIcon /></IconButton>
            }
            <span>{isMethod && datatype === undefined ? "Type Hint: " : ""}{isMethod && datatype === undefined ?
                <Select
                        labelId="type-hint-select-label"
                        id="type-hint-select"
                        sx={{ fontSize: '0.9rem', width: `9rem`, maxWidth: '14rem' }}
                        size='small'
                        value={invariantType}
                        onChange={(e) => {
                            setInvariantType(e.target.value)
                            DataProvider.changeParameter(oid, propertyId, parameterName, newValue, structValue, valueHolder, e.target.value)
                        }}
                    >
                        <MenuItem value="NcString" key={row.id + "string"} >String</MenuItem>
                        <MenuItem value="NcInt64" key={row.id + "number"} >Number</MenuItem>
                        <MenuItem value="NcBoolean" key={row.id + "bool"} >Boolean</MenuItem>
                    </Select>

                : ""}</span>
        </>
    )
}

function ReadOnlyProperty(valueRow) {
    const { row } = valueRow;

    let valueHolder = row.valueHolder
    let datatype = valueHolder.datatype
    let value = valueHolder.value

    if (value === null) {
            return (
            <>
            <p>NULL</p>
            </>
        )
    }

    if (datatype.type === NcDatatypeType.NcPrimitive && datatype.typeName === "NcBoolean") {
        return (
            <>
                {/* Checkbox: */}
                <FormControl>
                    <Checkbox
                      checked={value}
                    />
                </FormControl>
            </>)
    }

    if (datatype.type === NcDatatypeType.NcEnum) {
        //convert enum value to enum
        datatype.enum.map((iter) => {
            if (iter.value === value) {
                value = iter.name
            }
            return 0;
        })
    }
    return (
        <>
        <p>{value}</p>
        </>
    )
}

Tables.propTypes = {
    state: PropTypes.shape({
        provider: PropTypes.object.isRequired,
        isLoading: PropTypes.bool.isRequired,
        providerActive: PropTypes.bool.isRequired,
        structure: PropTypes.shape({}),
    })
}

//SensorRow.propTypes = {
//    rowvalues: PropTypes.shape({
//        enabled: PropTypes.string,
//        name: PropTypes.string.isRequired,
//        userLabel: PropTypes.string.isRequired,
//        value: PropTypes.number.isRequired,
//        unit: PropTypes.string,
//        history: PropTypes.arrayOf(
//            PropTypes.shape({
//                value: PropTypes.number.isRequired,
//                time: PropTypes.string.isRequired,
//            }),
//        ),
//    }).isRequired,
//};