import { Tooltip, Typography } from '@material-ui/core';
import { get, map } from 'lodash';
import HintTypography from './HintTypography';
import { FRIENDLY_PARAMETERS, useJSONSetting } from '../settings';

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

export const Parameter = ({ register, value }) => {
    const [friendlyFirst] = useJSONSetting(FRIENDLY_PARAMETERS, false);
    const unversioned = unversionedParameter(value);
    const version = parameterVersion(value);
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
                    <HintTypography variant="body2">
                        {friendlyFirst ? friendly : unfriendly}
                    </HintTypography>
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

export const ParameterField = ({ register, record, source }) => (
    <Parameter register={register} value={get(record, source)} />
);

ParameterField.defaultProps = {
    addLabel: true,
};

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

// Tags in the NMOS Parameter Registers
// see https://github.com/AMWA-TV/nmos-parameter-registers/tree/master/tags
export const TAGS = {
    'urn:x-nmos:tag:grouphint': {
        label: 'Group Hint',
        versions: ['v1.0'],
    },
    // Work-in-progress BCP-002-02 Distinguishing Information for NMOS Node and Device Resources
    // See https://specs.amwa.tv/bcp-002-02/
    'urn:x-nmos:tag:asset:facts:manufacturer': {
        label: 'Manufacturer',
        versions: ['v1.0'],
    },
    'urn:x-nmos:tag:asset:facts:product': {
        label: 'Product',
        versions: ['v1.0'],
    },
    'urn:x-nmos:tag:asset:facts:instance': {
        label: 'Instance',
        versions: ['v1.0'],
    },
    'urn:x-nmos:tag:asset:facts:application': {
        label: 'Application',
        versions: ['v1.0'],
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
