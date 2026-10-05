import React, { useState } from 'react';
import {
    Button,
    FormHelperText,
    InputAdornment,
    MenuItem,
    Switch,
    TextField,
    Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useField } from 'react-final-form';
import { commitParamText, shownParamText } from './paramValue';

const useStyles = makeStyles({
    boolLabel: {
        display: 'block',
        lineHeight: 1.2,
    },
    switchRow: {
        display: 'flex',
        alignItems: 'center',
        minHeight: 48,
    },
    switchWords: {
        marginLeft: 'auto',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
    // The stock switch travels 20px. Halfway is the auto/null position.
    centre: {
        transform: 'translateX(10px)',
    },
});

const wordStyle = selected => ({
    minWidth: 0,
    textTransform: 'none',
    padding: '0 4px',
    fontWeight: selected ? 600 : 400,
});

const WordButton = ({ selected, children, onClick, onMouseDown }) => (
    <Button
        size="small"
        color={selected ? 'primary' : 'default'}
        onMouseDown={onMouseDown}
        onClick={onClick}
        style={wordStyle(selected)}
    >
        {children}
    </Button>
);

const Helper = ({ helperText }) =>
    typeof helperText === 'string' && helperText !== '' ? (
        <FormHelperText>{helperText}</FormHelperText>
    ) : null;

const BooleanParam = ({
    label,
    nullable,
    auto,
    value,
    onChange,
    className,
    helperText,
}) => {
    const classes = useStyles();
    const centred = value === 'auto' || value === null;
    return (
        <div className={className}>
            <Typography
                variant="caption"
                color="textSecondary"
                className={classes.boolLabel}
            >
                {label}
            </Typography>
            <div className={classes.switchRow}>
                <Switch
                    color="primary"
                    checked={value === true}
                    onChange={event => onChange(event.target.checked)}
                    classes={
                        centred ? { switchBase: classes.centre } : undefined
                    }
                />
                {(auto || nullable) && (
                    <span className={classes.switchWords}>
                        {auto && (
                            <WordButton
                                selected={value === 'auto'}
                                onClick={() => onChange('auto')}
                            >
                                auto
                            </WordButton>
                        )}
                        {nullable && (
                            <WordButton
                                selected={value === null}
                                onClick={() => onChange(null)}
                            >
                                null
                            </WordButton>
                        )}
                    </span>
                )}
            </div>
            <Helper helperText={helperText} />
        </div>
    );
};

const TextParam = ({
    label,
    kind,
    nullable,
    auto,
    choices,
    value,
    onChange,
    onBlur,
    onFocus,
    className,
    helperText,
}) => {
    const [draft, setDraft] = useState(null);
    const shown = shownParamText(value, auto, draft);
    const set = next => {
        setDraft(null);
        onChange(next);
    };
    const words = (auto || nullable) && kind !== 'enum';
    // A blank input next to the words would leave the label across them.
    // Shrink it for auto, null, and "". The selected word shows which one it is.

    return (
        <TextField
            select={kind === 'enum'}
            className={className}
            label={label}
            variant="filled"
            margin="dense"
            value={kind === 'enum' ? value || '' : shown}
            InputLabelProps={
                words && shown === '' ? { shrink: true } : undefined
            }
            helperText={
                typeof helperText === 'string' && helperText !== ''
                    ? helperText
                    : undefined
            }
            inputProps={{ spellCheck: 'false' }}
            onFocus={event => {
                if (!(auto && value === 'auto') && value !== null) {
                    setDraft(shown);
                }
                onFocus(event);
            }}
            onChange={event => {
                if (kind === 'enum') set(event.target.value);
                else setDraft(event.target.value);
            }}
            onBlur={event => {
                if (kind !== 'enum' && draft !== null) {
                    set(commitParamText(kind, nullable, auto, draft, value));
                }
                onBlur(event);
            }}
            InputProps={{
                endAdornment: words ? (
                    <InputAdornment position="end">
                        {auto && (
                            <WordButton
                                selected={value === 'auto'}
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => set('auto')}
                            >
                                auto
                            </WordButton>
                        )}
                        {nullable && (
                            <WordButton
                                selected={value === null}
                                onMouseDown={event => event.preventDefault()}
                                onClick={() => set(null)}
                            >
                                null
                            </WordButton>
                        )}
                    </InputAdornment>
                ) : null,
            }}
        >
            {kind === 'enum' &&
                choices.map(choice => (
                    <MenuItem key={choice} value={choice}>
                        {choice}
                    </MenuItem>
                ))}
        </TextField>
    );
};

const TransportParamInput = ({
    source,
    label,
    kind = 'string',
    nullable = false,
    auto = false,
    choices = [],
    helperText,
    className,
}) => {
    const {
        input: { value, onChange, onBlur, onFocus },
    } = useField(source, {
        // A nullable field must keep JSON null, so the null word is shown selected.
        // "" must stay "" rather than becoming undefined.
        allowNull: nullable,
        parse: value => value,
    });
    const props = {
        label,
        nullable,
        auto,
        value,
        onChange,
        className,
        helperText,
    };
    if (kind === 'boolean') return <BooleanParam {...props} />;
    return (
        <TextParam
            {...props}
            kind={kind}
            choices={choices}
            onBlur={onBlur}
            onFocus={onFocus}
        />
    );
};

export default TransportParamInput;
