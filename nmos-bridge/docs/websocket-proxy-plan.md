# Design plan: Envoy WebSocket proxying (Query API and Device NCP)

Status: Query subscription WebSocket proxying implemented; Device NCP WebSocket
proxying implemented (adapter + Forced Bridge IS-12 launch). Envoy WS spike
validated 2026-08-18 (see Investigation notes). Complements the NMOS Bridge in
`nmos-bridge/README.md`.

## Motivation

When the browser cannot reach the Registry or Devices directly, Envoy is the
single browser-facing proxy for discovery HTTP and IS-05. Two WebSocket paths
still bypass Envoy:

| Path | Who opens it | Advertised / used URL |
| --- | --- | --- |
| Registry Query subscription | Browser clients that use grains; adapter (server-side, already OK) | Absolute `ws_href` on the subscription resource |
| Device NCP (IS-12 / BCP-008) | IS-12 browser (`?uri=…`) | Device `controls` entry `urn:x-nmos:control:ncp/{version}` |

Without proxying those sockets, "Forced Bridge" / single-origin deployments still
require browser reachability to Registry `query_ws_port` and to each Device NCP
`href`. That breaks the same network story the NMOS Bridge solves for
IS-05.

## Design principles (agreed)

1. **Bridge-aware clients remap; do not rewrite Registry JSON** — prefer
   bridge-style canonical public URLs over Lua/`ws_href` response rewriting.
2. **Downstream path identifies the resource; Envoy proxies to the real
   socket** — semantically the upstream is that resource's `ws_href` (Query
   subscription) or Device control `href` (NCP).
3. **nmos-cpp Query WS uses static rewrite** — one Registry WS cluster + path
   template. Avoid per-subscription Envoy routes (see Case A).
4. **NCP uses per-Device routing like Connection** — many Devices, many
   `href`s, driven by the existing Device Query subscription.

## Non-goals (this plan)

- Open proxying of arbitrary WebSocket URLs (same rule as Connection: targets
  only from Registry-advertised resources / bridge identifiers).
- Changing IS-04 / IS-12 formats or requiring Registry/Node changes.
- HTTPS / WSS upstreams, auth translation, mTLS (later, with Connection Phase
  follow-ons).
- Replacing the adapter's own Query subscription (it keeps talking to the
  Registry directly, including `REGISTRY_QUERY_WS_URL`).
- Transparent IS-04 clients that only open advertised `ws_href` with no bridge
  awareness (would need response rewrite; deferred).

## Shared Envoy requirements

Both cases need:

1. **Upgrade** — `upgrade_configs: [{ upgrade_type: "websocket" }]` on WS
   routes. Keep Query **HTTP** on `/x-nmos/query/...` and Query **WS** on the
   bridge path (Case A) so HTTP and WS need not share one route match.
2. **Timeouts** — current bridge routes use `ROUTE_TIMEOUT_SECONDS` (default
   15s). That must not apply to upgraded connections. Prefer route
   `timeout: 0s` (or equivalent) plus an `idle_timeout` suitable for long-lived
   grains / NCP sessions.
3. **Schemes** — Phase 1: `ws://` upstreams only (parallel to Connection's
   `http` only). Browser-facing Envoy may be `ws://` or `wss://` depending on
   its TLS configuration.
4. **No CORS for WS** — browsers do not CORS-preflight WebSockets; `Origin` is
   advisory to the upstream. Unifying under Envoy helps reachability and TLS,
   not CORS.

---

## Case A — Registry Query API WebSocket

### Problem detail

nmos-cpp-registry builds subscription `ws_href` as:

- scheme from subscription `secure` / client TLS settings
- **host** from the HTTP request Host used to create the subscription
- **port** from settings `query_ws_port` (often `http_port + 1`), not from the
  request
- path `/x-nmos/query/{version}/subscriptions/{id}`

So even when the browser creates the subscription through Envoy (`Host` =
Envoy), `ws_href` typically points at Envoy's hostname on the **Registry WS
port**, which is not Envoy `:8080` and is often unreachable from the browser.
Absolute `ws_href` (`format: uri` in IS-04) means clients do not derive the
socket from the Query HTTP origin.

The adapter already works around unreachable advertised hosts with
`REGISTRY_QUERY_WS_URL` (scheme/authority override, path preserved). Browsers
have no equivalent today.

### Decision: canonical bridge path + client remap (not response rewrite)

Do **not** rewrite `ws_href` in HTTP responses. Do **not** take the public path
from the advertised `ws_href`. Bridge-aware clients build:

```text
WS /x-nmos-bridge/v1.0/query/{version}/subscriptions/{id}
```

