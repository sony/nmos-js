import React, { useState } from 'react';
import { MenuItem, TextField } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useField } from 'react-final-form';
import TransportParamInput from './TransportParamInput';
import { convertParam } from './paramValue';

const useStyles = makeStyles(theme => ({
    typeInput: {
        width: theme.spacing(14),
        marginLeft: theme.spacing(2),
    },
}));

const paramTypeChoices = ['string', 'integer', 'number', 'boolean'];

const ParamTypeInput = ({ value, onChange }) => {
    const classes = useStyles();
    return (
        <TextField
            select
            className={classes.typeInput}
            label="Type"
            variant="filled"
            margin="dense"
            value={value}
            onChange={event => onChange(event.target.value)}
        >
            {paramTypeChoices.map(choice => (
                <MenuItem key={choice} value={choice}>
                    {choice}
                </MenuItem>
            ))}
        </TextField>
    );
};

const initialKind = value => {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'integer' : 'number';
    }
    return 'string';
};

// One parameter whose type is not known from the transport. auto and null
// are always available. The type starts from this leg's value.
const GenericTransportParamInput = ({ source, className, ...props }) => {
    const {
        input: { value, onChange },
    } = useField(source, {
        allowNull: true,
        parse: value => value,
    });
    const [kind, setKind] = useState(() => initialKind(value));
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <TransportParamInput
                {...props}
                source={source}
                kind={kind}
                nullable
                auto
                className={className}
            />
            <ParamTypeInput
                value={kind}
                onChange={next => {
                    onChange(convertParam(value, next));
                    setKind(next);
                }}
            />
        </div>
    );
};

export default GenericTransportParamInput;
