# Design plan: Connections matrix in nmos-js

Status: in progress. Steps 0–6 are done. Polish (step 7) is not
started.

## Decisions (agreed)

| Topic | Choice |
| --- | --- |
| Cap | Each axis is one Query `GET_LIST` with `paging.limit` equal to the global **Paging Limit** (Settings: 5 / 10 / 20 / 50 / 100). Do not follow `next`. Banner if truncated. No second cap on the Connections settings panel. |
| Collapse | Devices default collapsed. Ellipsis cells are not clickable (no Activate, no Unlink, no heading match). Expand both sides to a real sender × receiver cell. |
| List paging | No next/prev on this page. Filter + cap is the window. |
| Unlink | Checked expanded cell PATCHes that receiver `master_enable: false`, immediate. Do not also clear `sender_id`. No extra confirm. Stay on the matrix. |
| Heading match | Filter icon on expanded port headings only. Writes essence filters on the **opposite** axis only (not label / description / id / tags). Sender match waits for Flow. Replace same-kind essence chips on that panel (`format`, `transport`, Flow media type / event type, receiver caps); keep any other chips (label, description, id, tags, device). |
| First visit | No default format (or other) chips. Empty FilterPanels; persist last-used JSON after the operator has set some. Try it in use. |
| Click policy | Incompatible expanded cells stay clickable. Same distinction as IS-08: warning colour on the control and an infotip naming the first failing rank. Unlink stays available on a checked cell even if the pair would now rank incompatible. |
| Nav icon | Material `GridOn` first. Custom SVG in `Development/src/icons` only if that looks wrong next to Sender / Receiver. |

## Motivation

nmos-js already has several connection-related surfaces:

- Resource lists (Senders, Receivers, Devices) with Query API cursor paging.
- Receiver **Connect** tab: a pre-filtered list of likely-compatible Senders
  plus Activate / Stage (`makeConnection`).
- Sender and Receiver **Staged** tabs: edit transport params and
  `master_enable` by hand, then Activate, to make a connection without the
  Connect-tab helper.

None of these is a facility-style matrix. The IS-08 Channel Mapping matrix on
Device Show/Edit is the closest layout (table, dual FilterPanels, collapse,
cell buttons, constraint warnings). Connections adds ranked IS-05
compatibility on cells so unlikely partners stay visible and explained.

## Layout, Connect tab, and ranking

### From IS-08 `ChannelMappingMatrix`

- HTML table. Default: senders as rows, receivers as columns, the corner
  labelling each axis against its own headings, `SENDERS` along the bottom
  and `RECEIVERS` rotated up the right (same reading as IS-08 `INPUTS` and
  `OUTPUTS`, with no separator between them). Some
  operators prefer destinations down the side; **swap axes** in the
  Connections settings panel flips rows/columns and the corner labels,
  persisted with the other Connections settings. FilterPanels stay Sender
  vs Receiver (not "row vs column"). Heading match still writes the opposite
  **collection**.
- Give IS-08 the same control: a **swap axes** setting on the Channel
  Mapping settings panel (alongside auto-sort and parent/source heading
  visibility), default
  inputs as rows / outputs as columns, corner labels swapping with them.
  Input vs output FilterPanels and collapse state stay keyed by
  I/O, not by visual row/column. Each matrix keeps swap on **that page's**
  settings FilterPanel (IS-08: Channel Mapping settings; Connections: the
  third panel next to Sender/Receiver filters), not on the global Settings
  page. Separate `useJSONSetting` keys follow from that — flipping one
  table does not flip the other. Doing IS-08 first is a small proving
  ground for the table transpose.
- Two FilterPanels (Sender vs Receiver, independent of swap) plus a settings panel
  (auto-sort, swap axes). Persist with `useJSONSetting`. Sender and
  receiver filters stay independent (separate state and Query calls), same
  as IS-08 inputs vs outputs.