from:

- configured NMOS Bridge API (or SPA) origin, as `ws` / `wss`
- Query API **version** from the configured Query URL (same version used for
  `POST .../subscriptions`)
- subscription **`id`** from the subscription JSON

Ignore advertised `ws_href` host, port, and path when opening the socket in
bridge mode. Treat `ws_href` as direct Registry access only (No Bridge /
non-bridge-aware clients).

This matches Connection: identifiers → canonical bridge URL, not "fix an
absolute URI."

### Upstream: proxy to the subscription's `ws_href` (static for nmos-cpp)

Semantically Envoy connects to that subscription's `ws_href`. For nmos-cpp every
`ws_href` shares one Query WS listener and a fixed path template, so
**implement with static rewrite**, not per-subscription clusters:

| Piece | Source |
| --- | --- |
| Upstream authority | `REGISTRY_QUERY_WS_URL` (required when WS port ≠ Query HTTP; already used by the adapter) |
| Upstream path | `/x-nmos/query/{version}/subscriptions/{id}` (nmos-cpp `ws_href` path shape) |

```text
Browser
  |  POST /x-nmos/query/v1.3/subscriptions     --> registry_query (HTTP)
  |  <- 200 { id, ws_href: "ws://registry:81/..." }   (unchanged)
  |  WS /x-nmos-bridge/v1.0/query/v1.3/subscriptions/{id}
  |       --> registry_query_ws + rewrite to
  |           /x-nmos/query/v1.3/subscriptions/{id}
```

- Cluster `registry_query` — unchanged (HTTP convenience).
- Cluster `registry_query_ws` — from `REGISTRY_QUERY_WS_URL`.
- One upgrade route (or prefix rule) under
  `/x-nmos-bridge/v1.0/query/` with idle-friendly timeouts and path rewrite.

**Why not per-subscription routing?** That would need a live `id → ws_href`
map. In nmos-cpp, `subscription` and `grain` are **not** queryable resource
types for grains (`is_queryable_resource`), so clients cannot WebSocket-
subscribe to `/subscriptions`. Tracking would mean **HTTP polling** of
`GET .../subscriptions` to drive CDS/RDS — a poor fit for create/delete churn
and the file-watch adapter. Static rewrite avoids that entirely for nmos-cpp.

Dynamic per-subscription clusters remain a speculative escape hatch only if
another Registry breaks the shared-listener / path-template assumption.

### Client impact

- Bridge-aware clients: after create/GET subscription, open WS at the
  canonical bridge URL using `id` + Query version; do not open `ws_href`.
- nmos-js currently manages Query subscriptions over HTTP but does not consume
  their WebSocket grains, so no SPA change is required for Case A.
- Subscription UI may still **display** Registry `ws_href` (direct); optional
  later: also show the bridge URL when bridge mode is on.
- Adapter keeps using `REGISTRY_QUERY_WS_URL` for its own socket; no need to
  subscribe via Envoy.
- Naive clients that only follow `ws_href` still need Registry WS reachability
  unless response rewrite is added later (non-goal for now).

### Risks and open questions

- **Other Registries** whose `ws_href` path is not
  `/x-nmos/query/{ver}/subscriptions/{id}` — static rewrite would be wrong;
  document nmos-cpp as the supported shape; escape hatch above.
- **Secure subscriptions** / WSS upstream — defer with WSS.
- Docs should state Query HTTP on `/x-nmos/query` remains optional convenience;
  Query WS uses the browser-facing bridge path.

### Acceptance (Case A)

- Browser creates a subscription via Envoy Query HTTP (or Registry HTTP); opens
  grain WS only via
  `/x-nmos-bridge/v1.0/query/{ver}/subscriptions/{id}`; works with Registry
  `query_ws_port` blocked from the browser.
- Returned `ws_href` may still name the Registry; bridge-aware client ignores
  it for the socket.
- Adapter discovery still works with `REGISTRY_QUERY_WS_URL`.
- Query HTTP convenience routes unchanged.

---

## Case B — Device NCP WebSocket

### Problem detail

Device `controls` include `type: urn:x-nmos:control:ncp/{version}` with an
`href` that is a WebSocket URL (e.g. `ws://device:7002/x-nmos/ncp/v1.0` on
nmos-cpp). The IS-12 client connects with `new WebSocket(href)` (launch URL
`?uri=`). The NMOS Bridge only maps `urn:x-nmos:control:sr-ctrl/{version}`
to HTTP under `/x-nmos-bridge/v1.0/devices/{id}/connection/{version}/…`.

