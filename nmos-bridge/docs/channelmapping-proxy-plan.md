# Design plan: Envoy proxying for IS-08 Channel Mapping API

Status: proposal (not implemented). Extends the NMOS Bridge in
`nmos-bridge/README.md`, which today proxies browser HTTP only for Device
Connection controls (`urn:x-nmos:control:sr-ctrl/{version}`).

## Motivation

IS-08 Channel Mapping is advertised on Devices as
`urn:x-nmos:control:cm-ctrl/{version}` with an HTTP `href` (nmos-cpp:
`http://host:port/x-nmos/channelmapping/{version}`). nmos-js already loads
Channel Mapping data from those hrefs for the Device UI, but it does **not**
use the NMOS Bridge. In deployments where the browser cannot reach Device
networks, IS-05 works via `/x-nmos-bridge/...` while IS-08 still fails.

Channel Mapping is the same reachability class as Connection: HTTP Device
control API, Registry as source of truth via Device `controls`, no open URL
proxy.

## Decision: same pattern as Connection (HTTP)

| | Connection (today) | Channel Mapping (proposed) |
| --- | --- | --- |
| Control type | `urn:x-nmos:control:sr-ctrl/{ver}` | `urn:x-nmos:control:cm-ctrl/{ver}` |
| Upstream | control `href` | control `href` |
| Public path | `/x-nmos-bridge/v1.0/devices/{id}/connection/{ver}/…` | `/x-nmos-bridge/v1.0/devices/{id}/channelmapping/{ver}/…` |
| Transport | HTTP | HTTP |
| Discovery | Device Query subscription (adapter) | Same |
| Client remap | Forced / Auto Bridge | Same modes and Bridge API origin |

Semantically: downstream bridge URL identifies Device + API version; Envoy
proxies to that control's `href` (`prefix_rewrite` to `basePath`).

Cluster naming, e.g.:

```text
nmos_bridge_device_{safe_device_id}_channelmapping_{safe_version}
```

Do not merge Connection and Channel Mapping clusters. Candidate priorities:
same private-IP / private-DNS / other ordering as Connection. Keep one Bridge
API prefix; distinguish by `…/connection/…` vs `…/channelmapping/…`.

## Adapter changes

- Parse `urn:x-nmos:control:cm-ctrl/(v\d+\.\d+)`.
- Allow `http:` upstreams (same as Connection Phase 1); skip non-http until
  HTTPS is in scope.
- Require `basePath` consistent with `/x-nmos/channelmapping/{version}`
  (parallel to Connection's `/x-nmos/connection/{version}` check).
- Emit routes like Connection: `path_separated_prefix`, `prefix_rewrite` to
  `basePath`, GET retry policy, no automatic retry on mutating methods,
  `Location` rewrite using this target's `basePath` (reuse existing Lua
  policy).
- **Health checks:** HTTP on `basePath/` works (unlike NCP WebSocket).
- Log and skip malformed / inconsistent hrefs (same as Connection).

Generalizing "HTTP Device control" collection for `sr-ctrl` and `cm-ctrl` in
one helper is fine if it stays small; do not over-abstract for speculative
control types.

## Method allow-list

IS-08 (nmos-cpp) uses roughly:

- **GET** — catalogue, inputs/outputs, maps, activations
- **POST** — `/map/activations/`
- **DELETE** — cancel `/map/activations/{id}`

Today's bridge allow-list is GET, HEAD, POST, PATCH, OPTIONS (Connection).

**Add DELETE** (and CORS `allow_methods`) when Channel Mapping routes land.
PATCH remains for Connection; Channel Mapping does not need it but sharing one
CORS policy is fine.

Access logging: log POST and DELETE on Channel Mapping routes (and keep
POST/PATCH for Connection), consistent with "mutating methods are logged."

## Client changes (nmos-js)

Channel Mapping in `dataProvider` currently gathers control hrefs and fetches
them directly (`getChannelMappingEndPoints`). It does not consult Connection
Bridge Mode.

- When Bridge Mode is **Forced**, use
  `{bridge}/devices/{deviceId}/channelmapping/{version}` instead of raw hrefs
  (same Bridge API base as Connection).
- When **Auto**, try direct hrefs then fall back to bridge (same 5s / cache
  behaviour as Connection if practical).
- When **No Bridge**, unchanged.

Ensure redirects and relative links under the Channel Mapping API stay on the
bridge via existing `Location` handling.

## Deployment notes

- Envoy must reach Device **Channel Mapping** ports (`channelmapping_port` on
  nmos-cpp may differ from the Connection API port).
- No change to Query HTTP convenience routes or adapter Device discovery.
- README: document Channel Mapping under the bridge public API and method
  list.

## Non-goals

- WebSocket proxying (Query / NCP) — separate plan:
  `docs/websocket-proxy-plan.md` on `feature/envoy-websocket-proxy`.
- HTTPS upstreams, auth translation, mTLS.
- Open proxying of arbitrary Channel Mapping URLs.
- Changing IS-08 or requiring Node/Registry changes.

## Sequencing

| Step | Work |
| --- | --- |
| 1 | Adapter: collect `cm-ctrl` targets; routes + DELETE on allow-list / CORS |
| 2 | Confirm `Location` rewrite with Channel Mapping `basePath` (reuse tests / add cases if needed) |
| 3 | nmos-js: Forced (then Auto) remap for Channel Mapping fetches |
| 4 | README + Easy-NMOS note: browser need not reach Device channelmapping ports |

## Acceptance

- With Device networks blocked from the browser, Forced Bridge can GET IS-08
  resources and POST/DELETE activations through Envoy against a node only
  Envoy can reach.
- Unknown device id → 404 on the bridge path; non-allow-listed methods → 405.
- Connection bridge behaviour unchanged aside from shared DELETE/CORS if
  applied globally.
- No open proxy: only registered `cm-ctrl` hrefs become targets.

## References

- `nmos-bridge/README.md` — Connection bridge mapping and deployment
- IS-08 Channel Mapping / `urn:x-nmos:control:cm-ctrl`
- nmos-js `dataProvider` Channel Mapping paths (direct hrefs today)
