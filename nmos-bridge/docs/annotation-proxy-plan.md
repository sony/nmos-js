# Design plan: Envoy proxying for IS-13 Annotation API

Status: implemented. Extends the NMOS Bridge in `nmos-bridge/README.md`.
Connection, Channel Mapping, and NCP remain Device `controls`. Annotation is a
Node **service**, so this is a new public namespace, not another
`CONTROL_TYPES` row.

Depends on nmos-js Show-page Annotation editing (`feature/is13-annotations`);
rebase onto `master` when that merges. The BCP-003-02 `annotation` OAuth scope
is part of that change, not the bridge.

## Motivation

IS-13 is advertised on the Node as `urn:x-nmos:service:annotation/{version}`
with an HTTP `href` (nmos-cpp: `http://host:port/x-nmos/annotation/{version}`).
nmos-js discovers that href from Query (`resource` -> Device -> Node
`services`) and PATCHes it directly. In deployments where the browser cannot
reach Node networks, IS-05 / IS-08 / IS-12 work via `/x-nmos-bridge/...`
while Annotation still fails.

Annotation is the same reachability class as Connection (HTTP, Registry as
source of truth, no open URL proxy), but the Registry object is a **Node**,
not a Device. One href serves the Node and every Device, Source, Flow, Sender,
and Receiver on that Node. Hanging it off `/devices/{device_id}/...` would
invent a per-Device API and duplicate clusters.

Query HTTP on `/x-nmos/query/` does not help: that is the Registry. Annotation
writes have to hit the Node.

## Decision: Node collection + Query WebSocket for `/nodes`

Same mapping idea as Connection: downstream path identifies Registry id + API
version; Envoy `prefix_rewrite`s to the advertised `href` `basePath`. New
collection `nodes/` beside `devices/` and `query/`.

|               | Connection (today)                                     | Annotation                                            |
| ------------- | ------------------------------------------------------ | ----------------------------------------------------- |
| Advertisement | Device `controls` `urn:x-nmos:control:sr-ctrl/{ver}`   | Node `services` `urn:x-nmos:service:annotation/{ver}` |
| Upstream      | control `href`                                         | service `href`                                        |
| Public path   | `/x-nmos-bridge/v1.0/devices/{id}/connection/{ver}/…`  | `/x-nmos-bridge/v1.0/nodes/{id}/annotation/{ver}/…`   |
| Transport     | HTTP                                                   | HTTP                                                  |
| Discovery     | Device Query subscription (`resource_path` `/devices`) | Second Query subscription (`resource_path` `/nodes`)  |
| Client remap  | Forced / Auto Bridge                                   | Same modes; Node id, not Device id                    |

Example:

```text
PATCH /x-nmos-bridge/v1.0/nodes/{node_id}/annotation/v1.0/node/senders/{sender_id}
```

proxies to:

```text
PATCH /x-nmos/annotation/v1.0/node/senders/{sender_id}
```

Cluster naming, e.g.:

```text
nmos_bridge_node_{safe_node_id}_{api}_{safe_version}
```

Do not merge Annotation with Connection clusters, and do not key Annotation
by Device id. Candidate priorities: same private-IP / private-DNS / other
ordering. Keep one Bridge API prefix.

`GET /x-nmos-bridge/v1.0` listings become `["nodes/","devices/","query/"]`.
Nodes are not enumerated at `…/nodes/`; the Registry remains the source of
truth. Given a Node ID, `GET …/nodes/{node_id}` lists proxied APIs (e.g.
`["annotation/"]`).

## Adapter changes

- Second non-persistent Query WebSocket subscription, `resource_path: /nodes`,
  same `REGISTRY_QUERY_URL` / `REGISTRY_QUERY_WS_URL` origin as Devices (the
  existing static Query WS rewrite is unchanged). Independent reconnect;
  a Devices sync must not clear the Node map and vice versa.
