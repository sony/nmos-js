import {
    transportFileType,
    transportOmitsTransportFile,
    transportUsesTransportFile,
} from './ParameterRegisters';

describe('transport file register', () => {
    it('reads the URN base', () => {
        expect(
            transportUsesTransportFile('urn:x-nmos:transport:rtp.mcast')
        ).toBe(true);
        expect(transportFileType('urn:x-nmos:transport:rtp.ucast')).toBe(
            'application/sdp'
        );
        expect(transportOmitsTransportFile('urn:x-nmos:transport:mqtt')).toBe(
            true
        );
    });

    it('does not treat an unrecognised transport as omitting a file', () => {
        expect(
            transportOmitsTransportFile(
                'urn:x-example:transport:carrier-pigeon'
            )
        ).toBe(false);
        expect(
            transportUsesTransportFile('urn:x-example:transport:carrier-pigeon')
        ).toBe(false);
    });
});
