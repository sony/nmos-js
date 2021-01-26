import { forwardRef } from 'react';
import { Tooltip, Typography, withStyles } from '@material-ui/core';
import { get, map } from 'lodash';
import { useJSONSetting } from '../settings';

// const SOME_PARAMETER_REGISTER = {
//    'urn:x-vendor:foo:bar': {
//        label: 'Foo Bar',
//        versions: ['v1.0', 'v1.1'], // optional
//    },
// };

export const unversionedParameter = param => param.split('/')[0];
export const parameterVersion = param => param.split('/')[1];

export const parameterAutocompleteProps = register => ({
    freeSolo: true,
    options: [].concat.apply(
        [],
        map(register, (info, unversioned) =>
            map(
                get(info, 'versions') || [''],
                version => unversioned + (version ? '/' + version : '')
            )
        )
    ),
    renderOption: (option, state) => {
        const unversioned = unversionedParameter(option);
        const version = parameterVersion(option);
        const info = get(register, unversioned);
        if (info) {
            return info.label + (version ? ' ' + version : '');
        } else {
            return unversioned + (version ? '/' + version : '');
        }
    },
});

export const ParameterField = ({ register, record, source }) => {
    const [friendlyFirst] = useJSONSetting('Friendly Parameters', false);
    const param = get(record, source);
    const unversioned = unversionedParameter(param);
    const version = parameterVersion(param);
    const unfriendly = unversioned + (version ? '/' + version : '');
    const info = get(register, unversioned);
    if (info) {
        const friendly = info.label + (version ? ' ' + version : '');
        return (
            <div key={unversioned}>
                <Tooltip
                    title={friendlyFirst ? unfriendly : friendly}
                    placement="right"
                    arrow
                >
                    <TooltipHintTypography variant="body2">
                        {friendlyFirst ? friendly : unfriendly}
                    </TooltipHintTypography>
                </Tooltip>
            </div>
        );
    } else {
        return (
            <Typography key={unversioned} variant="body2">
                {unfriendly}
            </Typography>
        );
    }
};

ParameterField.defaultProps = {
    addLabel: true,
};

const InlineTypography = forwardRef(({ style, ...props }, ref) => (
    <Typography style={{ display: 'inline', ...style }} {...props} ref={ref} />
));

const tooltipHintStyle = theme => ({
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: theme.palette.type === 'dark' ? '#696969' : '#c8c8c8',
});

const TooltipHintTypography = withStyles(theme => ({
    root: tooltipHintStyle(theme),
}))(InlineTypography);

// Device Types in the NMOS Parameter Registers
// see https://github.com/AMWA-TV/nmos-parameter-registers/tree/master/device-types
export const DEVICE_TYPES = {
    'urn:x-nmos:device:generic': {
        label: 'Generic Device',
    },
    'urn:x-nmos:device:pipeline': {
        label: 'Pipeline Device',
    },
};

// Device Control Types in the NMOS Parameter Registers
// see https://github.com/AMWA-TV/nmos-parameter-registers/tree/master/device-control-types
export const CONTROL_TYPES = {
    // IS-05
    'urn:x-nmos:control:sr-ctrl': {
        label: 'Connection API',
        versions: ['v1.1', 'v1.0'],
    },
    // IS-07
    'urn:x-nmos:control:events': {
        label: 'Events API',
        versions: ['v1.0'],
    },
    // IS-08
    'urn:x-nmos:control:cm-ctrl': {
        label: 'Channel Mapping API',
        versions: ['v1.0'],
    },
    // Manifest Base
    'urn:x-nmos:control:manifest-base': {
        label: 'Manifest Base',
        versions: ['v1.0'],
    },
};

// Formats in the NMOS Parameter Registers
// see https://github.com/AMWA-TV/nmos-parameter-registers/tree/master/formats
export const FORMATS = {
    'urn:x-nmos:format:video': {
        label: 'Video',
    },
    'urn:x-nmos:format:audio': {
        label: 'Audio',
    },
    'urn:x-nmos:format:data': {
        label: 'Data',
    },
    'urn:x-nmos:format:mux': {
        label: 'Multiplexed',
    },
};

// Transports in the NMOS Parameter Registers
// see https://github.com/AMWA-TV/nmos-parameter-registers/tree/master/transports
export const TRANSPORTS = {
    'urn:x-nmos:transport:rtp': {
        label: 'RTP',
    },
    'urn:x-nmos:transport:rtp.mcast': {
        label: 'RTP Multicast',
    },
    'urn:x-nmos:transport:rtp.ucast': {
        label: 'RTP Unicast',
    },
    'urn:x-nmos:transport:dash': {
        label: 'DASH',
    },
    'urn:x-nmos:transport:mqtt': {
        label: 'MQTT',
    },
    'urn:x-nmos:transport:websocket': {
        label: 'WebSocket',
    },
};
