'use strict';

// NMOS Connection API Bridge - Envoy Adapter
//
// Converts registry state into Envoy configuration. Discovers Devices from
// the registry's Query API, extracts their Connection API controls, and
// generates Envoy route and cluster configuration files which Envoy reloads
// via filesystem watch. The adapter does not proxy any traffic itself and
// does not determine runtime health - Envoy does both.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const REGISTRY_QUERY_URL = (process.env.REGISTRY_QUERY_URL || '').replace(
    /\/$/,
    ''
);
const APP_URL = process.env.APP_URL || '';
const OUTPUT_DIR = process.env.OUTPUT_DIR || '/etc/envoy/dynamic';
const POLL_INTERVAL_SECONDS = Number(process.env.POLL_INTERVAL_SECONDS) || 15;
const ROUTE_TIMEOUT_SECONDS = Number(process.env.ROUTE_TIMEOUT_SECONDS) || 15;

const BRIDGE_PREFIX = '/x-nmos-bridge/v1.0';

// Phase 1 supports HTTP upstreams only
const ALLOWED_PROTOCOLS = ['http:'];

const CONNECTION_CONTROL = /^urn:x-nmos:control:sr-ctrl\/(v\d+\.\d+)$/;

if (!REGISTRY_QUERY_URL) {
    console.error(
        'REGISTRY_QUERY_URL is required, e.g. http://registry:8870/x-nmos/query/v1.3'
    );
    process.exit(1);
}

const log = (...args) => console.log(new Date().toISOString(), ...args);

// skipped controls are reported once, not on every poll
const reported = new Set();
const logOnce = message => {
    if (reported.has(message)) return;
    reported.add(message);
    log(message);
};

// --- discovery ---

const parseNextLink = linkHeader => {
    if (!linkHeader) return undefined;
    for (const part of linkHeader.split(',')) {
        const match = part.match(/<([^>]+)>\s*;\s*rel="?next"?/);
        if (match) return match[1];
    }
    return undefined;
};

const discoverDevices = async () => {
    const devices = [];
    const visited = new Set();
    let url = `${REGISTRY_QUERY_URL}/devices`;
    while (url && !visited.has(url)) {
        visited.add(url);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`GET ${url} -> ${response.status}`);
        }
        const page = await response.json();
        if (!Array.isArray(page)) {
            throw new Error(`GET ${url} -> unexpected response`);
        }
        if (page.length === 0) break;
        devices.push(...page);
        url = parseNextLink(response.headers.get('link'));
    }
    return devices;
};

// --- mapping ---

const safeName = name => name.replace(/[^A-Za-z0-9_]/g, '_');

const isIPv4 = host => /^\d+\.\d+\.\d+\.\d+$/.test(host);

