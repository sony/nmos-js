import React from 'react';
import { Tooltip, Typography } from '@material-ui/core';
import { SelectInput } from 'react-admin';
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

export const ActivationModeInput = props => {
    const [friendlyFirst] = useJSONSetting(FRIENDLY_PARAMETERS, false);
    return (
        <SelectInput
            {...props}
            allowEmpty
            choices={activationModeChoices(friendlyFirst)}
            format={value => (value == null ? '' : value)}
            parse={value => (value === '' ? null : value)}
            translateChoice={false}
        />
    );
};
