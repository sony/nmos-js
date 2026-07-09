import { useContext, useState } from 'react';
import UploadIcon from '@mui/icons-material/Backup';
import EditIcon from '@mui/icons-material/Edit';
import {
    Box,
    Checkbox,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    OutlinedInput,
    Select,
} from '@mui/material';
import { DataProviderContext } from './NCAController';
import { NcDatatypeType } from '../global/Types';
import { isElementIdDatatype } from '../middleware/HelperFunctions';

const NUMERIC_TYPE_NAMES = new Set([
    'NcInt16',
    'NcInt32',
    'NcInt64',
    'NcUint16',
    'NcUint32',
    'NcUint64',
    'NcFloat32',
    'NcFloat64',
]);

function isValidSubmitValue(valueHolder, newValue, enforceMinimumOne = false) {
    if (valueHolder.name === 'userLabel') {
        return newValue !== '' && (newValue?.length ?? 0) <= 30;
    }

    if (NUMERIC_TYPE_NAMES.has(valueHolder.datatype?.typeName)) {
        const numericValue = Number(newValue);

        if (newValue == null || newValue === '' || Number.isNaN(numericValue)) {
            return false;
        }

        if (enforceMinimumOne) {
            return numericValue >= 1;
        }

        return true;
    }

    return newValue !== '';
}

function submitPropertyValue(
    DataProvider,
    oid,
    propertyId,
    newValue,
    valueHolder,
    isMethod,
    structValue,
    index,
    parameterName,
    newInvariantType
) {
    if (isMethod) {
        if (index !== undefined) {
            DataProvider.changeSequenceParameter(oid, propertyId, index, parameterName, newValue, structValue, valueHolder);
        } else {
            DataProvider.changeParameter(oid, propertyId, parameterName, newValue, structValue, valueHolder, newInvariantType);
        }
        return;
    }

    if (index !== undefined) {
        DataProvider.changeSequencePropertyValue(oid, propertyId, index, newValue, structValue, valueHolder);
    } else {
        DataProvider.changeValue(oid, propertyId, newValue, structValue, valueHolder);
    }
}

