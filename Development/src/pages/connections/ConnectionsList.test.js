import { isConnectionsAxisTruncated } from './ConnectionsList';
import {
    connectionsCornerLabels,
    groupConnectionsResources,
    isActiveConnection,
} from './ConnectionsMatrix';

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