const isPrivateIPv4 = host => {
    const octets = host.split('.').map(Number);
    return (
        octets[0] === 10 ||
        (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
        (octets[0] === 192 && octets[1] === 168)
    );
};

// candidate priorities: private IP address hrefs are preferred, then names
// (assumed private DNS), then anything else
const priorityFor = host => {
    if (host.includes(':')) {
        // IPv6 literal: prefer unique-local
        return /^\[?f[cd]/i.test(host) ? 0 : 2;
    }
    if (isIPv4(host)) return isPrivateIPv4(host) ? 0 : 2;
    return 1;
};

// one bridge target per unique Device ID + Connection API version
const collectTargets = devices => {
    const targets = new Map();
    for (const device of devices) {
        for (const control of device.controls || []) {
            const match = CONNECTION_CONTROL.exec(control.type || '');
            if (!match) continue;
            const version = match[1];
            let href;
            try {
                href = new URL(control.href);
            } catch {
                logOnce(
                    `skipping malformed href for Device ${device.id}: ${control.href}`
                );
                continue;
            }
            if (!ALLOWED_PROTOCOLS.includes(href.protocol)) {
                logOnce(
                    `skipping unsupported scheme for Device ${device.id}: ${control.href}`
                );
                continue;
            }
            // the href path must correspond to the advertised version
            const basePath = href.pathname.replace(/\/$/, '');
            if (!basePath.endsWith(`/x-nmos/connection/${version}`)) {
                logOnce(
                    `skipping href inconsistent with ${version} for Device ${device.id}: ${control.href}`
                );
                continue;
            }
            const key = `${device.id}/${version}`;
            if (!targets.has(key)) {
                targets.set(key, {
                    deviceId: device.id,
                    version,
                    candidates: [],
                });
            }
            const candidates = targets.get(key).candidates;
            const host = href.hostname;
            const port = Number(href.port) || 80;
            // de-duplicate normalized hrefs
            if (
                candidates.some(
                    c =>
                        c.host === host &&
                        c.port === port &&
                        c.basePath === basePath
                )
            ) {
                continue;
            }
            candidates.push({
                host,
                port,
                basePath,
                priority: priorityFor(host),
            });
        }
    }
    // all candidates in a cluster share one route rewrite, so if hrefs for
    // the same target disagree on base path, keep only those that share a
    // path with the most preferred candidate
    for (const target of targets.values()) {
        target.candidates.sort((a, b) => a.priority - b.priority);
        const basePath = target.candidates[0].basePath;
        for (const c of target.candidates) {
            if (c.basePath !== basePath) {
                logOnce(
                    `dropping candidate with differing base path for Device ${target.deviceId} ${target.version}: ${c.host}:${c.port}${c.basePath}`
                );
            }
        }
        target.candidates = target.candidates.filter(
            c => c.basePath === basePath
        );
        target.basePath = basePath;
    }
    return [...targets.values()].sort((a, b) =>
        `${a.deviceId}/${a.version}`.localeCompare(`${b.deviceId}/${b.version}`)
    );
};

// --- Envoy configuration ---

const clusterName = target =>
    `nmos_bridge_device_${safeName(target.deviceId)}_connection_${safeName(
        target.version
    )}`;

const staticClusterFromUrl = (name, urlString) => {
    const url = new URL(urlString);
    return {
        '@type': 'type.googleapis.com/envoy.config.cluster.v3.Cluster',
        name,
        type: 'STRICT_DNS',
        connect_timeout: '5s',
        load_assignment: {
            cluster_name: name,
            endpoints: [
                {
                    lb_endpoints: [
                        {
                            endpoint: {
                                address: {
                                    socket_address: {
                                        address: url.hostname,
                                        port_value:
                                            Number(url.port) ||
                                            (url.protocol === 'https:'
                                                ? 443
                                                : 80),
                                    },
                                },
                            },
                        },
                    ],
                },
            ],
        },
    };
};

const bridgeCluster = target => {
    const name = clusterName(target);
    // Envoy requires contiguous priority levels starting at 0
    const levels = [...new Set(target.candidates.map(c => c.priority))].sort(
        (a, b) => a - b
    );
    return {
        '@type': 'type.googleapis.com/envoy.config.cluster.v3.Cluster',
        name,
        type: 'STRICT_DNS',
        connect_timeout: '5s',
        load_assignment: {
            cluster_name: name,
            endpoints: levels.map((level, index) => ({
                priority: index,
                lb_endpoints: target.candidates
                    .filter(c => c.priority === level)
                    .map(c => ({
                        endpoint: {
                            address: {
                                socket_address: {
                                    address: c.host,
                                    port_value: c.port,
                                },
                            },
                        },
                    })),
            })),
        },
        // Envoy, not the adapter, determines candidate health, so that
        // failover between priority levels happens at runtime
        health_checks: [
            {
                timeout: '2s',
                interval: '10s',
                unhealthy_threshold: 2,
                healthy_threshold: 2,
                http_health_check: { path: `${target.basePath}/` },
            },
        ],
    };
};

const nmosError = (status, error) =>
    JSON.stringify({ code: status, error, debug: null });

const directResponse = (status, error) => ({
    direct_response: {
        status,
        body: { inline_string: nmosError(status, error) },
    },
    response_headers_to_add: [
        { header: { key: 'content-type', value: 'application/json' } },
    ],
});

const bridgeRoutes = target => {
    const prefix = `${BRIDGE_PREFIX}/devices/${target.deviceId}/connection/${target.version}/`;
    const action = {
        cluster: clusterName(target),
        prefix_rewrite: `${target.basePath}/`,
        timeout: `${ROUTE_TIMEOUT_SECONDS}s`,
    };
    return [
        // GETs may be retried, POSTs and PATCHes must not be
        {
            match: {
                prefix,
                headers: [{ name: ':method', string_match: { exact: 'GET' } }],
            },
            route: {
                ...action,
                retry_policy: {
                    retry_on: 'connect-failure,refused-stream,5xx',
                    num_retries: 2,
                },
            },
        },
        {
            match: {
                prefix,
                headers: [
                    {
                        name: ':method',
                        string_match: {
                            safe_regex: { regex: 'POST|PATCH|OPTIONS' },
                        },
                    },
                ],
            },
            route: action,
        },
        // any other method on a known target
        {
            match: { prefix },
            ...directResponse(405, 'Method not allowed'),
        },
    ];
};

const routeConfiguration = targets => ({
    '@type': 'type.googleapis.com/envoy.config.route.v3.RouteConfiguration',
    name: 'nmos_bridge_routes',
    virtual_hosts: [
        {
            name: 'nmos_bridge',
            domains: ['*'],
            typed_per_filter_config: {
                'envoy.filters.http.cors': {
                    '@type':
                        'type.googleapis.com/envoy.extensions.filters.http.cors.v3.CorsPolicy',
                    allow_origin_string_match: [
                        { safe_regex: { regex: '.*' } },
                    ],
                    allow_methods: 'GET, POST, PATCH, OPTIONS',
                    allow_headers: 'content-type,authorization',
                },
            },
            routes: [
                ...targets.flatMap(bridgeRoutes),
                // arbitrary URLs are forbidden; only registered Device
                // controls produce routes, everything else stops here
                {
                    match: { prefix: `${BRIDGE_PREFIX}/` },
                    ...directResponse(404, 'Unknown bridge target'),
                },
                // registry APIs
                {
                    match: { prefix: '/x-nmos/' },
                    route: {
                        cluster: 'registry',
                        timeout: `${ROUTE_TIMEOUT_SECONDS}s`,
                    },
                },
                ...(APP_URL
                    ? [{ match: { prefix: '/' }, route: { cluster: 'app' } }]
                    : []),
            ],
        },
    ],
});

// --- output ---

const writeResource = (filename, resources, state) => {
    const version = crypto
        .createHash('sha256')
        .update(JSON.stringify(resources))
        .digest('hex')
        .slice(0, 16);
    if (state[filename] === version) return false;
    const body = JSON.stringify({ version_info: version, resources }, null, 4);
    const tmp = path.join(OUTPUT_DIR, `.${filename}.tmp`);
    fs.writeFileSync(tmp, body);
    // atomic replacement, which Envoy's watched_directory also relies on
    // to pick up the change
    fs.renameSync(tmp, path.join(OUTPUT_DIR, filename));
    state[filename] = version;
    return true;
};

const apply = (targets, state) => {
    const clusters = [
        staticClusterFromUrl('registry', REGISTRY_QUERY_URL),
        ...(APP_URL ? [staticClusterFromUrl('app', APP_URL)] : []),
        ...targets.map(bridgeCluster),
    ];
    // clusters before routes so routes never reference unknown clusters
    const changedClusters = writeResource('cds.json', clusters, state);
    const changedRoutes = writeResource(
        'rds.json',
        [routeConfiguration(targets)],
        state
    );
    return changedClusters || changedRoutes;
};

const main = async () => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const state = {};
    // write a baseline configuration immediately so Envoy can serve the
    // registry and app routes before the first successful discovery
    apply([], state);
    log(`watching ${REGISTRY_QUERY_URL} every ${POLL_INTERVAL_SECONDS}s`);
    for (;;) {
        try {
            const devices = await discoverDevices();
            const targets = collectTargets(devices);
            if (apply(targets, state)) {
                logOnce(
                    `updated configuration: ${devices.length} Devices, ${targets.length} bridge targets`
                );
            }
        } catch (e) {
            // keep serving the last good configuration
            log(`discovery failed: ${e.message}`);
        }
        await new Promise(resolve =>
            setTimeout(resolve, POLL_INTERVAL_SECONDS * 1000)
        );
    }
};

main().catch(e => {
    console.error(e);
    process.exit(1);
});
