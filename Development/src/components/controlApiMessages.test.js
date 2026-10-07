import {
    TRANSPORT_FILE_NOT_AVAILABLE,
    missingTransportFileHint,
} from './controlApiMessages';

describe('missingTransportFileHint', () => {
    it('names transports that do not use a transport file', () => {
        expect(missingTransportFileHint('urn:x-nmos:transport:mxl')).toBe(
            'MXL does not use a transport file.'
        );
        expect(missingTransportFileHint('urn:x-nmos:transport:websocket')).toBe(
            'WebSocket does not use a transport file.'
        );
        expect(missingTransportFileHint('urn:x-nmos:transport:mqtt')).toBe(
            'MQTT does not use a transport file.'
        );
        expect(missingTransportFileHint('urn:x-nmos:transport:dash')).toBe(
            'DASH does not use a transport file.'
        );
    });

    it('treats RTP and an unrecognised transport as a missing transport file', () => {
        expect(missingTransportFileHint('urn:x-nmos:transport:rtp')).toBe(
            TRANSPORT_FILE_NOT_AVAILABLE
        );
        expect(missingTransportFileHint('urn:x-nmos:transport:rtp.ucast')).toBe(
            TRANSPORT_FILE_NOT_AVAILABLE
        );
        expect(
            missingTransportFileHint('urn:x-example:transport:carrier-pigeon')
        ).toBe(TRANSPORT_FILE_NOT_AVAILABLE);
        expect(missingTransportFileHint(undefined)).toBe(
            TRANSPORT_FILE_NOT_AVAILABLE
        );
    });
});