- Collapse/expand of grouped headers; collapsed axis uses ellipsis cells
  (`HorizontalEllipsisButton` / `VerticalEllipsisButton` /
  `DiagonalEllipsisButton`) rather than omitting the group.
- `MappingButton` (hollow vs checked) for idle connected / not connected.
- Tooltips on headers (chips linking to the resource Show page) and on cells
  (who would connect to whom, and why a cell is a bad bet).
- Soft warnings: allow the request, colour the control, tooltip the predicted
  failure. nmos-js is also a Node-testing client; Connect-tab / IS-08 already
  do not hard-block.

The IS-08 table now has an overflow viewport and sticky headings, which
Connections will copy. Once a few inputs and outputs are expanded you
would otherwise lose the names while scrolling.

Implementing that does **not** mean leaving the HTML table. The conceptual
model stays one `<Table>`. Sticky is CSS (`position: sticky` on heading
cells, opaque `mappingHeadStyle` background, a corner `z-index`). The
fiddly parts are already in this markup, not a new widget:

- Material-UI `Table` uses `border-collapse: collapse`, which stops sticky
  in Chromium; the overflow wrapper must force `border-collapse: separate`
  and `border-spacing: 0`.
- Three header rows (source, output, channel) plus a `rowSpan={3}` /
  `colSpan={3}` corner cell, reduced to two when source/parent headings are
  hidden: sticky **top** uses the whole `thead` as one sticky block.
- Three left columns (parent, input, channel), reduced to two when
  source/parent headings are hidden, with `rowSpan` on the input name when
  expanded. Sticky **left** uses explicit offsets, and row-spanned cells are
  the browser-buggy case.
- Fixed heading extents make those offsets constants.
- Axis swap just swaps which cells get `top` vs `left`.

So: overflow wrapper is cheap and v1. Sticky thead (keep output names while
scrolling down) is a short CSS pass and a good IS-08 proving ground. Sticky
left columns (keep input names while scrolling sideways) is the same idea
but more testing around `rowSpan`. Do not rebuild as a div grid to get
freeze panes.

Sticky is not required for a Connections first cut if collapse + filters
keep the rendered size down, but it should land on IS-08 in the same
transpose/scroll pass as swap axes rather than only on the new page.

### Fixed-size columns (IS-08 and Connections)

IS-08 columns used to follow auto table layout: width was the widest heading
in that column (output name, channel label, source chip), so a long "Left
AES" next to a short "1" made a striped grid. The MappingButton cells are
now all the same size. The former **Label length** setting only capped
character count; it still left `WWW` vs `iii` uneven.

Improve this on IS-08 in the same transpose/scroll pass (Connections
inherits it):

- Shared width on **leaf** columns (one channel, or one collapsed output /
  one expanded sender or receiver). Do not try to make a collapsed output
  as wide as that output expanded to 16 channels.
- `table-layout: fixed` plus a min/max on those cells that fits the
  mapping control (and the collapse button when the heading is the leaf).