export default function EditablePropertyControl({
    valueHolder,
    oid,
    propertyId,
    isMethod = false,
    parentValueHolder,
    index,
    parameterName,
    compact = false,
}) {
    const datatype = valueHolder?.datatype;
    const value = valueHolder?.value;
    const structValue = parentValueHolder?.valueMap;
    const invariantType = undefined;
    const isNumericType = NUMERIC_TYPE_NAMES.has(datatype?.typeName);

    const [editable, setEditable] = useState(false);
    const [newValue, setNewValue] = useState(value);
    const [newInvariantType, setInvariantType] = useState(invariantType);

    const DataProvider = useContext(DataProviderContext);

    if (!valueHolder) {
        return null;
    }

    const inputWidthSx = compact
        ? {
            fontSize: '0.9rem',
            width: `${((String(editable ? newValue : value ?? '').length || 5) / 2.5) + 3}rem`,
            maxWidth: '20rem',
        }
        : { fontSize: '0.9rem', width: `${((newValue ? String(newValue).length : 5) / 2.5) + 3}rem`, maxWidth: '14rem' };

    if (datatype && datatype.type === NcDatatypeType.NcEnum) {
        return (
            <FormControl fullWidth={compact}>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    sx={inputWidthSx}
                    size="small"
                    displayEmpty
                    value={value ?? ''}
                    onChange={(event) => {
                        setNewValue(event.target.value);
                        submitPropertyValue(
                            DataProvider,
                            oid,
                            propertyId,
                            event.target.value,
                            valueHolder,
                            isMethod,
                            structValue,
                            index,
                            parameterName,
                            newInvariantType
                        );
                    }}
                >
                    {datatype.enum.map((enumValue) => (
                        <MenuItem value={enumValue.value} key={`${valueHolder.name}-${enumValue.name}`}>
                            {enumValue.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }

    if (datatype && datatype.typeName === 'NcBoolean') {
        const handleChange = () => {
            submitPropertyValue(
                DataProvider,
                oid,
                propertyId,
                !value,
                valueHolder,
                isMethod,
                structValue,
                index,
                parameterName,
                newInvariantType
            );
        };

        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    ...(compact ? { width: '100%', minHeight: '1.4375em' } : {}),
                }}
            >
                <Checkbox
                    size={compact ? 'small' : 'medium'}
                    checked={Boolean(value)}
                    onChange={handleChange}
                    sx={compact ? { p: 0.25, ml: -0.25 } : undefined}
                    inputProps={{ 'aria-label': valueHolder.name }}
                />
            </Box>
        );
    }

    // level and index are only 1-based when they belong to an ID, not for any
    // parameter that happens to be named that way
    const enforceMinimumOne =
        isMethod &&
        (valueHolder.name === 'index' || valueHolder.name === 'level') &&
        isElementIdDatatype(parentValueHolder?.datatype);

    const canSubmit = isValidSubmitValue(valueHolder, newValue, enforceMinimumOne);
    const hasMinimumOneConstraint = enforceMinimumOne;

    const inlineControlSx = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        flexWrap: 'wrap',
        maxWidth: '100%',
    };

    return (
        <Box sx={inlineControlSx}>
            {editable ? (
                <FormControl>
                    <InputLabel htmlFor={`editable-${oid}-${propertyId.level}-${propertyId.index}`}>
                        {valueHolder.name}
                    </InputLabel>
                    <OutlinedInput
                        id={`editable-${oid}-${propertyId.level}-${propertyId.index}`}
                        sx={inputWidthSx}
                        label={valueHolder.name}
                        size="small"
                        type={isNumericType ? 'number' : 'text'}
                        autoFocus={true}
                        error={Boolean(newValue) && !canSubmit}
                        onKeyDown={(key) => {
                            if (key.code === 'Enter' && canSubmit) {
                                setEditable(false);
                                submitPropertyValue(
                                    DataProvider,
                                    oid,
                                    propertyId,
                                    newValue,
                                    valueHolder,
                                    isMethod,
                                    structValue,
                                    index,
                                    parameterName,
                                    newInvariantType
                                );
                            }
                        }}
                        onChange={(event) => {
                            setNewValue(event.target.value);
                        }}
                        value={newValue ?? ''}
                        inputProps={hasMinimumOneConstraint ? { min: 1 } : undefined}                        
                    />
                </FormControl>
            ) : (
                <span
                    style={{
                        maxWidth: compact ? undefined : '5rem',
                        overflowWrap: 'break-word',
                    }}
                    onDoubleClick={() => setEditable(true)}
                >
                    {value ?? '—'}
                </span>
            )}
            {editable ? (
                <IconButton
                    aria-label="save value"
                    type="submit"
                    size="small"
                    onClick={() => {
                        setEditable(false);
                        if (canSubmit) {
                            submitPropertyValue(
                                DataProvider,
                                oid,
                                propertyId,
                                newValue,
                                valueHolder,
                                isMethod,
                                structValue,
                                index,
                                parameterName,
                                newInvariantType
                            );
                        }
                    }}
                >
                    {canSubmit ? <UploadIcon /> : null}
                </IconButton>
            ) : (
                <IconButton
                    aria-label="edit value"
                    size="small"
                    onClick={() => {
                        setNewValue(value);
                        setEditable(true);
                    }}
                >
                    <EditIcon />
                </IconButton>
            )}
            {isMethod && datatype === undefined ? (
                <Select
                    labelId="type-hint-select-label"
                    id="type-hint-select"
                    sx={{ fontSize: '0.9rem', width: '9rem', maxWidth: '14rem' }}
                    size="small"
                    value={invariantType}
                    onChange={(event) => {
                        setInvariantType(event.target.value);
                        DataProvider.changeParameter(
                            oid,
                            propertyId,
                            parameterName,
                            newValue,
                            structValue,
                            valueHolder,
                            event.target.value
                        );
                    }}
                >
                    <MenuItem value="NcString">String</MenuItem>
                    <MenuItem value="NcInt64">Number</MenuItem>
                    <MenuItem value="NcBoolean">Boolean</MenuItem>
                </Select>
            ) : null}
        </Box>
    );
}
