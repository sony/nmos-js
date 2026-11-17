import { annotationResourceUrl } from './AnnotationFields';
import {
    BRIDGE_API,
    BRIDGE_AUTO,
    BRIDGE_FORCED,
    BRIDGE_MODE,
    QUERY_API,
} from '../settings';

const annotationNode = id => ({
    id,
    services: [
        {
            type: 'urn:x-nmos:service:annotation/v1.0',
            href: 'http://node.local:3212/x-nmos/annotation/v1.0',
        },
    ],
});

beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(
        BRIDGE_API,
        'http://bridge.local/x-nmos-bridge/v1.0'
    );
    window.localStorage.setItem(
        QUERY_API,
        'http://registry.local/x-nmos/query/v1.3'
    );
    global.fetch = jest.fn();
});

afterEach(() => {
    delete global.fetch;
});

test('uses the Node bridge path in Forced Bridge mode', async () => {
    window.localStorage.setItem(BRIDGE_MODE, JSON.stringify(BRIDGE_FORCED));
    global.fetch.mockResolvedValue({ ok: true });

    await expect(
        annotationResourceUrl('nodes', annotationNode('node-forced'))
    ).resolves.toBe(
        'http://bridge.local/x-nmos-bridge/v1.0/nodes/node-forced/annotation/v1.0/node/self'
    );
    expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
        'http://bridge.local/x-nmos-bridge/v1.0/nodes/node-forced/annotation/v1.0/node/self',
    ]);
});

test('returns null when the only service does not answer', async () => {
    global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(
        annotationResourceUrl('nodes', annotationNode('node-unreachable'))
    ).resolves.toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('ignores a service with a different major version', async () => {
    global.fetch.mockResolvedValue({ ok: true });
    const node = annotationNode('node-major-version');
    node.services.unshift({
        type: 'urn:x-nmos:service:annotation/v2.0',
        href: 'http://node.local:3212/x-nmos/annotation/v2.0',
    });

    await expect(annotationResourceUrl('nodes', node)).resolves.toBe(
        'http://node.local:3212/x-nmos/annotation/v1.0/node/self'
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('uses the Node collection path for a Device in Forced Bridge mode', async () => {
    window.localStorage.setItem(BRIDGE_MODE, JSON.stringify(BRIDGE_FORCED));
    global.fetch.mockResolvedValue({
        ok: true,
        json: async () => annotationNode('node-from-device'),
    });

    await expect(
        annotationResourceUrl('devices', {
            id: 'device-forced',
            node_id: 'node-from-device',
        })
    ).resolves.toBe(
        'http://bridge.local/x-nmos-bridge/v1.0/nodes/node-from-device/annotation/v1.0/node/devices/device-forced'
    );
    expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
        'http://registry.local/x-nmos/query/v1.3/nodes/node-from-device',
        'http://bridge.local/x-nmos-bridge/v1.0/nodes/node-from-device/annotation/v1.0/node/devices/device-forced',
    ]);
});

test('uses the direct service when it works in Auto Bridge mode', async () => {
    window.localStorage.setItem(BRIDGE_MODE, JSON.stringify(BRIDGE_AUTO));
    global.fetch.mockResolvedValue({ ok: true });

    await expect(
        annotationResourceUrl('nodes', annotationNode('node-direct'))
    ).resolves.toBe('http://node.local:3212/x-nmos/annotation/v1.0/node/self');
    expect(global.fetch).toHaveBeenCalledTimes(1);
});

const annotationNodeWithTwoHosts = id => ({
    id,
    services: [
        {
            type: 'urn:x-nmos:service:annotation/v1.0',
            href: 'http://unresolvable.local:3212/x-nmos/annotation/v1.0',
        },
        {
            type: 'urn:x-nmos:service:annotation/v1.0',
            href: 'http://192.0.2.1:3212/x-nmos/annotation/v1.0',
        },
    ],
});

const onlyAddressAnswers = url =>
    url.startsWith('http://192.0.2.1:3212/')
        ? Promise.resolve({ ok: true })
        : Promise.reject(new TypeError('Failed to fetch'));

test('uses whichever service href answers when the Bridge is disabled', async () => {
    global.fetch.mockImplementation(onlyAddressAnswers);

    await expect(
        annotationResourceUrl(
            'nodes',
            annotationNodeWithTwoHosts('node-two-hosts')
        )
    ).resolves.toBe('http://192.0.2.1:3212/x-nmos/annotation/v1.0/node/self');
});

test('uses whichever service href answers before the Node bridge path in Auto Bridge mode', async () => {
    window.localStorage.setItem(BRIDGE_MODE, JSON.stringify(BRIDGE_AUTO));
    global.fetch.mockImplementation(onlyAddressAnswers);

    await expect(
        annotationResourceUrl(
            'nodes',
            annotationNodeWithTwoHosts('node-two-hosts-auto')
        )
    ).resolves.toBe('http://192.0.2.1:3212/x-nmos/annotation/v1.0/node/self');
    expect(global.fetch.mock.calls.map(([url]) => url).sort()).toEqual([
        'http://192.0.2.1:3212/x-nmos/annotation/v1.0/node/self',
        'http://unresolvable.local:3212/x-nmos/annotation/v1.0/node/self',
    ]);
});

test('falls back to the Node bridge path in Auto Bridge mode', async () => {
    window.localStorage.setItem(BRIDGE_MODE, JSON.stringify(BRIDGE_AUTO));
    global.fetch
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({ ok: true });

    await expect(
        annotationResourceUrl('nodes', annotationNode('node-fallback'))
    ).resolves.toBe(
        'http://bridge.local/x-nmos-bridge/v1.0/nodes/node-fallback/annotation/v1.0/node/self'
    );
    expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
        'http://node.local:3212/x-nmos/annotation/v1.0/node/self',
        'http://bridge.local/x-nmos-bridge/v1.0/nodes/node-fallback/annotation/v1.0/node/self',
    ]);
});