- CSS `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on
  heading text. Full name already lives in the tooltip; stop relying on
  character-count truncate to make columns match.
- Remove **Label length** now that CSS ellipsis and fixed extents govern the
  available space. Do not size every column to the longest name in the table.
- Row-heading columns (parent / input name, or Device / sender) can use a
  max-width + ellipsis so sticky `left` offsets are stable. They do not
  need to be as narrow as a mapping cell.

This is still CSS on the existing table, not a new widget.

## IS-08 preliminary work (extract first)

None of this needs the Connections page, Query caps, or IS-05. It lands in
`ChannelMappingMatrix.js` (and its tests), plus a small FilterPanel hook if
clear-this-axis is shared. Settings stay on the Channel Mapping settings
panel (`Channel Mapping Settings`), not global Settings.

| Slice | What | Why it is independent |
| --- | --- | --- |
| Overflow | Wrapper with `overflow: auto` around the existing `<Table>` | The table already grows off-screen; Connections will copy the wrapper |
| Fixed-size leaf columns | `table-layout: fixed`, shared width on channel / collapsed-I/O columns, CSS ellipsis on heading text; full name stays in the tooltip | Same CSS Connections needs; also stabilises sticky offsets |
| Swap axes | Boolean on the Channel Mapping settings panel; default inputs as rows, outputs as columns, with the corner labels following. FilterPanels, collapse, and custom-name keys stay input vs output | Proves the transpose before Connections |
| Parent/source headings | Default-on Boolean on the Channel Mapping settings panel; hiding it removes the outer association band from both axes and reduces the corner from three sections each way to two | Gives small screens 120px more space in each direction |
| Sticky `thead` | Freeze the three output header rows while scrolling down | CSS on this markup; then sticky left columns if `rowSpan` behaves |
| Sticky left columns | Freeze parent / input / channel headings while scrolling sideways | Same pass; more testing |
| Clear this axis | MenuItem on the input FilterPanel and on the output FilterPanel (not a global clear). Optional: teach FilterPanel itself so Connections reuses it | IS-08 today only clears one chip or custom names |

Order: overflow → fixed-size columns → swap → sticky thead → sticky left.
Fixed-size columns before sticky so `left`/`top` offsets are not
content-sized.
Clear-this-axis can land anytime.

Mapping icons (`MappingButton` and collapsed-axis ellipses) use Material-UI
`action.active`, `action.disabled` and `divider` as three steps: checked,
unchecked, and Show-unchecked / collapsed. Show disables every cell, so each
state drops one step. Constraint warnings use the same alphas on the warning
colour.

Do **not** pull into this extract: IS-05 ranking, heading match, Query
paging, a new nav page, or rewriting the table as a div grid.

### Compatibility ranking (new)

Walk order, lowest first (higher is a better bet IS-05 will succeed):

1. `IncompatibleDirection`
2. `IncompatibleTransport`
3. `IncompatibleFormat`
4. `IncompatibleMediaType`
5. `IncompatibleConstraintSets` (reserved; not evaluated yet)
6. `Compatible`
7. `CompatibleConstraintSets` (reserved)

On a sender x receiver matrix there is **no same-direction pair**, so
`IncompatibleDirection` never appears. Idle warning colour (and later
constraint sets) covers transport / format / media type. Click is still
allowed on those cells (soft warning), matching IS-08 `routable_inputs`.

Keep this helper in nmos-js beside the Connections page; Connect-tab Query
filters stay a separate, stricter hide of unlikely senders.

### From Receiver Connect tab

- Query-side filters already encode transport URN matching (RQL
  subclassification vs base), `$flow.format`, `$flow.media_type`,
  `$flow.event_type`, and optional `$constraint_sets`.
- `makeConnection` copies sender active transport params onto the receiver
  and PATCHes IS-05. Matrix clicks should call that, not invent a second
  connect path.
- Connect tab **hides** incompatible senders. The matrix should **show** them
  and warn, otherwise it is just Connect tab in 2D.
- The Connect tab's `baseFilter` (built from the open receiver) is the
  mapping to reuse when a heading control asks to match a receiver. The
  inverse mapping (from a sender + its Flow onto receiver Query fields) is
  new but the same fields.

## Honest limits

### 1. Query API paging does not map onto a matrix

List views use IS-04 cursor paging (`paging.limit` 5–100, `paging.order=update`,
Link `next` / `prev`). That is a 1D window over a filtered collection.

A matrix is 2D. Independent next/prev on senders and on receivers would
make existing connections appear and disappear depending on which page each
axis happened to sit on. Paging devices instead still would not give a stable
sender x receiver product.

So: **do not reuse list-view PaginationButtons on this page.**

### 2. "All senders and receivers" is not a first-cut product

Two separate problems:

- **Fetch.** Registries are allowed to be large. `GET_MANY` already uses
  `paging.limit=1000` as a one-shot cap. Walking every `next` link for both
  collections is possible but slow, races with updates (`paging.order=update`),
  and still needs a cap. nmos-js lists do not live-subscribe today; this page
  should not be the first to invent Query WebSocket grains.
- **Render.** A fully expanded matrix is `O(senders x receivers)` cells, each
  an `IconButton`. IS-08 already feels heavy on a Device with many channels.
  50 x 50 is 2 500 buttons; 200 x 200 is 40 000. Browsers will not enjoy that
  even if the Query API would return the data.

Workable rule: **filter first, then load a hard-capped window per axis, then
collapse by Device.** If either axis is truncated, show a banner: the matrix
is showing the first N matching senders / receivers; narrow the filters
(format, transport, device, label). N is the global **Paging Limit** already
used by the resource lists, sent as Query `paging.limit` on each axis.
Do not follow `next`. Do not add a second cap on the Connections settings
panel. Changing Paging Limit on Settings therefore changes list pages and
this matrix together.

Default filters should make an unfiltered "whole registry" view the exception.
Heading match (below) is the fast way to spend the **other** axis cap on
partners for a port you can already see.

### 3. Device collapse is the IS-08 grouping, applied to ports

IS-08 already collapses channels under each input or output: default
expanded lists are empty, ellipsis cells are not clickable, and the point
is to hide a lot of rows/columns you are not looking at. Connections should
do the same with senders and receivers under each Device (`device_id`).
Default all Devices collapsed. Expand the ones you care about. Same muscle
memory, same ellipsis language.

Compatibility lives on the **leaf**, as mapping does: IS-08 caps
(`routable_inputs`, `block_size`, `reordering`) sit on the input/output and
show up on channel cells once expanded; sender/receiver format, transport,
and caps show up on port cells once expanded. Heading match stays on
expanded port headings for the same reason you do not map from a collapsed
IS-08 heading: the group has no single caps vector if the leaves differ.

What is only a bit different: one Device often mixes video, audio, and data
ports, whereas one IS-08 input's channels are usually one essence. A
collapsed Device x Device cell is therefore several possible IS-05
connections, not "this input vs this output with channels hidden." That is
why the cell stays ellipsis rather than a checkmark — which is also what
IS-08 does; it does not summarise whether any channel is mapped.

Collapsed-cell language (sender Device vs receiver Device; swap axes only
moves this on screen):

| Sender Device | Receiver Device | Cell |
| --- | --- | --- |
| expanded (one sender) | expanded (one receiver) | real connect / unlink control |
| collapsed | expanded | vertical ellipsis |
| expanded | collapsed | horizontal ellipsis |
| collapsed | collapsed | diagonal ellipsis |

Do **not** make collapsed cells clickable for connect or unlink. Expand
first. Same as IS-08 ellipsis buttons.

Devices with no loaded senders or no loaded receivers on their axis simply
do not appear. We are grouping the loaded port set, not listing every
Device in the registry. After an axis swap, the same groups move with their
collection (sender Devices stay with senders).

### 4. Compatibility needs Flow data we do not have on Sender list records

IS-04 Sender has `transport`, `flow_id`, `subscription`. Format and media
type live on the Flow. Receiver has `format`, `transport`, `caps.media_types`
(and `caps.constraint_sets`).

The Connect tab asks the Query API to filter senders via `$flow.*` (RQL
`rel(flow_id, …)` when RQL is on). For a matrix that *shows* mismatches, we
must either:

- attach Flow `format` / `media_type` onto each loaded sender (reference
  fetch, batched), or
- only rank transport until Flows are loaded, which would over-claim
  `Compatible`.

First cut should batch Flow lookups for the loaded sender window (not the
whole registry). Without RQL, Connect-tab constraint-set filtering is already
limited; matrix v1 can skip `constraint_sets` entirely (ranks reserved, not
evaluated). When they are evaluated, fold the result into the existing
Expected Constraint Violation infotip rather than a separate "not checked"
line.

Heading match from a sender needs that Flow too; disable the heading button
until the Flow batch has returned.

### 5. Connecting from a cell is more expensive than painting the cell

Idle state can use IS-04 only:

- Receiver `subscription.sender_id` + `subscription.active` (v1.2+) to mark
  the checked cell.
- No Connection API until the user clicks.

On click of an unused expanded cell: `GET_ONE` sender + `GET_ONE` receiver
(to resolve `$connectionAPI` and `$active.transport_params`) then
`makeConnection`. Multi-leg senders still need the existing leg picker from
`ConnectButtons`. Receivers without a Connection API: disable the cell,
tooltip why.

Do not prefetch IS-05 for the whole matrix.

Activate vs Stage: first cut **Activate (active)** only, matching the common
Connect-tab action. Stage can stay on Receiver Show.

Stay on the matrix after connect or unlink (refresh IS-04 rows). Do not
navigate to Receiver Show the way `ConnectButtons` currently does.

## Page and navigation

New left-nav page **Connections**, after Receivers (before Subscriptions).
Route `/connections`. Same word in the menu label, title, and settings keys
(`Connections Sender Filter`, …). Icon: Material `GridOn` to start; not a
reuse of Sender or Receiver.

The name is the operator action, not the IS-05 resource. Connection API Show
tabs on Sender/Receiver stay where they are.

Not a tab on Devices, Senders, or Receivers. Those pages remain lists. The
matrix is a third way to look at the same Query data. nmos-js stays a
registry browser + tables.

## Independent filters, clear, and heading match

Sender filters and receiver filters are **independent**. Two FilterPanels,
two `useJSONSetting` keys, two capped Query requests. Changing senders does
not rewrite receivers, and the reverse. That matches IS-08 (input filters vs
output filters) and is what the matrix needs: you may already have pinned
one Device's senders and only want to reshape who appears as columns.

Finding a particular sender or receiver is the same Query filters the list
pages already use, plus essence filters:

- **Label, description, id** — copy `StringFilter`s from SendersList /
  ReceiversList / Connect tab. With RQL these are case-insensitive
  `matches()` (substring). Basic query is exact key=value. Put them on
  Query `GET_LIST` so the axis cap is spent on that resource, not on
  client-side search of a random page.
- **Transport, format, Flow media type / event type, receiver caps** —
  as already planned (Connect-tab fields on the sender panel, format /
  transport / media types on the receiver panel).
- **Tags** — doable with RQL, same path as DevicesList:
  `(tags,urn:x-nmos:tag:…/v1.0)`. Senders and receivers carry their own
  tags (for example BCP-002-01 group hint). Offer those well-known keys
  plus a free-form tag path if needed. Basic query cannot express tag
  maps; hide tag chips unless RQL is on. Searching a **Device's** asset
  tags from the sender panel (`rel(device_id, …)`) is possible later; v1
  can filter `device_id` as a StringFilter (UUID) and show Device labels
  only after the Device batch for group headers.

Heading match still writes only essence fields on the opposite axis; it
does not copy label, description, id, or tags.

FilterPanel already removes **one chip** with the small Clear icon on that
chip. That is not enough after a heading match, which writes several essence
fields at once. Each Connections FilterPanel also needs **clear this axis**:
a control that drops every filter on that panel only (`setFilter({})` /
empty object) and collapses the chips. Put it on the panel — a `MenuItem`
in that panel's add-filter menu ("Clear sender filters" / "Clear receiver
filters"), same pattern as IS-08 "Clear Custom Names". Do not add a global
clear that wipes both axes in one click; independence means undo is per
axis. Auto-sort and swap axes stay on that page's settings
FilterPanel (same pattern as Channel Mapping settings) and are not cleared
by either axis. They do not belong on the global Settings page.

### Heading match (opposite axis)

The FilterPanels are enough for power users and not enough for "I am looking
at this sender; show me who can take it." Put a small `FilterList` icon
button on **expanded port headings only**. Not on collapsed Device headings:
mixed ports, no single caps vector.

One click writes essence filters on the **opposite** axis only, then that
axis's capped Query reloads. The clicked axis is left as it is. Do not copy
label, description, or id onto the other axis.

On the opposite panel, **replace** chips of the same kind as the match
writes (`format`, `transport`, `$flow.format` / `$flow.media_type` /
`$flow.event_type`, receiver `caps` / media types). Do not intersect two
format filters or two transport filters — the heading is a single caps
vector, so the new values overwrite. **Keep** chips that heading match
never writes (label, description, id, tags, `device_id`). That
intersection may be empty. Clear this axis is undo.

From a **sender** heading (needs Flow; disable the button until Flow is
loaded) → **receiver** panel:

- `format` from Flow, `transport` using the Connect-tab URN rule so this
  sender remains acceptable, and media-type from Flow `media_type` where
  Query can express it (RQL on `caps.media_types`; basic query may only get
  format + transport).

From a **receiver** heading → **sender** panel:

- The Connect tab `baseFilter`: `transport` with the RQL `|base$`
  alternative, `$flow.format`, `$flow.media_type` from `caps.media_types`,
  `$flow.event_type` from `caps.event_types` when present. Skip
  `$constraint_sets` in v1.

The opposite FilterPanel must show the written chips so they can be edited
or cleared chip-by-chip or with clear-this-axis. Tooltip: "Filter receivers
to this sender's transport and format." / "Filter senders to this receiver's
transport, format, and caps."

Same-axis fill (other senders like this one) is a second, less important
action and not v1. The operator already has that axis on screen; the missing
move is the Connect-tab job.

If the opposite axis is still truncated after match, the banner still
applies.

RQL off: write the basic-query subset (format, transport) and tooltip that
media-type / URN-subclassification matching needs RQL, same honesty as
Connect tab.

## Disconnect (Unlink)

Unchecking a checked expanded cell is Unlink: PATCH that **receiver**
`master_enable: false` with `activation.mode = activate_immediate`. Same
IS-05 write as `ActiveField` turning a receiver off.

Do not clear `sender_id` in a separate step; disabling the receiver is
enough. Do not fire Unlink on collapsed cells. No extra confirm dialog
beyond what Activate already lacks. The cell infotip names the pair (and a
rank or that the Connection API is not available); it does not say Unlink.
The checked icon is the affordance.

## UI sketch

```
[ Sender filters ]          [ Receiver filters ]        [ Settings ]
  chips… Clear axis           chips… Clear axis           auto sort
  Add sender filter           Add receiver filter         swap axes
  (label, description, id,    (label, description, id,
   tags, format, transport,    tags, format, transport,
   $flow.*, device_id, active) caps / media types)
