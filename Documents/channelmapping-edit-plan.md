# Design plan: Editable IS-08 Channel Mapping in nmos-js

Status: immediate activation (steps 1 and 2) implemented. Soft validation
(step 4) is in progress. Builds on the existing read-only Device **Active Map**
view (`ChannelMappingMatrix` with `isShow={true}`) and the NMOS Bridge support
for Channel Mapping. Reads and activation requests use the resolved
`$channelmappingAPI`, so No Bridge, Auto Bridge and Forced Bridge apply
consistently.

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
  Channel Mapping Edit component. Enter it from the Active Map tab (Edit
  button is shown only on that tab); the Device resource has no other Edit
  view today. The Edit view keeps the Summary / Active Map tabs and highlights
  Active Map, matching Receiver/Sender Staged edit. Activate sits in a bar at
  the top of the tab content, above the filter panels, so it is not a long
  scroll away when the matrix is tall.
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
  refresh the Device record and return to Show Active Map. A later Edit visit
  remounts and seeds from the refreshed `$active.map`, so the next Activate
  only includes changes since that POST.
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
- Activation goes through the dataProvider as `UPDATE` of the `devices`
  resource, posting to the resolved `$channelmappingAPI`, in the same way
  `UPDATE` of `receivers` / `senders` PATCHes the resolved `$connectionAPI`.
  That keeps URL, headers, auth and error-body handling in one place.
- Diff algorithm (in the dataProvider, beside the `$staged` deep-diff):
  compare the requested map in `data.$active.map` to the map the Device
  reported in `previousData.$active.map`; emit only changed
  `output_id → channel_index → { input, channel_index }` entries; omit
  unchanged outputs entirely. The Edit view holds the draft and enables
  Activate only while it differs from the map it was seeded with.
- Auth: reuse existing bearer headers when auth is on (`channelmapping` scope
  already listed).

## Soft validation (Connect-tab analogy)

On the Connect tab, receiver caps filter / warn without always forbidding
connect. Same idea here:

- All mapping controls remain usable and Activate remains enabled. The Node is
  the authority; the UI warning is a prediction which can deliberately be
  submitted when testing a Node.
- For `routable_inputs`, an unselected mapping which the Output does not list
  uses a faded warning-colour hollow icon. If selected, it uses a full
  warning-colour checked icon. Both tooltips state the expected constraint
  violation. The same applies to Unrouted when the constraint omits `null`.
- `routable_inputs: null` means unconstrained. Missing or malformed caps are
  left to the Node rather than guessed at.
- Block size and reordering require validation of the complete draft. Warn on
  selected cells participating in a broken block; do not pre-colour all cells
  which might form an incomplete block.
- The read-only Active Map does not show predicted warnings.
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
| 4 | Soft cap warnings on the matrix (`routable_inputs` first, then block size / reordering) |
| 5 | Activations show tab + DELETE cancel |

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
