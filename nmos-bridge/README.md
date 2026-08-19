# NMOS Bridge

Provides browser-accessible proxy access to [AMWA IS-05](https://specs.amwa.tv/is-05/) Connection APIs and [AMWA IS-08](https://specs.amwa.tv/is-08/) Channel Mapping APIs exposed by Devices registered in an NMOS Registry, where the browser may not have network access to the Device APIs directly.

The bridge must not behave as an open proxy. Targets originate exclusively from registered Device `controls` entries; public requests use Device IDs only and arbitrary URLs are forbidden. The Registry remains the source of truth and requires no changes.

## Public Bridge API

```text
/x-nmos-bridge/v1.0/devices/{device_id}/{api}/{version}/{sub-path}
```

proxies to:

```text
{href}/{sub-path}
```

where `href` is taken from the Device resource `controls` entry matching the control type for `{api}`:

| `{api}` | Control type | Device API |
| --- | --- | --- |
| `connection` | `urn:x-nmos:control:sr-ctrl/{version}` | IS-05 Connection |
| `channelmapping` | `urn:x-nmos:control:cm-ctrl/{version}` | IS-08 Channel Mapping |

`{api}` is the same path segment as in the advertised `href` (`/x-nmos/{api}/{version}`). The bridge API version (`v1.0`) is independent of the Device API version (`{version}`).

For example:

```text
PATCH /x-nmos-bridge/v1.0/devices/{device_id}/connection/v1.1/single/receivers/{receiver_id}/staged
```

is proxied to:

```text
PATCH http://device.example.local/x-nmos/connection/v1.1/single/receivers/{receiver_id}/staged
```

Methods are restricted to `GET`, `HEAD`, `POST`, `PATCH`, `DELETE` and `OPTIONS`, the union of the methods the proxied Device APIs use; which methods a given resource actually supports is up to the Device. Query strings, methods and request bodies are preserved. `GET` and `HEAD` requests may be retried; mutating methods are never automatically retried.

`GET /x-nmos-bridge` and `GET /x-nmos-bridge/v1.0` return listings (`["v1.0/"]` and `["devices/","query/"]`). Devices are not listed; the Registry remains the source of truth for which Devices exist. Given a Device ID from the Registry, `GET …/devices/{device_id}` lists the APIs proxied for that Device (e.g. `["channelmapping/","connection/"]`) and `GET …/devices/{device_id}/{api}` lists the versions, so a client can see what became a bridge target without inspecting Envoy configuration.

Query subscription WebSockets use a canonical bridge path (nmos-cpp `ws_href` path shape). The handshake:

```text
GET /x-nmos-bridge/v1.0/query/{version}/subscriptions/{id}
Upgrade: websocket
Connection: Upgrade
```

is proxied to the Registry Query API WebSocket listener as:

```text
GET /x-nmos/query/{version}/subscriptions/{id}
Upgrade: websocket
Connection: Upgrade
```

Bridge-aware clients build that URL from the Bridge API origin, Query version, and subscription `id`; they do not open the absolute `ws_href` from the subscription resource when using the bridge as the browser-facing proxy. Query **HTTP** remains on `/x-nmos/query/...` (optional convenience).

Every other path under `/x-nmos-bridge`, including other bridge API versions and a version or API that is not a target for that Device, returns `404` with an NMOS error body, so nothing in the bridge namespace falls through to the optional app route on `/`.

## Architecture

```text
Browser
    |
    +--(HTTP / WebSocket)------> Registry Query API (when reachable directly)
    |
    +--(HTTP / WebSocket)------> Envoy
                                    |
                                    +--> /x-nmos-bridge/devices/... --> Device Control APIs
                                    |
                                    +--> /x-nmos-bridge/query/.../subscriptions/{id}
                                    |         --(WebSocket)--> Registry Query API
                                    |
                                    +--> /x-nmos -> ["query/"] (fixed listing)
                                    |
                                    +--> /x-nmos/query/... (HTTP convenience)
                                    |         --> Registry Query API
                                    |
                                    +--> /x-dns-sd/... (convenience)
                                    |         --> Registry DNS-SD API
                                    |
                                    +--> /log/... (convenience)
                                    |         --> Registry Logging API
                                    |
                                    +--> /... (optional) --> nmos-js app

Adapter (server-side; not on the browser path)
    |
    +--(HTTP / WebSocket)------> Registry Query API (Device discovery)
```

The NMOS Bridge consists of Envoy and the adapter service:

- **Envoy** proxies browser HTTP to Device Control APIs on `/x-nmos-bridge/...` (required for the bridge), and Query subscription WebSockets on `/x-nmos-bridge/v1.0/query/...` (rewritten to the Registry Query API WebSocket path). It may also proxy Query **HTTP** on `/x-nmos/query/...`, DNS-SD on `/x-dns-sd/...`, and the nmos-js app on `/` as optional convenience. `GET /x-nmos/` returns a fixed listing of `["query/"]` so discovery matches what is actually proxied. Other `/x-nmos/` APIs (Registration, Node, …) are not proxied — they may use different ports. It applies routing, request size limits, timeouts, retry policy, health checking and failover, and access logging of mutating requests.
- **The adapter** (`adapter/`) converts Registry state into Envoy configuration. It tracks Devices through a [Query API WebSocket subscription](https://specs.amwa.tv/is-04/branches/v1.3.x/docs/4.2._Behaviour_-_Querying.html) (non-persistent, `resource_path` `/devices`), extracts Device controls, and generates Envoy routes and clusters, atomically replacing the dynamic configuration files (`rds.json`, `cds.json`) which Envoy reloads via filesystem watch. The adapter does not proxy traffic and does not determine runtime health.

  On connecting, the Registry sends a sync of all current Devices, then pushes added, modified and removed events; the adapter rebuilds configuration on each change. If the connection is interrupted, the adapter resubscribes with exponential backoff and the fresh sync re-establishes all mappings, including Devices that were removed while disconnected. The last good configuration keeps being served until the new sync arrives.

### Mapping

Each unique combination of Device ID, API and version is a separate bridge target, producing one route and one cluster with deterministic names:

```text
nmos_bridge_device_{safe_device_id}_{api}_{safe_version}
```

where characters outside `[A-Za-z0-9_]` are replaced by `_` (e.g. `v1.1` becomes `v1_1`). Separate APIs and versions are never merged: a `v1.0` route cannot fail over to a `v1.1` href, and a Connection API route cannot fail over to a Channel Mapping href even when the Device advertises both at the same host and port.

If multiple eligible hrefs exist for the same Device and version, they become candidates of a single cluster, prioritized as:

```text
priority 0: private IP address hrefs
priority 1: private DNS hrefs
priority 2: other hrefs
```

Envoy health checks the candidates and fails over from higher to lower priority when the preferred candidates become unhealthy.

Controls that are not safe to proxy are logged and ignored: missing or malformed hrefs, unsupported schemes (Phase 1 supports `http` upstreams only), hrefs whose path is inconsistent with the advertised version, and duplicates after normalization.

## Testing

Location rewrite policy is covered by Lua unit tests (Lua 5.1 / LuaJIT, matching Envoy). From `envoy/`:

```bash
lua5.1 location_rewrite_test.lua
lua5.1 location_rewrite_test.lua -v   # per-case status lines
```

## Running

```bash
docker compose up --build
```

Edit `docker-compose.yml` first to point the adapter at the deployment:

| Variable | Description | Default |
| --- | --- | --- |
| `REGISTRY_QUERY_URL` | Query API URL used by the adapter for Device discovery; its host and port are the upstream for Envoy's `/x-nmos/query/` routes (and `/x-dns-sd/` / `/log/` when the corresponding override is unset). The path in this URL is not used for proxying. | (required) |
| `REGISTRY_DNS_SD_URL` | optional upstream for Envoy's `/x-dns-sd/` routes when DNS-SD is not on the same host/port as `REGISTRY_QUERY_URL` | (same as Query) |
| `REGISTRY_LOGGING_URL` | optional upstream for Envoy's `/log/` routes when Logging is not on the same host/port as `REGISTRY_QUERY_URL` | (same as Query) |
| `APP_URL` | upstream for Envoy's catch-all `/` route (standalone nmos-js at `/`, or a Registry that serves the UI under `/admin`); if unset, no application route is configured | (none) |
| `ROUTE_TIMEOUT_SECONDS` | upstream request timeout | `15` |
| `MAX_UPDATE_RATE_MS` | subscription `max_update_rate_ms` (event coalescing) | `100` |
| `RECONNECT_MIN_MS` | initial WebSocket reconnect backoff | `1000` |
| `RECONNECT_MAX_MS` | maximum WebSocket reconnect backoff | `30000` |
| `REGISTRY_QUERY_WS_URL` | WebSocket scheme and authority to use instead of those in the subscription `ws_href`; the advertised subscription path is preserved; an omitted port means the scheme default | (none) |
| `OUTPUT_DIR` | where dynamic Envoy configuration is written | `/etc/envoy/dynamic` |

Envoy listens on port 8080 and routes:

- `/x-nmos` and `/x-nmos/` return a fixed IS-04-style listing of `["query/"]` (only what this Envoy instance proxies)
- `/x-nmos/query/...` to the Registry Query API (convenience; see Deployment)
- `/x-dns-sd/...` to the Registry DNS-SD / MDNS API (convenience; same upstream as Query unless `REGISTRY_DNS_SD_URL` is set)
- `/log/...` to the Registry Logging API (convenience; same upstream as Query unless `REGISTRY_LOGGING_URL` is set)
- everything else to the nmos-js app (or Registry UI), if `APP_URL` is set

## Deployment

The bridge itself only requires browser HTTP access to
`/x-nmos-bridge/v1.0/...` on Envoy. Proxying Query HTTP on `/x-nmos/query/...`,
DNS-SD on `/x-dns-sd/...`, and Logging on `/log/...` is convenience (one
browser-facing HTTP origin when the SPA is also served via `APP_URL`, or when
those SPA settings point at Envoy). Registration, Node, and other non-Query
`/x-nmos/` APIs are not proxied; `GET /x-nmos/` therefore lists only `query/`,
rather than reflecting the Registry's full `/x-nmos/` catalogue. By default
`/x-dns-sd/` and `/log/` use the same upstream host and port as
`REGISTRY_QUERY_URL`; set `REGISTRY_DNS_SD_URL` or `REGISTRY_LOGGING_URL` when
those APIs listen elsewhere (for example a different `mdns_port` or
`logging_port`).

`APP_URL` may be a standalone nmos-js host (SPA at `/`) or a Registry that
serves the UI under `/admin` (nmos-cpp-registry). In both cases Envoy's `/log/`
route supports the SPA Logging API default (`{origin}/log/v1.0`).

Configure nmos-js **NMOS Bridge API** to the bridge base, for example:

```text
http://controller.example.com:8080/x-nmos-bridge/v1.0
```

The default (when unset in config or Settings) is this page's origin plus
`/x-nmos-bridge/v1.0`.

A layout that also proxies Query and Logging through Envoy might use:

```text
Query API:              http://controller.example.com:8080/x-nmos/query/v1.3
Logging API:            http://controller.example.com:8080/log/v1.0
NMOS Bridge API:        http://controller.example.com:8080/x-nmos-bridge/v1.0
```

Query API WebSocket subscriptions for **bridge-aware** clients use `/x-nmos-bridge/v1.0/query/{version}/subscriptions/{id}` through Envoy (static path rewrite to the Registry Query API WebSocket listener). The subscription resource's absolute `ws_href` is unchanged and still names the Registry; clients that only follow `ws_href` need to reach that listener. The adapter's server-side subscription is separate: it must reach the Query API and the WebSocket URL from the subscription response. Set `REGISTRY_QUERY_WS_URL` when the advertised `ws_href` uses a scheme, host name or port which is not reachable from the adapter (and from Envoy), for example `ws://192.168.6.101:81`. That override is also the upstream for the browser-facing Query subscription WebSocket route.

WebSocket routes use `timeout: 0s` and `WS_IDLE_TIMEOUT_SECONDS` (default `3600`) so long-lived grains are not cut by `ROUTE_TIMEOUT_SECONDS`.

Envoy must be able to reach every Device Control API `href` which is to be
used through the bridge. This is independent of browser reachability: the
purpose of the bridge is to place Envoy on the Device networks when the
browser cannot access those networks directly. Configure the container or
host networking and any firewall policy accordingly.

The included Compose file uses a shared volume for dynamic configuration.
The adapter writes configuration into the volume and Envoy watches it for
changes. Keep one adapter and one Envoy instance together when using this
file-based arrangement. A deployment with independently scaled Envoy
instances would require an xDS control plane, which is not currently
implemented.

If nmos-js is served separately, set Query API, Logging API and NMOS Bridge
API as needed (Registry and/or Envoy). Alternatively, set `APP_URL`
and use Envoy as a single origin for nmos-js, Query/DNS-SD/Logging APIs, and
the bridge.

### Container Orchestration

The same adapter and Envoy arrangement can be deployed as containers sharing
a writable configuration volume. In Kubernetes, they can run as containers
in one Pod with an `emptyDir` volume. The Pod needs network interfaces and
routes which can reach the Device Control API addresses; this may require
secondary networking in deployments where media devices are outside the
cluster network. Kubernetes and OpenShift manifests are deployment-specific
and are not included here.

## Browser Application Behavior

The nmos-js client offers a **NMOS Bridge Mode** and a separate
**NMOS Bridge API**. The same mode applies to Device Control API fetches (Connection, Channel Mapping, …):

- **No Bridge** (default): use the Device control hrefs directly, never the bridge.
- **Auto Bridge**: the preferred access sequence. Use the Device control href directly; if inaccessible, use the bridge URL; cache the successful access path per Device (shared across Device Control APIs). Note that on first access to a Device that is not directly reachable, the browser must wait for the direct attempt to fail (up to 5 seconds) before falling back; the cached path avoids this on subsequent accesses.
- **Forced Bridge**: always use the bridge, skipping direct attempts entirely. Useful when it is known that no Device is reachable from the browser.

`POST`, `PATCH` and `DELETE` requests are not automatically retried via alternate paths; they follow whichever path was resolved for the Device (`$connectionAPI` / `$channelmappingAPI`). Bridge requests use the configured NMOS Bridge API (default: SPA origin + `/x-nmos-bridge/v1.0`).

## Status

Phase 1 is implemented, plus health checking and multi-endpoint failover from Phase 2:

- HTTP browser and upstream access, file-based dynamic configuration
- `GET`/`HEAD`/`POST`/`PATCH`/`DELETE`
- Upstream 3xx `Location` handling (see below)
- Query subscription WebSockets on `/x-nmos-bridge/v1.0/query/...` (static rewrite to the Registry Query API WebSocket listener)

Not yet implemented: response size limits, HTTPS upstreams, authentication translation, mTLS, and an xDS control plane.

`Location` handling uses each target's `base_path` (the path of the Device control `href`, typically `/x-nmos/connection/v1.1`, `/x-nmos/channelmapping/v1.0` or similar):

- Absolute or scheme-relative (filled with the client scheme) Locations whose scheme and authority match a candidate for that target and whose path stays under that `base_path` are rewritten onto the bridge; other absolute Locations are forwarded unchanged (including candidate URLs outside `base_path`, e.g. `http://device/x-manifest/...`).
- Path-relative and root-relative Locations are resolved against the upstream API path and rewritten onto the bridge when they stay under `base_path`; relatives outside `base_path` are rejected with `502` and an NMOS error body (`x-nmos-bridge-error` describes the unsupported Location), since an absolute Device URL cannot be reconstructed without knowing which candidate Envoy selected.
- Envoy internal redirects are not used: absolute Device Locations under `/x-nmos/` would be matched by path (e.g. `/x-nmos/query/` onto the Query cluster) rather than treated as Device API targets.
