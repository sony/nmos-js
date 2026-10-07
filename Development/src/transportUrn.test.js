import { parseTransportUrn } from './transportUrn';

describe('parseTransportUrn', () => {
    it('takes the URN-base of a versioned or subclassified transport', () => {
        expect(parseTransportUrn('urn:x-nmos:transport:rtp.mcast').base).toBe(
            'urn:x-nmos:transport:rtp'
        );
        expect(
            parseTransportUrn('urn:x-nmos:transport:example/v1.0').base
        ).toBe('urn:x-nmos:transport:example');
        expect(
            parseTransportUrn('urn:x-nmos:transport:example.sub/v1.0').base
        ).toBe('urn:x-nmos:transport:example');
        expect(parseTransportUrn(undefined)).toBeNull();
    });
});
