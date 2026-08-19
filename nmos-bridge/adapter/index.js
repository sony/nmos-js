'use strict';

// NMOS Bridge - Envoy Adapter
//
// Converts Registry state into Envoy configuration. Tracks Devices through a
// Query API WebSocket subscription, extracts their Device controls, and
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
// optional override for /x-dns-sd/ upstream; when unset, use the same host
// and port as REGISTRY_QUERY_URL (typical when nmos-cpp mdns_port matches
// query_port). Only hostname and port are used for the Envoy cluster; any
// path in either URL is ignored (Envoy forwards the client request path).
const REGISTRY_DNS_SD_URL = (process.env.REGISTRY_DNS_SD_URL || '').replace(
    /\/$/,
    ''
);
// optional override for /log/ upstream; when unset, use the same host and
// port as REGISTRY_QUERY_URL (typical when nmos-cpp logging_port matches
// query_port). Only hostname and port are used for the Envoy cluster; any
// path in either URL is ignored (Envoy forwards the client request path).
const REGISTRY_LOGGING_URL = (process.env.REGISTRY_LOGGING_URL || '').replace(
    /\/$/,
    ''
);
const OUTPUT_DIR = process.env.OUTPUT_DIR || '/etc/envoy/dynamic';
const ROUTE_TIMEOUT_SECONDS = Number(process.env.ROUTE_TIMEOUT_SECONDS) || 15;
// long-lived WebSocket routes; must not use the HTTP
// ROUTE_TIMEOUT_SECONDS or upgraded connections are cut after 15s
const WS_IDLE_TIMEOUT_SECONDS =
    Number(process.env.WS_IDLE_TIMEOUT_SECONDS) || 3600;
// subscription update coalescing and WebSocket reconnect backoff
const MAX_UPDATE_RATE_MS = Number(process.env.MAX_UPDATE_RATE_MS) || 100;
const RECONNECT_MIN_MS = Number(process.env.RECONNECT_MIN_MS) || 1000;
const RECONNECT_MAX_MS = Number(process.env.RECONNECT_MAX_MS) || 30000;
// some Registries advertise a ws_href on a host the adapter cannot reach;
// when set, use this scheme and authority while preserving the subscription
// path; the same origin is the Envoy upstream for browser Query subscription
// WebSockets under /x-nmos-bridge/v1.0/query/...
const REGISTRY_QUERY_WS_URL = process.env.REGISTRY_QUERY_WS_URL || '';

const BRIDGE_ROOT = '/x-nmos-bridge';
const BRIDGE_VERSION = 'v1.0';
const BRIDGE_PREFIX = `${BRIDGE_ROOT}/${BRIDGE_VERSION}`;

// Phase 1 supports HTTP upstreams only
const ALLOWED_PROTOCOLS = ['http:'];

// the proxied Device APIs; each api is the path segment both in the advertised
// href and in the bridge path
const CONTROL_TYPES = [
    { pattern: /^urn:x-nmos:control:sr-ctrl\/(v\d+\.\d+)$/, api: 'connection' },
    {
        pattern: /^urn:x-nmos:control:cm-ctrl\/(v\d+\.\d+)$/,
        api: 'channelmapping',
    },
];

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

// --- device state ---

// authoritative set of Devices, maintained from the Query API WebSocket
// subscription's sync, added, modified and removed events
let devices = new Map();

// per-output-file content hashes, so Envoy is only reconfigured on real change
const state = {};

// Envoy's shared Query WebSocket upstream origin (ws://host:port). The adapter
// uses the full resolved ws_href separately. This origin is fixed by
// REGISTRY_QUERY_WS_URL or the first subscription; empty until then, so the
// baseline cluster discovery service (cds.json) and route discovery service
// (rds.json) omit the browser-facing WebSocket route.
let envoyQueryWsOrigin = '';

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

