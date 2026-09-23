import { get } from 'lodash';
import { TRANSPORTS } from './ParameterRegisters';
import { parseTransportUrn } from '../transportUrn';

export const CONNECTION_API_NOT_AVAILABLE = 'Connection API is not available.';
export const CHANNEL_MAPPING_API_NOT_AVAILABLE =
    'Channel Mapping API is not available.';
export const TRANSPORT_FILE_NOT_AVAILABLE = 'Transport file is not available.';

const TRANSPORT_RTP = 'urn:x-nmos:transport:rtp';

export const transportUsesTransportFile = transport =>
    get(parseTransportUrn(transport), 'base') === TRANSPORT_RTP;

export const transportFileHint = transport => {
    const base = get(parseTransportUrn(transport), 'base');
    if (!base || base === TRANSPORT_RTP) {
        return TRANSPORT_FILE_NOT_AVAILABLE;
    }
    const info = get(TRANSPORTS, base);
    return info
        ? `${info.label} does not use a transport file.`
        : 'This transport does not use a transport file.';
};
