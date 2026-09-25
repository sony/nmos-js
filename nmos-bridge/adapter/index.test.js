'use strict';

process.env.REGISTRY_QUERY_URL =
    process.env.REGISTRY_QUERY_URL || 'http://registry/x-nmos/query/v1.3';

const assert = require('node:assert/strict');
const test = require('node:test');
const {
    bridgeCluster,
    collectTargets,
    routeConfiguration,
} = require('./index');

const node = {
    id: 'node-1',
    services: [
        {
            type: 'urn:x-nmos:service:annotation/v1.0',
            href: 'http://node.local:3212/x-nmos/annotation/v1.0',
        },
    ],
};

const device = {
    id: 'device-1',
    controls: [
        {
            type: 'urn:x-nmos:control:sr-ctrl/v1.1',
            href: 'http://node.local:3215/x-nmos/connection/v1.1',
        },
    ],
};

test('collects Node services before Device controls', () => {
    const targets = collectTargets([node], [device]);

    assert.deepEqual(
        targets.map(({ collection, resourceId, api, version }) => ({
            collection,
            resourceId,
            api,
            version,
        })),
        [
            {
                collection: 'nodes',
                resourceId: 'node-1',
                api: 'annotation',
                version: 'v1.0',
            },
            {
                collection: 'devices',
                resourceId: 'device-1',
                api: 'connection',
                version: 'v1.1',
            },
        ]
    );

    assert.equal(
        bridgeCluster(targets[0]).name,
        'nmos_bridge_node_node_1_annotation_v1_0'
    );
    assert.equal(
        bridgeCluster(targets[1]).name,
        'nmos_bridge_device_device_1_connection_v1_1'
    );
});

test('maps Annotation routes and Node listings', () => {
    const targets = collectTargets([node], []);
    const routes = routeConfiguration(targets).virtual_hosts[0].routes;
    const prefix = '/x-nmos-bridge/v1.0/nodes/node-1/annotation/v1.0';
    const annotationRoutes = routes.filter(
        route => route.match.path_separated_prefix === prefix
    );

    assert.equal(annotationRoutes.length, 3);
    assert.equal(
        annotationRoutes[0].route.prefix_rewrite,
        '/x-nmos/annotation/v1.0'
    );
    assert.equal(annotationRoutes[1].route.retry_policy, undefined);
    assert.equal(annotationRoutes[2].direct_response.status, 405);

    const responseAt = path =>
        routes.find(route => route.match.path === path).direct_response;
    assert.equal(
        responseAt('/x-nmos-bridge/v1.0/nodes/node-1').body.inline_string,
        '["annotation/"]'
    );
    assert.equal(
        responseAt('/x-nmos-bridge/v1.0/nodes/node-1/annotation').body
            .inline_string,
        '["v1.0/"]'
    );
    assert.equal(
        responseAt('/x-nmos-bridge/v1.0').body.inline_string,
        '["nodes/","devices/","query/"]'
    );
    assert.equal(responseAt('/x-nmos-bridge/v1.0/nodes').status, 404);
});

test('maps Connection routes and Device listings', () => {
    const targets = collectTargets([], [device]);
    const routes = routeConfiguration(targets).virtual_hosts[0].routes;
    const prefix = '/x-nmos-bridge/v1.0/devices/device-1/connection/v1.1';
    const connectionRoutes = routes.filter(
        route => route.match.path_separated_prefix === prefix
    );

    assert.equal(connectionRoutes.length, 3);
    assert.equal(
        connectionRoutes[0].route.prefix_rewrite,
        '/x-nmos/connection/v1.1'
    );
    assert.equal(connectionRoutes[1].route.retry_policy, undefined);
    assert.equal(connectionRoutes[2].direct_response.status, 405);

    const responseAt = path =>
        routes.find(route => route.match.path === path).direct_response;
    assert.equal(
        responseAt('/x-nmos-bridge/v1.0/devices/device-1').body.inline_string,
        '["connection/"]'
    );
    assert.equal(
        responseAt('/x-nmos-bridge/v1.0/devices/device-1/connection').body
            .inline_string,
        '["v1.1/"]'
    );
    assert.equal(responseAt('/x-nmos-bridge/v1.0/devices').status, 404);
});
