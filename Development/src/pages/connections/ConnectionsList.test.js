import { isConnectionsAxisTruncated } from './ConnectionsList';
import {
    connectionsCornerLabels,
    groupConnectionsResources,
    isActiveConnection,
} from './ConnectionsMatrix';
import {
    ConnectionRank,
    connectionRankMessage,
    rankConnection,
    transportsCompatible,
} from './connectionRank';
import {
    RECEIVER_ESSENCE_KEYS,
    applyHeadingMatch,
    receiverEssenceFromSender,
    senderEssenceFromReceiver,
} from './connectionHeadingMatch';

describe('isConnectionsAxisTruncated', () => {
    it('reports a full page as possibly truncated', () => {
        expect(isConnectionsAxisTruncated(10, 10)).toBe(true);
    });

    it('does not report fewer results than the paging limit', () => {
        expect(isConnectionsAxisTruncated(5, 10)).toBe(false);
        expect(isConnectionsAxisTruncated(0, 10)).toBe(false);
    });
});

describe('Connections matrix', () => {
    const sender0 = {
        id: 'sender0',
        device_id: 'device0',
        label: 'Sender B',
    };
    const sender1 = {
        id: 'sender1',
        device_id: 'device0',
        label: 'Sender A',
    };
    const sender2 = {
        id: 'sender2',
        device_id: 'device1',
        label: 'Sender C',
    };

    it('groups resources by Device and uses Device labels', () => {
        expect(
            groupConnectionsResources(
                [sender0, sender1, sender2],
                {
                    device0: { label: 'Device B' },
                    device1: { label: 'Device A' },
                },
                false
            )
        ).toEqual([
            {
                id: 'device0',
                label: 'Device B',
                resources: [sender0, sender1],
            },
            {
                id: 'device1',
                label: 'Device A',
                resources: [sender2],
            },
        ]);
    });

    it('sorts Device groups and resources when auto-sort is enabled', () => {
        const groups = groupConnectionsResources(
            [sender0, sender1, sender2],
            {
                device0: { label: 'Device B' },
                device1: { label: 'Device A' },
            },
            true
        );

        expect(groups.map(group => group.label)).toEqual([
            'Device A',
            'Device B',
        ]);
        expect(groups[1].resources.map(resource => resource.label)).toEqual([
            'Sender A',
            'Sender B',
        ]);
    });

    it('marks only the receiver active on the sender as connected', () => {
        expect(
            isActiveConnection(sender0, {
                subscription: { active: true, sender_id: sender0.id },
            })
        ).toBe(true);
        expect(
            isActiveConnection(sender0, {
                subscription: { active: false, sender_id: sender0.id },
            })
        ).toBe(false);
        expect(
            isActiveConnection(
                sender0,
                {
                    subscription: { sender_id: sender0.id },
                },
                false
            )
        ).toBe(true);
        expect(
            isActiveConnection(sender0, {
                subscription: { active: true, sender_id: sender1.id },
            })
        ).toBe(false);
    });

    it('swaps the corner axis labels', () => {
        expect(connectionsCornerLabels(false)).toEqual({
            rows: 'SENDERS',
            columns: 'RECEIVERS',
        });
        expect(connectionsCornerLabels(true)).toEqual({
            rows: 'RECEIVERS',
            columns: 'SENDERS',
        });
    });
});