- Parse `urn:x-nmos:service:annotation/(v\d+\.\d+)`.
- Allow `http:` upstreams; skip non-http until HTTPS is in scope.
- Require `basePath` consistent with `/x-nmos/annotation/{version}`.
- Emit HTTP routes like Connection: `path_separated_prefix`, `prefix_rewrite`
  to `basePath`, GET/HEAD retry, no automatic retry on mutating methods,
  `Location` rewrite using this target's `basePath` (existing Lua).
- **Health checks:** HTTP on `basePath/` (same as Connection, not NCP TCP).
- Log and skip malformed / inconsistent hrefs.
- Generalize Device listing routes to "collection + resource id" so Nodes get
  the same `…/{id}` and `…/{id}/{api}` listings without duplicating Envoy
  JSON by hand.

Do not collapse this into one subscription with an empty `resource_path`.
That "all types" behaviour is an nmos-cpp-registry extension, not standard
IS-04 Query API WebSocket; even there, grains would be large and mixed.

## Method allow-list

IS-13 uses **GET** and **PATCH** (plus **OPTIONS** for CORS). Today's bridge
allow-list already includes PATCH. No new methods.

Access logging: PATCH on Annotation routes is already in the mutating set.

## Client changes (nmos-js)

`annotationResourceUrl` concatenates the Node service `href` (No Bridge) or
the Node collection bridge path (Forced / Auto) with `/node/self` or
`/node/{type}/{id}` (no trailing slash).

- **Forced:** `{bridge}/nodes/{nodeId}/annotation/{version}` + the same
  sub-path (`nodeBridgeUrl`, Node collection).
- **Auto:** try the advertised href (same 5s timeout as Connection) then fall
  back to the bridge URL; cache the successful path per Node.
- **No Bridge:** advertised href.

Auth: the `annotation` scope is requested with the other NMOS scopes when
BCP-003-02 is on; that lives with the IS-13 Show-page change.

## Deployment notes

- Envoy must reach Node **Annotation** ports (`annotation_port` on nmos-cpp
  may share `node_port` or differ).
- Adapter now needs Query grains for Nodes as well as Devices.
- README: Node services under the public Bridge API; listings include
  `nodes/`.

## Non-goals

- Treating Annotation as a Device control.
- Proxying other Node services (or Node API itself) until there is a
  browser need.
- HTTPS upstreams, auth translation, mTLS.
- Open proxying of arbitrary Annotation URLs.
- Changing IS-13 / IS-04 or requiring Node/Registry changes.
- Rewriting Query JSON `services[].href` (bridge-aware client remap only).

## Sequencing

| Step | Work                                                                                      | Status        |
| ---- | ----------------------------------------------------------------------------------------- | ------------- |
| 1    | Design note (this file)                                                                   | done          |
| 2    | Adapter: `/nodes` subscription; collect `annotation` services; routes, clusters, listings | done          |
| 3    | Confirm `Location` rewrite with Annotation `basePath` (reuse tests / add a case)          | done          |
| 4    | nmos-js: Forced then Auto remap in `annotationResourceUrl`                                | done          |
| 5    | README: public path, listings, Node reachability                                          | done          |

`annotation` OAuth scope was listed here as step 4 in the proposal; it shipped
on the IS-13 Show-page branch instead.

## Acceptance

- With Node networks blocked from the browser, Forced Bridge can GET/PATCH
  Annotation resources through Envoy against a Node only Envoy can reach.
- Unknown node id -> 404 on the bridge path; non-allow-listed methods -> 405.
- Device Connection / Channel Mapping / NCP behaviour unchanged.
- No open proxy: only registered `urn:x-nmos:service:annotation/…` hrefs
  become targets; one cluster per Node + version.

## References

- `nmos-bridge/README.md` — Device control mapping and Query WS
- `nmos-bridge/docs/channelmapping-proxy-plan.md` — HTTP Device control
- `nmos-bridge/docs/websocket-proxy-plan.md` — Query `/query/…` WS vs per-id
  Device routing
- IS-13 Annotation / `urn:x-nmos:service:annotation`
- nmos-js `annotationResourceUrl` (Node collection remap in Forced / Auto)
