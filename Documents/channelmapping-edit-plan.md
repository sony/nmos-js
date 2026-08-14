# Design plan: Editable IS-08 Channel Mapping in nmos-js

Status: proposal (not implemented). Builds on the existing read-only Device
**Active Map** view (`ChannelMappingMatrix` with `isShow={true}`) and the NMOS
Bridge support for Channel Mapping. Reads and activation requests use the
resolved `$channelmappingAPI`, so No Bridge, Auto Bridge and Forced Bridge
apply consistently.

## Motivation

nmos-js currently advertises IS-08 as read-only. The matrix UI is largely built
for interaction (`MappingButton`, `handleMap`, `mappingDisabled={isShow}`), but
`DevicesShow` never enables edit mode or posts activations. Operators still
need an external client to change maps.

## Decisions (agreed)

| Topic | Choice |
| --- | --- |
| IA | Normal react-admin **Show** + **Edit** (not IS-05-style API "Staged" tabs) |
| Naming | **Edit** — browser-side draft only; IS-08 has no client `/staged` resource |
| Activation modes | Immediate **and** scheduled (relative/absolute), matching Connection Edit |
| Persist draft | **No** — nothing to save until Activate (`POST /map/activations/`) |
| POST `action` body | **Diffs only** (changed output channels), which matches IS-08 map-entry merge semantics |
| Caps / routability | Soft warnings (like Connect tab receiver caps); still allow the request for node testing |
| Pending activations | Separate **Activations** show tab (list + cancel) |
| Navigate-away warning | **No** — Connection Edit does not use unsaved-navigation prompts either |
| Bridge | Use the existing bridge-aware `$channelmappingAPI` for reads and activation requests |

## API reminder (IS-08)

Relevant Device Channel Mapping endpoints (under the control `href` base):

- `GET …/map/active` — current map (Show)
- `GET …/map/activations` — pending / recent activations (Activations tab)
- `POST …/map/activations/` — body `{ activation, action }`; `action` is a
  partial map (output id → channel index → `{ input, channel_index }`; `null`s
  in both entry fields unroute)
- `DELETE …/map/activations/{id}` — cancel a pending activation

Node-side "staging" happens inside the activation machinery after POST; the UI
Edit view is only a local draft until Activate.

## UI shape

### Show — Active Map (existing, keep read-only)

- Tab **Active Map** (current `active_map`): `ChannelMappingMatrix` with
  `isShow={true}`, data from `$active.map` / `$io`.
- Actions: link/button to **Edit** (react-admin Edit route), JSON link as
  today where useful.

### Edit — map draft + activate

- Route: the normal react-admin Device Edit route, implemented by a dedicated
  Channel Mapping Edit component. Enter it from the Active Map tab; the Device
  resource has no other Edit view today.
- Seed local draft from current `$active.map` on load / refresh.
- Matrix with `isShow={false}` and `handleMap` updating the draft (including
  unroute).
- Activation controls aligned with Connection Edit (`ReceiversEdit` /
  `SendersEdit`):
  - mode: `activate_immediate` | `activate_scheduled_relative` |
    `activate_scheduled_absolute` (plus clear/empty)
  - `requested_time` when scheduled
- Primary action: **Activate** (or Save in react-admin terms that maps to
  Activate) → build diff `action` → `POST …/map/activations/` → on success
  refresh active map / activations and navigate to Show Active Map (or
  Activations if scheduled and still pending).
- No "save draft" control.
- Soft validation: visually flag cells / rows that violate
  `routable_inputs`, reordering, or `block_size` (and similar caps from `$io`),
  but do not block Activate; show API error body if the Node rejects.

### Show — Activations (new tab)

- List from `$activations` / `GET …/map/activations`.
- Show id, mode, times, summary of `action` if practical.
- **Cancel** → `DELETE …/map/activations/{id}` when the API allows.
- Optional: highlight activations that still affect locked outputs.

## dataProvider / client

- Extend Device load (or Edit load) as needed so Edit has `$io`, `$active`,
  `$channelmappingAPI`, and Activations tab has activations data (already
  partially fetched as `map/activations` today).
- Implement a dedicated activation helper that posts to the resolved
  `$channelmappingAPI`. Do not represent activation as a fake react-admin
  `UPDATE` of the Device resource.
- Diff algorithm: compare draft map to the active map snapshot taken at Edit
  load (or last successful activate); emit only changed
  `output_id → channel_index → { input, channel_index }` entries; omit
  unchanged outputs entirely.
- Auth: reuse existing bearer headers when auth is on (`channelmapping` scope
  already listed).

## Soft validation (Connect-tab analogy)

On the Connect tab, receiver caps filter / warn without always forbidding
connect. Same idea here:

- When a mapping would break caps, style the control (warning colour / icon /
  tooltip stating which rule).
- Activate remains enabled.
- Useful for testing strict vs buggy Nodes.

Exact visual language: match existing warning patterns in Connect / forms
where possible; avoid inventing a second design system.

## Non-goals

- Changing IS-08 or Node behaviour.
- Scheduled-activation calendar UX beyond the same mode + `requested_time`
  fields Connection Edit already uses.
- Navigate-away dirty prompts.
- Persisting drafts in `localStorage` (optional later; not required).

## Sequencing

| Step | Work |
| --- | --- |
| 1 | Wire Edit route + matrix `handleMap` draft state; no POST yet |
| 2 | Diff builder + `POST /map/activations/` + immediate mode end-to-end |
| 3 | Scheduled modes + `requested_time` (mirror Connection Edit) |
| 4 | Soft cap warnings on the matrix |
| 5 | Activations show tab + DELETE cancel |
| 6 | README: drop "read-only for now" for IS-08 |

## Acceptance

- From a Device with `cm-ctrl`, user can open Edit, change mappings, Activate
  immediate, and see Active Map update.
- Scheduled activation appears under Activations and can be cancelled when
  still pending.
- POST body `action` contains only changed channels.
- Invalid-per-caps mappings show a warning but can still be activated (Node
  may still 4xx).
- Active Map show remains read-only; no draft saved without Activate.
- No Bridge, Auto Bridge and Forced Bridge use the same resolved
  `$channelmappingAPI` as the existing read-only view.

## References

- Existing `ChannelMappingMatrix`, `DevicesShow` Active Map tab
- Connection Edit activation mode UI (`ReceiversEdit` / `SendersEdit`)
- IS-08 `POST /map/activations/` / map-entries schema (partial `action`)
- README today: "IS-08 … (read-only for now)"
