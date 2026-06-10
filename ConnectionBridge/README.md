# NMOS Connection API Bridge

Provides browser-accessible proxy access to [AMWA IS-05](https://specs.amwa.tv/is-05/) Connection APIs exposed by Devices registered in an NMOS Registry, where the browser may not have network access to the Device APIs directly.

The bridge must not behave as an open proxy. Targets originate exclusively from registered Device `controls` entries; public requests use Device IDs only and arbitrary URLs are forbidden. The registry remains the source of truth and requires no changes.

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

- **Envoy** performs all proxying: routing, request size limits, timeouts, retry policy, health checking and failover, and access logging of `POST` and `PATCH` requests.
- **The adapter** (`adapter/`) converts registry state into Envoy configuration. It polls the Query API for Devices, extracts Connection API controls, and generates Envoy routes and clusters, atomically replacing the dynamic configuration files (`rds.json`, `cds.json`) which Envoy reloads via filesystem watch. The adapter does not proxy traffic and does not determine runtime health.

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
| `REGISTRY_QUERY_URL` | Query API used for Device discovery, also routed at `/x-nmos/` | (required) |
| `APP_URL` | optionally serve the nmos-js app through Envoy at `/` | (none) |
| `POLL_INTERVAL_SECONDS` | registry polling interval | `15` |
| `ROUTE_TIMEOUT_SECONDS` | upstream request timeout | `15` |
| `OUTPUT_DIR` | where dynamic Envoy configuration is written | `/etc/envoy/dynamic` |

Envoy listens on port 8080 and routes:

- `/x-nmos-bridge/v1.0/devices/...` to Device Connection APIs
- `/x-nmos/...` to the registry
- everything else to the nmos-js app, if `APP_URL` is set

## Browser application behavior

The nmos-js client offers a **Connection Bridge** setting with three modes:

- **No Bridge** (default): use the Device control hrefs directly, never the bridge.
- **Auto Bridge**: the preferred access sequence. Use the Device control href directly; if inaccessible, use the bridge URL; cache the successful access path per Device. Note that on first access to a Device that is not directly reachable, the browser must wait for the direct attempt to fail (up to 5 seconds) before falling back; the cached path avoids this on subsequent accesses.
- **Forced Bridge**: always use the bridge, skipping direct attempts entirely. Useful when it is known that no Device is reachable from the browser.

`POST` and `PATCH` requests are not automatically retried via alternate paths; they follow whichever path was resolved for the Device. The client expects the bridge on the same host as the configured Query API.

## Status

Phase 1 (HTTP browser and upstream access, file-based dynamic configuration, `GET`/`POST`/`PATCH`, no response rewriting) is implemented, plus health checking and multi-endpoint failover from Phase 2. Not yet implemented: response size limits, HTTPS upstreams, authentication translation, mTLS, and an xDS control plane.