// one bridge target per unique Device ID + API + version
const collectTargets = devices => {
    const targets = new Map();
    for (const device of devices) {
        for (const control of device.controls || []) {
            let api;
            let version;
            for (const controlType of CONTROL_TYPES) {
                const match = controlType.pattern.exec(control.type || '');
                if (!match) continue;
                api = controlType.api;
                version = match[1];
                break;
            }
            if (!version) continue;
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
            if (!basePath.endsWith(`/x-nmos/${api}/${version}`)) {
                logOnce(
                    `skipping href inconsistent with ${api} ${version} for Device ${device.id}: ${control.href}`
                );
                continue;
            }
            const key = `${device.id}/${api}/${version}`;
            if (!targets.has(key)) {
                targets.set(key, {
                    deviceId: device.id,
                    api,
                    version,
                    candidates: [],
                });
            }
            const candidates = targets.get(key).candidates;
            const host = href.hostname;
            // URL.port is empty when the href omits an explicit port
            const scheme = href.protocol.replace(/:$/, '');
            const port = Number(href.port) || (scheme === 'https' ? 443 : 80);
            // de-duplicate normalized hrefs
            if (
                candidates.some(
                    c =>
                        c.host === host &&
                        c.port === port &&
                        c.scheme === scheme &&
                        c.basePath === basePath
                )
            ) {
                continue;
            }
            candidates.push({
                host,
                port,
                scheme,
                basePath,
                priority: priorityFor(host),
            });
        }
    }
    // all candidates in a cluster share one route rewrite, so if hrefs for
    // the same target disagree on scheme or base path, keep only those that
    // share both with the most preferred candidate
    for (const target of targets.values()) {
        target.candidates.sort((a, b) => a.priority - b.priority);
        const { scheme, basePath } = target.candidates[0];
        for (const c of target.candidates) {
            if (c.scheme !== scheme || c.basePath !== basePath) {
                logOnce(
                    `dropping candidate with differing scheme or base path for Device ${target.deviceId} ${target.api} ${target.version}: ${c.scheme}://${c.host}:${c.port}${c.basePath}`
                );
            }
        }
        target.candidates = target.candidates.filter(
            c => c.scheme === scheme && c.basePath === basePath
        );
        target.scheme = scheme;
        target.basePath = basePath;
    }
    return [...targets.values()].sort((a, b) =>
        `${a.deviceId}/${a.api}/${a.version}`.localeCompare(
            `${b.deviceId}/${b.api}/${b.version}`
        )
    );
};

// --- Envoy configuration ---

const clusterName = target =>
    `nmos_bridge_device_${safeName(target.deviceId)}_${target.api}_${safeName(
        target.version
    )}`;

const defaultPortFor = protocol => {
    if (protocol === 'https:' || protocol === 'wss:') return 443;
    return 80;
};

