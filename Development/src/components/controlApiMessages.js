import { get } from 'lodash';
import { TRANSPORTS } from './ParameterRegisters';

export const CONNECTION_API_NOT_AVAILABLE = 'Connection API is not available.';
export const CHANNEL_MAPPING_API_NOT_AVAILABLE =
    'Channel Mapping API is not available.';
export const TRANSPORT_FILE_NOT_AVAILABLE = 'Transport file is not available.';

export const transportFileHint = transport => {
    const base = transport && transport.split('.')[0];
    if (!base || base === 'urn:x-nmos:transport:rtp') {
        return TRANSPORT_FILE_NOT_AVAILABLE;
    }
    const info = get(TRANSPORTS, base);
    return info
        ? `${info.label} does not use a transport file.`
        : 'This transport does not use a transport file.';
};