describe('connection rank', () => {
    const rtp = 'urn:x-nmos:transport:rtp';
    const rtpMcast = 'urn:x-nmos:transport:rtp.mcast';
    const rtpUcast = 'urn:x-nmos:transport:rtp.ucast';
    const video = 'urn:x-nmos:format:video';
    const audio = 'urn:x-nmos:format:audio';
    const sender = (transport = rtp) => ({ id: 's', transport });
    const receiver = (overrides = {}) => ({
        id: 'r',
        transport: rtp,
        format: video,
        ...overrides,
    });
    const flow = (overrides = {}) => ({
        id: 'f',
        format: video,
        media_type: 'video/raw',
        ...overrides,
    });

    it('matches a transport base with any subclassification', () => {
        expect(transportsCompatible(rtp, rtpMcast)).toBe(true);
        expect(transportsCompatible(rtpMcast, rtp)).toBe(true);
        expect(transportsCompatible(rtpMcast, rtpUcast)).toBe(false);
        expect(
            transportsCompatible(rtp, 'urn:x-nmos:transport:websocket')
        ).toBe(false);
    });

    it('walks transport then format then media type', () => {
        expect(
            rankConnection(
                sender(rtpMcast),
                receiver({ transport: rtpUcast }),
                flow()
            )
        ).toBe(ConnectionRank.IncompatibleTransport);
        expect(
            rankConnection(sender(), receiver({ format: audio }), flow())
        ).toBe(ConnectionRank.IncompatibleFormat);
        expect(rankConnection(sender(), receiver(), null)).toBe(
            ConnectionRank.IncompatibleFormat
        );
        expect(
            rankConnection(
                sender(),
                receiver({ caps: { media_types: ['video/jxsv'] } }),
                flow()
            )
        ).toBe(ConnectionRank.IncompatibleMediaType);
        expect(
            rankConnection(
                sender(),
                receiver({ caps: { media_types: ['video/raw'] } }),
                flow()
            )
        ).toBe(ConnectionRank.Compatible);
        expect(rankConnection(sender(), receiver(), flow())).toBe(
            ConnectionRank.Compatible
        );
    });

    it('does not evaluate constraint sets', () => {
        expect(
            rankConnection(
                sender(),
                receiver({
                    caps: {
                        media_types: ['video/raw'],
                        constraint_sets: [
                            {
                                'urn:x-nmos:cap:format:frame_width': {
                                    enum: [1920],
                                },
                            },
                        ],
                    },
                }),
                flow()
            )
        ).toBe(ConnectionRank.Compatible);
        expect(
            connectionRankMessage(ConnectionRank.IncompatibleTransport)
        ).toBe('Incompatible transport.');
        expect(connectionRankMessage(ConnectionRank.IncompatibleFormat)).toBe(
            'Incompatible format.'
        );
    });
});

describe('heading match', () => {
    const rtpMcast = 'urn:x-nmos:transport:rtp.mcast';
    const video = 'urn:x-nmos:format:video';
    const sender = {
        id: 's',
        transport: rtpMcast,
        flow_id: 'f',
    };
    const flow = {
        id: 'f',
        format: video,
        media_type: 'video/raw',
        event_type: 'number',
    };
    const receiver = {
        id: 'r',
        transport: rtpMcast,
        format: video,
        caps: {
            media_types: ['video/raw'],
            event_types: ['number'],
        },
    };

    it('replaces essence chips and keeps the rest', () => {
        expect(
            applyHeadingMatch(
                {
                    label: 'Cam',
                    transport: 'urn:x-nmos:transport:websocket',
                    format: 'urn:x-nmos:format:audio',
                },
                {
                    transport: rtpMcast,
                    format: video,
                },
                RECEIVER_ESSENCE_KEYS
            )
        ).toEqual({
            label: 'Cam',
            transport: rtpMcast,
            format: video,
        });
    });

    it('writes Connect-tab sender filters from a receiver', () => {
        expect(
            senderEssenceFromReceiver(receiver, {
                usingRql: true,
                version: 'v1.3',
            })
        ).toEqual({
            transport: `${rtpMcast}|urn:x-nmos:transport:rtp$`,
            '$flow.format': video,
            '$flow.media_type': ['video/raw'],
            '$flow.event_type': ['number'],
        });
        expect(
            senderEssenceFromReceiver(receiver, {
                usingRql: false,
                version: 'v1.3',
            })
        ).toEqual({
            transport: rtpMcast,
            '$flow.format': video,
        });
    });

    it('writes receiver filters from a sender Flow and waits for Flow', () => {
        expect(
            receiverEssenceFromSender(sender, null, {
                usingRql: true,
                version: 'v1.3',
            })
        ).toBe(null);
        expect(
            receiverEssenceFromSender(sender, flow, {
                usingRql: true,
                version: 'v1.3',
            })
        ).toEqual({
            format: video,
            transport: `${rtpMcast}|urn:x-nmos:transport:rtp$`,
            'caps.media_types': 'video/raw',
            'caps.event_types': 'number',
        });
        expect(
            receiverEssenceFromSender(sender, flow, {
                usingRql: false,
                version: 'v1.3',
            })
        ).toEqual({
            format: video,
            transport: rtpMcast,
        });
    });
});