const staticClusterFromUrl = (name, urlString) => {
    // Only scheme defaults, hostname, and port are used; any path in
    // urlString is ignored (Envoy forwards the client request path).
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
                                            defaultPortFor(url.protocol),
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

const directResponse = (status, jsonBody) => ({
    direct_response: {
        status,
        body: { inline_string: JSON.stringify(jsonBody) },
    },
    response_headers_to_add: [
        { header: { key: 'content-type', value: 'application/json' } },
    ],
});

const directErrorResponse = (status, error) =>
    directResponse(status, { code: status, error, debug: null });

// The HTTP buffer filter waits for a full request body; WebSocket upgrades
// never finish that way, so disable it on upgrade routes.
const wsBufferDisabled = {
    typed_per_filter_config: {
        'envoy.filters.http.buffer': {
            '@type':
                'type.googleapis.com/envoy.extensions.filters.http.buffer.v3.BufferPerRoute',
            disabled: true,
        },
    },
};

const bridgeRoutes = target => {
    // path_separated_prefix matches the version path exactly or with a
    // following '/...' (Envoy 1.22+; compose pins v1.31). That preserves
    // whatever the client sent after the version (nothing, '/', or a
    // sub-path) when rewriting onto the Device API basePath, so
    // trailing-slash handling stays with the upstream per that API.
    const pathPrefix = `${BRIDGE_PREFIX}/devices/${target.deviceId}/${target.api}/${target.version}`;
    // Envoy 1.31 set_metadata has no per-route config; LuaPerRoute on a
    // dedicated filter writes Location-rewrite context into dynamic metadata
    // for location_rewrite.lua. Values are NMOS paths / host:port lists.
    const escapeLua = s =>
        String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const formatAuthority = c =>
        c.host.includes(':') ? `[${c.host}]:${c.port}` : `${c.host}:${c.port}`;
    const upstreamAuthorities = target.candidates
        .map(formatAuthority)
        .join(',');
    const locationMeta = {
        typed_per_filter_config: {
            'nmos.bridge.location_meta': {
                '@type':
                    'type.googleapis.com/envoy.extensions.filters.http.lua.v3.LuaPerRoute',
                source_code: {
                    inline_string: [
                        'function envoy_on_request(request_handle)',
                        '  local md = request_handle:streamInfo():dynamicMetadata()',
                        `  md:set("nmos_bridge_location", "base_path", "${escapeLua(target.basePath)}")`,
                        `  md:set("nmos_bridge_location", "bridge_path", "${escapeLua(pathPrefix)}")`,
                        `  md:set("nmos_bridge_location", "upstream_scheme", "${escapeLua(target.scheme)}")`,
                        `  md:set("nmos_bridge_location", "upstream_authorities", "${escapeLua(upstreamAuthorities)}")`,
                        'end',
                    ].join('\n'),
                },
            },
        },
    };
    const action = {
        cluster: clusterName(target),
        prefix_rewrite: target.basePath,
        timeout: `${ROUTE_TIMEOUT_SECONDS}s`,
    };
    return [
        // GET and HEAD may be retried; mutating methods must not be
        {
            match: {
                path_separated_prefix: pathPrefix,
                headers: [
                    {
                        name: ':method',
                        string_match: {
                            safe_regex: { regex: 'GET|HEAD' },
                        },
                    },
                ],
            },
            route: {
                ...action,
                retry_policy: {
                    retry_on: 'connect-failure,refused-stream,5xx',
                    num_retries: 2,
                },
            },
            ...locationMeta,
        },
        {
            match: {
                path_separated_prefix: pathPrefix,
                headers: [
                    {
                        name: ':method',
                        string_match: {
                            safe_regex: { regex: 'POST|PATCH|DELETE|OPTIONS' },
                        },
                    },
                ],
            },
            route: action,
            ...locationMeta,
        },
        // any other method on a known target
        {
            match: { path_separated_prefix: pathPrefix },
            ...directErrorResponse(405, 'Method not allowed'),
        },
    ];
};

// what the bridge proxies for one Device, so a client holding a Device ID from
// the Registry can see which APIs and versions became targets
const deviceListingRoutes = targets => {
    const devices = new Map();
    for (const target of targets) {
        if (!devices.has(target.deviceId)) {
            devices.set(target.deviceId, new Map());
        }
        const apis = devices.get(target.deviceId);
        if (!apis.has(target.api)) apis.set(target.api, []);
        apis.get(target.api).push(`${target.version}/`);
    }
    const routes = [];
    // targets are sorted, so the listings are too
    for (const [deviceId, apis] of devices) {
        const devicePath = `${BRIDGE_PREFIX}/devices/${deviceId}`;
        const deviceListing = directResponse(
            200,
            [...apis.keys()].map(api => `${api}/`)
        );
        routes.push({ match: { path: devicePath }, ...deviceListing });
        routes.push({ match: { path: `${devicePath}/` }, ...deviceListing });
        for (const [api, versions] of apis) {
            const apiListing = directResponse(200, versions);
            routes.push({
                match: { path: `${devicePath}/${api}` },
                ...apiListing,
            });
            routes.push({
                match: { path: `${devicePath}/${api}/` },
                ...apiListing,
            });
        }
    }
    return routes;
};

const DEVICES_NOT_LISTED = `Devices are not listed; request a specific device at ${BRIDGE_PREFIX}/devices/{deviceId}`;

// Query subscription WebSockets on the bridge path (nmos-cpp path template).
// Separate from /x-nmos/query HTTP so upgrade and long idle timeouts do not
// affect the convenience HTTP routes.
const queryWsRoutes = () => {
    if (!envoyQueryWsOrigin) return [];
    return [
        {
            match: { prefix: `${BRIDGE_PREFIX}/query/` },
            route: {
                cluster: 'registry_query_ws',
                timeout: '0s',
                idle_timeout: `${WS_IDLE_TIMEOUT_SECONDS}s`,
                prefix_rewrite: '/x-nmos/query/',
                upgrade_configs: [{ upgrade_type: 'websocket' }],
            },
            ...wsBufferDisabled,
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
                    allow_methods: 'GET, HEAD, POST, PATCH, DELETE, OPTIONS',
                    // Request-Timeout: NMOS clients (e.g. nmos-js Query /
                    // DNS-SD) send this on long-poll style requests; not
                    // CORS-safelisted. See sony/nmos-js@6d0e783.
                    allow_headers: 'content-type,authorization,request-timeout',
                },
            },
            routes: [
                ...targets.flatMap(bridgeRoutes),
                ...deviceListingRoutes(targets),
                // the Device collection is not listed, the Registry answers
                // which Devices exist
                {
                    match: { path: `${BRIDGE_PREFIX}/devices` },
                    ...directErrorResponse(404, DEVICES_NOT_LISTED),
                },
                {
                    match: { path: `${BRIDGE_PREFIX}/devices/` },
                    ...directErrorResponse(404, DEVICES_NOT_LISTED),
                },
                // listings of the bridge API itself, like /x-nmos below
                {
                    match: { path: BRIDGE_ROOT },
                    ...directResponse(200, [`${BRIDGE_VERSION}/`]),
                },
                {
                    match: { path: `${BRIDGE_ROOT}/` },
                    ...directResponse(200, [`${BRIDGE_VERSION}/`]),
                },
                {
                    match: { path: BRIDGE_PREFIX },
                    ...directResponse(200, ['devices/', 'query/']),
                },
                {
                    match: { path: `${BRIDGE_PREFIX}/` },
                    ...directResponse(200, ['devices/', 'query/']),
                },
                // Query subscription WebSocket before the bridge namespace
                // catch-all
                ...queryWsRoutes(),
                // arbitrary URLs are forbidden; only registered Device
                // controls produce routes. The whole bridge namespace stops
                // here, including other bridge API versions, so no request
                // for it reaches the app catch-all below.
                {
                    match: { path_separated_prefix: BRIDGE_ROOT },
                    ...directErrorResponse(404, 'Unknown bridge target'),
                },
                // Query API (host/port from REGISTRY_QUERY_URL; path is not
                // rewritten — clients request /x-nmos/query...)
                {
                    match: { path_separated_prefix: '/x-nmos/query' },
                    route: {
                        cluster: 'registry_query',
                        timeout: `${ROUTE_TIMEOUT_SECONDS}s`,
                    },
                },
                // IS-04 /x-nmos base: list only APIs this Envoy instance
                // actually proxies (not Registration/Node/etc.)
                {
                    match: { path: '/x-nmos' },
                    ...directResponse(200, ['query/']),
                },
                {
                    match: { path: '/x-nmos/' },
                    ...directResponse(200, ['query/']),
                },
                // DNS-SD / MDNS API (same host/port as Query unless
                // REGISTRY_DNS_SD_URL is set)
                {
                    match: { path_separated_prefix: '/x-dns-sd' },
                    route: {
                        cluster: REGISTRY_DNS_SD_URL
                            ? 'registry_dns_sd'
                            : 'registry_query',
                        timeout: `${ROUTE_TIMEOUT_SECONDS}s`,
                    },
                },
                // Logging API (same host/port as Query unless
                // REGISTRY_LOGGING_URL is set)
                {
                    match: { path_separated_prefix: '/log' },
                    route: {
                        cluster: REGISTRY_LOGGING_URL
                            ? 'registry_logging'
                            : 'registry_query',
                        timeout: `${ROUTE_TIMEOUT_SECONDS}s`,
                    },
                },
                ...(APP_URL
                    ? [
                          {
                              match: { prefix: '/' },
                              route: {
                                  cluster: 'app',
                                  timeout: `${ROUTE_TIMEOUT_SECONDS}s`,
                              },
                          },
                      ]
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
        staticClusterFromUrl('registry_query', REGISTRY_QUERY_URL),
        ...(envoyQueryWsOrigin
            ? [staticClusterFromUrl('registry_query_ws', envoyQueryWsOrigin)]
            : []),
        ...(REGISTRY_DNS_SD_URL
            ? [staticClusterFromUrl('registry_dns_sd', REGISTRY_DNS_SD_URL)]
            : []),
        ...(REGISTRY_LOGGING_URL
            ? [staticClusterFromUrl('registry_logging', REGISTRY_LOGGING_URL)]
            : []),
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

// --- discovery via Query API WebSocket subscription ---

let backoffMs = RECONNECT_MIN_MS;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const rebuild = () => {
    const targets = collectTargets([...devices.values()]);
    if (apply(targets, state)) {
        log(
            `updated configuration: ${devices.size} Devices, ${targets.length} bridge targets`
        );
    }
};

// create a non-persistent subscription for Devices and return its WebSocket
// href; the Registry de-duplicates identical subscriptions, so reconnecting
// reuses the same one
const createSubscription = async () => {
    const response = await fetch(`${REGISTRY_QUERY_URL}/subscriptions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            max_update_rate_ms: MAX_UPDATE_RATE_MS,
            resource_path: '/devices',
            params: {},
            persist: false,
            secure: false,
        }),
    });
    if (!response.ok) {
        throw new Error(
            `POST ${REGISTRY_QUERY_URL}/subscriptions -> ${response.status}`
        );
    }
    const subscription = await response.json();
    if (!subscription.ws_href) {
        throw new Error('subscription response did not include ws_href');
    }
    let wsHref = subscription.ws_href;
    if (REGISTRY_QUERY_WS_URL) {
        const advertised = new URL(subscription.ws_href);
        const override = new URL(REGISTRY_QUERY_WS_URL);
        advertised.protocol = override.protocol;
        advertised.host = override.host;
        // setting host does not clear the port, so an omitted port would
        // otherwise leave the advertised port in place rather than the
        // scheme default
        advertised.port = override.port;
        wsHref = advertised.toString();
    }
    // Envoy uses the same origin the adapter uses for its own subscription.
    // Static routing assumes all Query subscriptions share one listener;
    // reject a later conflicting origin rather than silently changing Envoy.
    const resolved = new URL(wsHref);
    const origin = `${resolved.protocol}//${resolved.host}`;
    if (envoyQueryWsOrigin && envoyQueryWsOrigin !== origin) {
        throw new Error(
            `subscription ws_href origin changed from ${envoyQueryWsOrigin} to ${origin}; configure REGISTRY_QUERY_WS_URL`
        );
    }
    envoyQueryWsOrigin = origin;
    return wsHref;
};

// apply one message's data items to the device set. The first message after a
// (re)connection is the sync of current state, so it replaces the set; this is
// how reconnecting after an interruption refreshes all mappings, including
// Devices removed while disconnected.
const handleMessage = (raw, connection) => {
    const message = JSON.parse(raw);
    const data = message && message.grain && message.grain.data;
    if (!Array.isArray(data)) return;
    if (!connection.primed) {
        devices = new Map();
        connection.primed = true;
    }
    for (const item of data) {
        if (item.post) devices.set(item.post.id, item.post);
        else if (item.pre) devices.delete(item.pre.id);
    }
    rebuild();
};

// open the subscription WebSocket and resolve when it closes, so the caller
// can resubscribe
const runConnection = wsHref =>
    new Promise(resolve => {
        const ws = new WebSocket(wsHref);
        const connection = { primed: false };
        let settled = false;
        const settle = () => {
            if (settled) return;
            settled = true;
            resolve();
        };
        ws.addEventListener('open', () => {
            backoffMs = RECONNECT_MIN_MS;
            log(`subscribed to Devices via ${wsHref}`);
        });
        ws.addEventListener('message', event => {
            try {
                handleMessage(event.data, connection);
            } catch (e) {
                log(`failed to handle subscription message: ${e.message}`);
            }
        });
        ws.addEventListener('error', event => {
            log(`websocket error: ${event.message || 'connection error'}`);
            settle();
        });
        ws.addEventListener('close', () => {
            log('websocket closed, will resubscribe');
            settle();
        });
    });

const run = async () => {
    for (;;) {
        try {
            const wsHref = await createSubscription();
            // publish the browser-facing Query WebSocket route once its
            // upstream is known
            rebuild();
            await runConnection(wsHref);
        } catch (e) {
            log(`subscription failed: ${e.message}`);
        }
        // the previous non-persistent subscription is dropped on disconnect;
        // a fresh subscribe yields a new sync of current state. The last good
        // configuration keeps being served until that sync arrives.
        await sleep(backoffMs);
        backoffMs = Math.min(backoffMs * 2, RECONNECT_MAX_MS);
    }
};

const main = () => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    // write a baseline configuration immediately so Envoy can serve the
    // Registry and app routes before the first subscription sync
    apply([], state);
    log(`subscribing to ${REGISTRY_QUERY_URL}/devices`);
    return run();
};

main().catch(e => {
    console.error(e);
    process.exit(1);
});