Serving `/admin/is12-client` through Envoy does not help: the socket still goes
to the Device.

### Decision: same pattern as Connection (per-Device `href`)

NCP is **not** like Query WS static rewrite. Many Devices advertise many NCP
`href`s; the adapter already receives Device grains. Extend bridge-style
targets:

**Public API:**

```text
WS /x-nmos-bridge/v1.0/devices/{device_id}/ncp/{version}
```

proxies to that Device's NCP control `href` (host/port/`basePath` from the
advertised URL). Use `path_separated_prefix` + `prefix_rewrite` to `basePath`
(typically `/x-nmos/ncp/{version}`), same as Connection.

Cluster naming, e.g.:

```text
nmos_bridge_device_{safe_device_id}_ncp_{safe_version}
```

Do not merge Connection and NCP clusters. Candidate priorities: same
private-IP / private-DNS / other ordering as Connection. One Bridge API
setting covers `…/connection/…` and `…/ncp/…`.

### Adapter changes

- Parse `urn:x-nmos:control:ncp/(v\d+\.\d+)`.
- Allow `ws:` upstreams (today Connection allows `http:` only); port defaults
  when omitted must follow `ws` / `wss`, not assume HTTP.
- Require `basePath` consistent with `/x-nmos/ncp/{version}` (parallel to
  Connection's path check).
- Emit upgrade routes, rewrite to `basePath`, long-lived timeouts.
- **Health checks:** Connection's `http_health_check` on `basePath/` does not
  fit a WS-only NCP port (`control_protocol_ws_port` is separate on nmos-cpp).
  Initial options: TCP health checks, or no active check. Prefer TCP or none;
  do not invent an HTTP probe on the NCP listener.
- No `Location` rewrite (not REST).
- Ignore non-`ws` until WSS is in scope (log like unsupported Connection
  schemes).

### Client changes (nmos-js / IS-12 launch)

- **Forced** Bridge: build launch `uri` from the bridge NCP URL on the
  configured Bridge API origin.
- **Auto:** possible via short connect timeout then bridge (IS-12 client
  already ~3s); UX-sensitive — Forced is the clear story for locked-down
  networks.
- **No Bridge:** Device `href` unchanged.

Example Forced launch:

```text
ws://controller.example.com:8080/x-nmos-bridge/v1.0/devices/{id}/ncp/v1.0
```

### Gotchas (vs Connection HTTP)

| Topic | Note |
| --- | --- |
| Scheme | `ws` / `wss`, not `http` / `https` |
| Ports | Envoy must reach Device **NCP** ports, not only Connection HTTP |
| Health | TCP or none; not HTTP on `basePath/` |
| Timeouts | Long-lived upgrade; not 15s route timeout |
| Auth | `authorization` on controls stays out of scope (same as Connection Phase 1) |
| Sub-path | Usually API root only; still bound rewrite to `basePath` (no open proxy) |

### Risks and open questions

- Validate IS-12 through the proxy (idle, message size, ping/pong) with real
  nodes and the in-tree IS-12 client.
- Multiple NCP versions on one Device — separate targets (as Connection).
- Events WS (IS-07) is a similar shape; out of scope, but keep the adapter
  control-type-generic enough not to hard-code Connection-only forever.
- Product naming — resolved as **NMOS Bridge** / `nmos-bridge/` (rename
  branch); no further rename required for NCP.

### Acceptance (Case B)

- With Device networks blocked from the browser, Forced Bridge IS-12 launch
  through Envoy completes a basic NCP session against a node only Envoy can
  reach.
- Unknown device id → no upgrade / 404 on the bridge path.
- Arbitrary WS URLs still impossible.
- Connection HTTP bridge behaviour unchanged.

---

## Contrast: Query WS vs NCP

| | Query subscription WS | Device NCP WS |
| --- | --- | --- |
| Resource source | Client-created subscription `id` | Device `controls` via Query grains |
| Public URL | `/x-nmos-bridge/v1.0/query/{ver}/subscriptions/{id}` | `/x-nmos-bridge/v1.0/devices/{id}/ncp/{ver}` |
| Envoy upstream | Static Registry WS cluster + path template (`ws_href` shape) | Per-Device cluster from control `href` |
| Why static vs dynamic | Cannot grain-subscribe to `/subscriptions` (nmos-cpp); polling is bad | Devices already streamed to the adapter |
| Client remap | `id` + Query version; ignore `ws_href` | Device id + NCP version; ignore raw `href` when Forced |

---

## Suggested sequencing

| Step | Work | Depends on |
| --- | --- | --- |
| 1 | Spike: Envoy WS upgrade + idle timeouts (manual cluster to nmos-cpp Query WS) | — |
| 2 | Case A: `registry_query_ws`, bridge route + static path rewrite, nmos-js remap helper, README | Step 1 |
| 3 | Spike: Envoy WS to a Device NCP `href` with path rewrite | Step 1 |
| 4 | Case B: adapter NCP targets + nmos-js Forced (then optional Auto) launch URI | Step 3 |
| 5 | Easy-NMOS / compose docs: browser need not reach `query_ws_port` or Device NCP ports | 2, 4 |

Case A and Case B are independently shippable after the shared Envoy spike.

## References

- `nmos-bridge/README.md` — current HTTP bridge and "Query WS not proxied"
- IS-04 Query subscriptions / `ws_href`; nmos-cpp `query_ws_port` and
  non-queryable `subscription` / `grain` types
- IS-12 / `urn:x-nmos:control:ncp`
- Discussion: client remap vs response rewrite; id-based bridge path; static
  Query WS rewrite vs per-subscription routing; NCP as Connection-with-`ws`

## Investigation notes (2026-08-18)

Spike against local nmos-cpp registry (`query_ws_port` 3213) and virtnode
(`control_protocol_ws_port` 11002 when `http_port` is 11000), Envoy 1.31,
`timeout: 0s` + `idle_timeout: 3600s` + `upgrade_configs: [{ upgrade_type: websocket }]`.

### Shared Envoy spike (Steps 1 and 3) — resolved workable

| Check | Result |
| --- | --- |
| Query WS upgrade via Envoy | Works. Sync grain received (same length as direct). |
| Path rewrite Case A | `prefix` `/x-nmos-bridge/v1.0/query/` → `prefix_rewrite: /x-nmos/query/` produces `/x-nmos/query/{ver}/subscriptions/{id}` and matches nmos-cpp `ws_href` path. |
| NCP WS upgrade + `path_separated_prefix` + rewrite to `/x-nmos/ncp/v1.0` | Works. Socket opens; stays up without unsolicited messages (client-driven protocol). |
| NCP request/response through proxy | Works. Identical IS-12 `Command` / `CommandResponse` body vs direct (exercised GetMemberDescriptors; both returned the same 417 missing `recurse` — proves relay, not auth/path mangling). |
| HTTP health on NCP `basePath/` | Returns **426**; confirms plan: do not use `http_health_check` on NCP clusters. Prefer TCP check or none. |
| Default 15s route timeout | Must not apply; spike used `timeout: 0s`. |

### Case A open questions

| Item | Status |
| --- | --- |
| Other Registries with non-nmos-cpp `ws_href` paths | **Still open / document-only.** Fixture and nmos-cpp confirm `/x-nmos/query/{ver}/subscriptions/{id}`. Static rewrite is correct for that shape; no second Registry tested. Keep escape hatch; do not block Case A. |
| Secure / WSS upstream | **Deferred** (unchanged). |
| Query HTTP vs Query WS paths | **Confirmed.** Keep HTTP on `/x-nmos/query`; put remapped WS under `/x-nmos-bridge/v1.0/query/…` so upgrade and timeouts do not fight HTTP routes. |

### Case B open questions

| Item | Status |
| --- | --- |
| IS-12 through proxy (idle / messages) | **Spike OK** for open + one command round-trip. Full is12-client UI session and long idle still to validate in implementation. Ping/pong: not required for the short spike; Envoy idle_timeout covers silence. |
| Multiple NCP versions | **Unchanged design:** separate targets (already how Connection/Channel Mapping work). |
| Events WS (IS-07) | Out of scope; adapter should stay control-type generic (`CONTROL_TYPES` + scheme allow-list). |
| Product naming | **Done** on `feature/nmos-bridge-rename` (`nmos-bridge/`, NMOS Bridge settings). |

### Adapter gaps confirmed before Case B

- `ALLOWED_PROTOCOLS` is `http:` only — must allow `ws:` for NCP.
- Default port when omitted uses HTTP rules (`https` → 443 else 80); fine for `ws`/`wss` defaults (80/443) but nmos-cpp always advertises an explicit port.
- Per-target `http_health_check` on `basePath/` must be skipped (or replaced with TCP) for `ws` targets.

### Suggested next implementation slice

Done: Query subscription WebSockets (`registry_query_ws` + bridge path rewrite;
nmos-js does not consume Query grains today). Done: NCP in `CONTROL_TYPES`,
`ws` scheme, TCP health check, Forced Bridge IS-12 launch URI. Optional later:
Auto Bridge NCP fallback; Query grain client remap if the SPA starts using
subscriptions over WebSocket.

