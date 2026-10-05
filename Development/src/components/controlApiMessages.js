import { get } from 'lodash';
import { TRANSPORTS, transportOmitsTransportFile } from './ParameterRegisters';
import { parseTransportUrn } from '../transportUrn';

export const CONNECTION_API_NOT_AVAILABLE = 'Connection API is not available.';
export const CHANNEL_MAPPING_API_NOT_AVAILABLE =
    'Channel Mapping API is not available.';
export const TRANSPORT_FILE_NOT_AVAILABLE = 'Transport file is not available.';

export const missingTransportFileHint = transport => {
    if (transportOmitsTransportFile(transport)) {
        const base = get(parseTransportUrn(transport), 'base');
        return `${get(TRANSPORTS, [base, 'label'])} does not use a transport file.`;
    }
    return TRANSPORT_FILE_NOT_AVAILABLE;
};
