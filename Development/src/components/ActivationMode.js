import React from 'react';
import {
    Divider,
    MenuItem,
    TextField,
    Tooltip,
    Typography,
} from '@material-ui/core';
import { useTheme } from '@material-ui/core/styles';
import { useField } from 'react-final-form';
import get from 'lodash/get';
import HintTypography from './HintTypography';
import { FRIENDLY_PARAMETERS, useJSONSetting } from '../settings';

const ACTIVATION_MODES = {
    activate_immediate: 'Immediate',
    activate_scheduled_relative: 'Scheduled Relative',
    activate_scheduled_absolute: 'Scheduled Absolute',
};

export const activationModeChoices = friendly =>
    Object.entries(ACTIVATION_MODES).map(([id, label]) => ({
        id,
        name: friendly ? label : id,
    }));

// Null is blank. A known mode shows its friendly name or the enum value,
// with the other in the tooltip, following the Friendly Names setting.
export const ActivationModeField = ({ record, source }) => {
    const [friendlyFirst] = useJSONSetting(FRIENDLY_PARAMETERS, false);
    const value = get(record, source);
    const label = ACTIVATION_MODES[value];
    if (!label) {
        return <Typography variant="body2">{value || ''}</Typography>;
    }
    const shown = friendlyFirst ? label : value;
    const other = friendlyFirst ? value : label;
    return (
        <Tooltip title={other} placement="right" arrow>
            <HintTypography variant="body2">{shown}</HintTypography>
        </Tooltip>
    );
};
ActivationModeField.defaultProps = {
    addLabel: true,
};

export const ActivationModeInput = ({
    source,
    label,
    helperText,
    className,
}) => {
    const theme = useTheme();
    const [friendlyFirst] = useJSONSetting(FRIENDLY_PARAMETERS, false);
    const {
        input: { value, onChange, onBlur, onFocus },
    } = useField(source, {
        // This menu always offers null, so the input is given JSON null.
        allowNull: true,
        parse: value => value,
    });
    return (
        <TextField
            select
            className={className}
            label={label}
            variant="filled"
            margin="dense"
            value={value == null ? '' : value}
            // A select shows nothing for "" unless displayEmpty, so the null row
            // would not appear in the closed field. The label then stays up.
            SelectProps={{ displayEmpty: true }}
            InputLabelProps={{ shrink: true }}
            helperText={
                typeof helperText === 'string' && helperText !== ''
                    ? helperText
                    : undefined
            }
            onChange={event =>
                onChange(event.target.value === '' ? null : event.target.value)
            }
            onBlur={onBlur}
            onFocus={onFocus}
        >
            {activationModeChoices(friendlyFirst).map(mode => (
                <MenuItem key={mode.id} value={mode.id}>
                    {mode.name}
                </MenuItem>
            ))}
            <Divider />
            <MenuItem value="">
                {/* 13px is the small button, the same size as the null word. */}
                <span
                    style={{
                        fontSize: 13,
                        fontWeight: value == null ? 600 : 400,
                        color:
                            value == null
                                ? theme.palette.primary.main
                                : undefined,
                    }}
                >
                    null
                </span>
            </MenuItem>
        </TextField>
    );
};
