# Design plan: Virtualized crosspoint matrices in nmos-js

Status: planned. Implement Channel Mapping through its large-device visual
checkpoint first, then add keyboard navigation and apply the shared viewport
to Connections.

## Motivation

The Connections and Channel Mapping pages render every logical body cell as a
DOM element. That is acceptable while groups are collapsed, but expanding
large IS-08 inputs and outputs multiplies their channels. A captured device
with 43 inputs and 43 outputs has about 1,860 channels on each axis; expanding
several 256-channel ports can create tens or hundreds of thousands of cells
and exhaust the browser.

Making an individual cell inexpensive only changes the constant cost. The
matrix must bound the number of cells in the DOM to the size of the viewport.

## Decisions

- Keep the current logical model: filter, sort and expand the resources first,
  then virtualize the resulting flat row and column arrays.
- Keep every body coordinate on a fixed `CELL_EXTENT` pitch (currently 40 px).
- Render the visible rows and columns plus five cells of overscan in each
  direction.
- Share the viewport calculation and layout mechanism between Connections and
  Channel Mapping.
- Batch scroll handling with `requestAnimationFrame`, and update React state
  only when the logical visible range changes.
- Initially preserve the semantic table, sticky headings and corner. Represent
  omitted columns with leading and trailing spacer columns, and omitted rows
  with top and bottom spacer rows.
- Calculate hierarchical heading spans against the visible range. A heading
  which begins before the range and ends inside it remains one clipped heading;
  it is not split into repeated labels.
- Close the singleton cell tooltip when scrolling begins because its anchor
  cell may unmount.
- Do not add a virtualization dependency unless the spacer-table prototype
  proves unable to preserve fixed layout and sticky headings.
- Preserve the existing filters, sorting, axis swap, expansion state, cell
  warnings, edits and activations. Virtualization is a rendering concern.

## Performance invariant

The number of mounted body cells is bounded by:

```text
(visible rows + vertical overscan)
    * (visible columns + horizontal overscan)
```

For a viewport showing about 25 by 20 cells and five cells of overscan on each
side, approximately 1,050 body cells are mounted whether the logical matrix is
100 by 100 or 2,560 by 2,560.

The large-device acceptance case must remain responsive with a 256-channel
input and a 256-channel output expanded together. Expanding further groups may
increase the logical canvas dimensions but must not materially increase the
mounted body-cell count.

## Step 1: Baseline and fixtures

Use both of these throughout:

- the existing small nmos-cpp IS-08 example, for visual and behaviour
  comparison;
- the large captured `/io` mock (43 inputs and 43 outputs, including
  256-channel ports), for scale.

Record time to a usable matrix, DOM node count, mounted body-cell count and
interaction behaviour before virtualization. Keep the nmos-cpp `/io` loader
and its run configuration separate from nmos-js commits.

Agent checkpoint:

- Capture baseline measurements.
- Add a test or development query which can count mounted matrix controls.

## Step 2: Shared viewport arithmetic

Add a small hook/helper beside `matrixLayout.js`. Its inputs are the scroll
container, logical row and column counts, fixed body pitch, heading extents and
overscan. Its outputs include:

- first and last rendered row and column indexes;
- leading and trailing spacer dimensions;
- top and bottom spacer dimensions;
- logical canvas width and height.

The heading bands reduce the body area available inside the viewport, but they
do not change the 40 px logical origin of body rows and columns in the scrolling
table.

Unit tests cover:

- empty and undersized matrices;
- every boundary and the final row or column;
- overscan clipped at zero and at the logical size;
- heading-space subtraction;
- resize;
- scroll movements which do not cross a cell boundary.

Agent checkpoint:

- Viewport tests pass before changing either matrix.

## Step 3: Spacer-table prototype

Keep the table at its full logical width, but replace the full column list with:

- the fixed heading columns;
- one leading spacer column;
- the visible 40 px columns;
- one trailing spacer column.

