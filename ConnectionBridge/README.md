# NMOS Connection API Bridge

Provides browser-accessible proxy access to [AMWA IS-05](https://specs.amwa.tv/is-05/) Connection APIs exposed by Devices registered in an NMOS Registry, where the browser may not have network access to the Device APIs directly.

The bridge must not behave as an open proxy. Targets originate exclusively from registered Device `controls` entries; public requests use Device IDs only and arbitrary URLs are forbidden. The Registry remains the source of truth and requires no changes.

## Public Bridge API

```text
/x-nmos-bridge/v1.0/devices/{device_id}/connection/{version}/{sub-path}
```

proxies to:

```text
{href}/{sub-path}
```

where `href` is taken from the Device resource `controls` entry matching `urn:x-nmos:control:sr-ctrl/{version}`. The bridge API version (`v1.0`) is independent of the Connection API version (`{version}`).

For example:

```text
PATCH /x-nmos-bridge/v1.0/devices/{device_id}/connection/v1.1/single/receivers/{receiver_id}/staged
```

is proxied to:

```text
PATCH http://device.example.local/x-nmos/connection/v1.1/single/receivers/{receiver_id}/staged
```

Methods are restricted to `GET`, `POST`, `PATCH` and `OPTIONS`. Query strings, methods and request bodies are preserved. `GET` requests may be retried; `POST` and `PATCH` are never automatically retried.

## Architecture

```text
Browser
    |
    v
 Envoy
    |
    +--> Registry APIs
    |
    +--> NMOS Connection API Bridge
             |
             v
        Device Connection APIs
```

The Connection API Bridge consists of Envoy and the adapter service:

- **Envoy** performs all proxying: routing, request size limits, timeouts, retry policy, health checking and failover, and access logging of `POST` and `PATCH` requests.
- **The adapter** (`adapter/`) converts Registry state into Envoy configuration. It tracks Devices through a [Query API WebSocket subscription](https://specs.amwa.tv/is-04/branches/v1.3.x/docs/4.2._Behaviour_-_Querying.html) (non-persistent, `resource_path` `/devices`), extracts Connection API controls, and generates Envoy routes and clusters, atomically replacing the dynamic configuration files (`rds.json`, `cds.json`) which Envoy reloads via filesystem watch. The adapter does not proxy traffic and does not determine runtime health.

  On connecting, the Registry sends a sync of all current Devices, then pushes added, modified and removed events; the adapter rebuilds configuration on each change. If the connection is interrupted, the adapter resubscribes with exponential backoff and the fresh sync re-establishes all mappings, including Devices that were removed while disconnected. The last good configuration keeps being served until the new sync arrives.

### Mapping

Each unique combination of Device ID and Connection API version is a separate bridge target, producing one route and one cluster with deterministic names:

```text
nmos_bridge_device_{safe_device_id}_connection_{safe_connection_version}
```

where characters outside `[A-Za-z0-9_]` are replaced by `_` (e.g. `v1.1` becomes `v1_1`). Separate Connection API versions are never merged: a `v1.0` route cannot fail over to a `v1.1` href.

If multiple eligible hrefs exist for the same Device and version, they become candidates of a single cluster, prioritized as:

```text
priority 0: private IP address hrefs
priority 1: private DNS hrefs
priority 2: other hrefs
```

Envoy health checks the candidates and fails over from higher to lower priority when the preferred candidates become unhealthy.

Controls that are not safe to proxy are logged and ignored: missing or malformed hrefs, unsupported schemes (Phase 1 supports `http` upstreams only), hrefs whose path is inconsistent with the advertised version, and duplicates after normalization.

## Running

```bash
docker compose up --build
```

Edit `docker-compose.yml` first to point the adapter at the deployment:

| Variable | Description | Default |
| --- | --- | --- |
| `REGISTRY_QUERY_URL` | Query API URL used for Device discovery; its host and port are also used as the upstream for Envoy's `/x-nmos/` routes | (required) |
| `APP_URL` | nmos-js application URL used as the upstream for Envoy's catch-all `/` route; if unset, no application route is configured | (none) |
| `ROUTE_TIMEOUT_SECONDS` | upstream request timeout | `15` |
| `MAX_UPDATE_RATE_MS` | subscription `max_update_rate_ms` (event coalescing) | `100` |
| `RECONNECT_MIN_MS` | initial WebSocket reconnect backoff | `1000` |
| `RECONNECT_MAX_MS` | maximum WebSocket reconnect backoff | `30000` |
| `REGISTRY_QUERY_WS_URL` | WebSocket scheme and authority to use instead of those in the subscription `ws_href`; the advertised subscription path is preserved | (none) |
| `OUTPUT_DIR` | where dynamic Envoy configuration is written | `/etc/envoy/dynamic` |

Envoy listens on port 8080 and routes:

- `/x-nmos-bridge/v1.0/devices/...` to Device Connection APIs
- `/x-nmos/...` to the Registry
- everything else to the nmos-js app, if `APP_URL` is set

## Deployment

Deploy Envoy as the browser-facing endpoint for both the Query API and the
Connection API Bridge. Configure nmos-js to use the Query API through Envoy,
for example:

```text
http://controller.example.com:8080/x-nmos/query/v1.3
```

The client derives the bridge origin from the configured Query API, so the
corresponding bridge URL is:

```text
http://controller.example.com:8080/x-nmos-bridge/v1.0
```

The adapter must be able to reach the Query API and the WebSocket URL
advertised when it creates the Query API subscription. Set
`WS_USE_REGISTRY_HOST=true` when the advertised `ws_href` uses a host name or
address which is not reachable from the adapter but the host in
`REGISTRY_QUERY_URL` is reachable.

Envoy must be able to reach every Device Connection API `href` which is to be
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

If nmos-js is served separately, expose Envoy as the Query API endpoint and
configure nmos-js to use it. Alternatively, set `APP_URL` and use Envoy as a
single origin for nmos-js, the Registry APIs, and the bridge.

### Container Orchestration

The same adapter and Envoy arrangement can be deployed as containers sharing
a writable configuration volume. In Kubernetes, they can run as containers
in one Pod with an `emptyDir` volume. The Pod needs network interfaces and
routes which can reach the Device Connection API addresses; this may require
secondary networking in deployments where media devices are outside the
cluster network. Kubernetes and OpenShift manifests are deployment-specific
and are not included here.

## Browser Application Behavior

The nmos-js client offers a **Connection Bridge** setting with three modes:

- **No Bridge** (default): use the Device control hrefs directly, never the bridge.
- **Auto Bridge**: the preferred access sequence. Use the Device control href directly; if inaccessible, use the bridge URL; cache the successful access path per Device. Note that on first access to a Device that is not directly reachable, the browser must wait for the direct attempt to fail (up to 5 seconds) before falling back; the cached path avoids this on subsequent accesses.
- **Forced Bridge**: always use the bridge, skipping direct attempts entirely. Useful when it is known that no Device is reachable from the browser.

`POST` and `PATCH` requests are not automatically retried via alternate paths; they follow whichever path was resolved for the Device. The client expects the bridge on the same host as the configured Query API.

## Status

Phase 1 (HTTP browser and upstream access, file-based dynamic configuration, `GET`/`POST`/`PATCH`, no response rewriting) is implemented, plus health checking and multi-endpoint failover from Phase 2. Not yet implemented: response size limits, HTTPS upstreams, authentication translation, mTLS, and an xDS control plane.