```

banner if truncated: Showing 100 of many senders matching filters.

+------------------+------------ Device A (collapsed) --+-- Device B [v] ---------+
| SENDERS RECEIVERS|  (ellipsis column)                 | Rx 1 [filter] | Rx 2    |
| Device X [>]     |  diagonal ellipsis                 | vert ellipsis | vert ellipsis |
| Device Y [v]     |                                    |               |         |
|   Sender 1 [f]   |  horiz ellipsis                    |  ○ warn       |  ●      |
|   Sender 2 [f]   |  horiz ellipsis                    |  ○            |  ○ warn |
```

`[f]` is the heading match button.

Idle:

- Connected cell: checked `MappingButton` (full opacity); click Unlinks.
- Compatible unused: hollow, faded (today's unchecked mapping style); click
  Activates.
- Incompatible unused: hollow in the mapping warning colour, infotip naming
  the first failing rank (`IncompatibleTransport`, …); still clickable.

Hover / focus a sender row header or receiver column header does not
change cell appearance: the warning colour and infotip already mark a bad
pair. Click remains allowed on those cells, matching IS-08
`routable_inputs`. Unlink stays available on the checked cell even if the
pair would now rank as incompatible (caps changed under us).

`hide incompatible` in settings: skip in v1. Opposite-axis heading match
plus each panel's own format filters are the way to spend the cap.

Sticky headings already landed on IS-08 in step 1; Connections copies that
CSS in step 3. Horizontal + vertical scroll around the table is v1.

## Data loading (v1)

1. `GET_LIST` senders with sender FilterPanel mapped to Query filters,
   `paging.limit` = global Paging Limit, **no** `paginationURL` follow.
2. Same for receivers.
3. If either response indicates a full page (Link `next` present, or
   `X-Paging-Limit` filled), set truncated.
4. Unique `flow_id`s from senders → batch Flow fetch (`GET_MANY` / RQL `or`
   of ids, already capped at 1000).
5. Unique `device_id`s → batch Device fetch for labels in group headers.
6. Group ports by `device_id`; sort groups by Device label, ports by label
   (unless auto-sort off).
7. Rank every expanded-expanded cell with the copied compatibility helper.

Client-side FilterPanel extras that Query cannot express stay client-side on
the loaded window only, same as IS-08. Prefer Query filters for format /
transport / label so the cap is spent on the right resources.

RQL off: transport matching cannot do the Connect-tab `|base$` trick;
matrix ranking still uses the JS helper, while the *loaded set* is whatever
basic query returned.

## Non-goals (v1)

- Literally all senders and receivers with no cap.
- List-style next/prev on either axis.
- Query WebSocket live grains.
- Evaluating `caps.constraint_sets` (keep ranks reserved).
- Prefetching IS-05 for every port.
- Stage / scheduled activation from the cell.
- Click-to-connect or Unlink on collapsed Device cells.
- Heading match on collapsed Device headings.
- Virtualized cell rendering (revisit if axis cap 100 x 100 is still too
  heavy once expanded).
- Making this a replacement for Receiver Connect tab.
- Confirm dialogs on Activate / Unlink.

## Sequencing

| Step | Work |
| --- | --- |
| 0 | **Done.** Cap = global Paging Limit per axis (no `next`); collapsed cells not clickable; no list paging; Unlink disables the receiver; heading match writes the opposite axis only |
| 1 | **Done.** IS-08 extract: overflow, fixed-size leaf columns, swap axes, parent/source heading visibility, sticky `thead` and left columns, per-axis Clear All |
| 2 | **Done.** Page shell: nav **Connections**, icon, independent FilterPanels with per-axis clear, two capped `GET_LIST`s, truncation banner |
| 3 | **Done.** Table with Device grouping, collapse, overflow scroll, sticky headings, IS-04 active dots only (read-only) |
| 4 | **Done.** Compatibility ranks + warning colour + cell tooltips (no constraint_sets) |
| 5 | **Done.** Heading match writes **opposite** axis only; FilterPanel shows the chips |
| 6 | **Done.** Click unused expanded cell → `makeConnection`; click checked → Unlink; stay on page; refresh IS-04 |
| 7 | Polish: constraint_sets, live grains — only if v1 is used |

## Acceptance (v1)

- New **Connections** nav page; lists unchanged.
- With a format filter (or heading match) and a small registry, operator can
  see which receiver is linked to which sender, expand two Devices, Activate
  a compatible cell, and Unlink it, without leaving the page.
- Heading match from a receiver fills **sender** filters the way Connect tab
  would; from a sender fills **receiver** filters from Flow + transport.
  Sender filters stay put. Each panel can be cleared independently.
- Incompatible cells are visible and explained, not omitted.
- A large registry without filters shows a truncated window and tells the
  user to filter; it does not hang the tab or page through the whole Query
  API.
- Collapsed Device cells never fire IS-05.