Render top and bottom spacer rows around the visible body rows. Each visible
body row contains its sticky row headings, a leading spacer cell, its visible
body cells and a trailing spacer cell.

Column-heading levels use intersections of their logical spans with the
rendered column range. The corner and sticky offsets remain unchanged.

Stop condition:

- If the browser still performs layout proportional to the logical dimensions,
  or fixed table layout cannot preserve the sticky headings, retain the
  viewport arithmetic and move the canvas to positioned elements instead.

Agent checkpoint:

- The prototype matches the small matrix's dimensions, borders, scrollbars and
  sticky headings before it is connected to the full Channel Mapping behavior.

## Step 4: Channel Mapping integration

Flatten each axis to one descriptor per logical body coordinate after applying
filtering, sorting, expansion and axis swap. Derive descriptors for each
heading level and its logical span.

Render only the shared viewport range while preserving:

- expanded and collapsed inputs and outputs;
- parent receiver and source headings;
- custom names;
- axis swap;
- sorting and filters;
- amber constraint warnings and hidden unroutable cells;
- Show and Edit behavior;
- active-map updates and activations;
- expansion persistence for the current Device.

Automated tests cover:

- the body cell at each rendered coordinate refers to the correct logical input
  and output channel;
- scrolling changes the rendered range;
- offscreen controls are absent;
- a 256 by 256 expansion keeps the mounted-cell count bounded;
- heading spans are clipped correctly;
- swapped axes produce the corresponding coordinates;
- tooltips close on scroll.

Agent checkpoint:

- Run lint and the complete test suite.
- Profile the large mock and compare DOM count and responsiveness with the
  baseline.
- Review cleanup of animation frames, scroll listeners, tooltip anchors and
  stale ranges after collapse.

User visual checkpoint:

1. Compare the small Channel Mapping matrix with the current page.
2. On the large mock, expand one 256-channel input and one 256-channel output.
3. Scroll horizontally, vertically and diagonally.
4. Check sticky headings, tooltips and constraint colours.
5. Swap axes, filter, collapse and re-expand.
6. Check light and dark themes, then Show and Edit.

Pause here for user review before changing Connections.

## Step 5: Keyboard and accessibility

Virtualization means an offscreen cell has no element to receive focus. Keep a
logical active coordinate:

```text
{ rowIndex, columnIndex }
```

One mounted cell is the matrix tab stop. Arrow keys update the logical
coordinate. If the target is outside the viewport, scroll it into view and
focus it after it mounts. Enter and Space retain their current activation
behavior.

Expose full logical dimensions and positions with `aria-rowcount`,
`aria-colcount`, `aria-rowindex` and `aria-colindex`.

Automated tests cover movement across viewport boundaries, all four matrix
edges and expansion or collapse around the active coordinate.

User visual checkpoint:

- Check focus visibility, arrow navigation and activation with the keyboard.

## Step 6: Connections integration

Adapt the already flattened Device and resource units to the shared viewport.
Preserve:

- collapsed and expanded Devices;
- sender and receiver filters and heading-match actions;
- active and unlink controls;
- compatibility warnings and the hover trail;
- singleton tooltip and leg menu;
- sticky Device and resource headings.

Agent checkpoint:

- Run lint and the complete test suite.
- Repeat the bounded mounted-cell assertion with a large Connections fixture.
- Profile scrolling and expansion.

User visual checkpoint:

- Check sticky headings, Device expansion, the hover trail, tooltips and the
  leg menu.

## Step 7: Final review and commits

Review:

- range calculations after resize and collapse;
- scroll and animation-frame teardown;
- focus when the active coordinate is removed;
- heading span clipping at both viewport boundaries;
- visual parity on the small fixtures;
- mounted-cell count and browser responsiveness on the large fixture.

Planned commits:

1. `Add fixed-pitch matrix viewport calculations`
2. `Virtualize Channel Mapping rows and columns`
3. `Navigate virtual matrix cells by logical position`
4. `Virtualize Connections rows and columns`
