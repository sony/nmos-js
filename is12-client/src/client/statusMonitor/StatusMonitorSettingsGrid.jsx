import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import EditablePropertyControl from '../EditablePropertyControl';
import CollapsibleMonitorSection from './CollapsibleMonitorSection';
import { elementIdFromKey, getEnumLabel } from './statusMonitorUtils';
import { NcDatatypeType } from '../../global/Types';

const EDITABLE_SETTING_NAMES = new Set(['userLabel', 'statusReportingDelay']);

function ReadOnlySettingValue({ valueHolder }) {
    if (valueHolder.value === null || valueHolder.value === undefined || valueHolder.value === '') {
        return (
            <Typography variant="body2" color="text.disabled">
                —
            </Typography>
        );
    }

    const displayValue = valueHolder.datatype?.type === NcDatatypeType.NcEnum
        ? getEnumLabel(valueHolder)
        : String(valueHolder.value);

    return (
        <Typography variant="body2" color="text.primary" sx={{ wordBreak: 'break-word' }}>
            {displayValue}
        </Typography>
    );
}

ReadOnlySettingValue.propTypes = {
    valueHolder: PropTypes.object.isRequired,
};

function SettingsValue({ propKey, valueHolder, oid }) {
    const usesEditableControl = !valueHolder.isReadOnly && (
        EDITABLE_SETTING_NAMES.has(valueHolder.name)
        || valueHolder.datatype?.typeName === 'NcBoolean'
    );

    if (usesEditableControl) {
        return (
            <EditablePropertyControl
                valueHolder={valueHolder}
                oid={oid}
                propertyId={elementIdFromKey(propKey)}
                compact
            />
        );
    }

    return <ReadOnlySettingValue valueHolder={valueHolder} />;
}

SettingsValue.propTypes = {
    propKey: PropTypes.string.isRequired,
    valueHolder: PropTypes.object.isRequired,
    oid: PropTypes.number.isRequired,
};

export default function StatusMonitorSettingsGrid({ settingsProperties, oid }) {
    if (!settingsProperties || settingsProperties.length === 0) {
        return null;
    }

    return (
        <CollapsibleMonitorSection title="Settings" ariaLabel="expand settings">
            <Box
                sx={{
                    pt: 1,
                    pb: 0.5,
                    px: 1,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    border: 1,
                    borderColor: 'divider',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', sm: 'minmax(10rem, 14rem) minmax(0, 1fr)' },
                        columnGap: 2,
                        rowGap: 1.25,
                        alignItems: 'center',
                    }}
                >
                    {settingsProperties.map(({ propKey, valueHolder, label }) => (
                        <Box key={propKey} sx={{ display: 'contents' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                {label}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', minHeight: '1.4375em' }}>
                                <SettingsValue propKey={propKey} valueHolder={valueHolder} oid={oid} />
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        </CollapsibleMonitorSection>
    );
}

StatusMonitorSettingsGrid.propTypes = {
    settingsProperties: PropTypes.arrayOf(PropTypes.shape({
        propKey: PropTypes.string.isRequired,
        valueHolder: PropTypes.object.isRequired,
        label: PropTypes.string.isRequired,
    })).isRequired,
    oid: PropTypes.number.isRequired,
};
