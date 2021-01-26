// Device Types in the NMOS Parameter Registers
// see https://github.com/AMWA-TV/nmos-parameter-registers/tree/master/device-types
export const DEVICE_TYPE_INFO = {
    'urn:x-nmos:device:generic': {
        label: 'Generic Device',
    },
    'urn:x-nmos:device:pipeline': {
        label: 'Pipeline Device',
    },
};

// Device Control Types in the NMOS Parameter Registers
// see https://github.com/AMWA-TV/nmos-parameter-registers/tree/master/device-control-types
export const CONTROL_TYPE_INFO = {
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
export const FORMAT_INFO = {
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
export const TRANSPORT_INFO = {
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
