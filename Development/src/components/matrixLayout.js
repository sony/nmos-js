import React from 'react';
import {
    IconButton,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    withStyles,
} from '@material-ui/core';
import { fade } from '@material-ui/core/styles/colorManipulator';

import {
    MATRIX_CROSSHAIR_BAND_CLASS,
    MATRIX_CROSSHAIR_CLASS,
} from './matrixCrosshair';

import LinkChipField from './LinkChipField';
import emphasizedPaper from '../theme/emphasizedPaper';

// the layout both crosspoint matrices share: the IS-08 Channel Mapping table
// and the IS-04/IS-05 Connections table

// as much padding across a cell as down it, so a heading's content is inset
// the same either way round
export const CELL_PADDING = 1;
export const CELL_BORDER = 1;
// padding at both ends plus the one border a cell draws. The content box is
// the extent minus this.
export const CELL_PADDING_BORDER = 2 * CELL_PADDING + CELL_BORDER;
// as far across a row heading as down a column heading, so the matrix looks
// the same either way round
export const HEADING_EXTENT = 120;
// as far down a grid cell as across it, so the cells are square
export const CELL_EXTENT = 45;
// padding around a heading name, the same across a row heading as down a
// column heading
export const HEADING_PADDING = 8;
// CollapseButton is an IconButton size="small" around a default SvgIcon.
// size="small" sets the button font size to 18, but the arrow does not
// inherit it: the icon stays the SvgIcon default, and the button padding is
// the size="small" padding.
const SVG_ICON_SIZE = 24;
const ICON_BUTTON_SMALL_PADDING = 3;
export const COLLAPSE_BUTTON_SIZE =
    SVG_ICON_SIZE + 2 * ICON_BUTTON_SMALL_PADDING;
// the heading match button. Smaller than the collapse arrow, and neither of
// Material's icon sizes: SvgIcon small is 20, and size="small" padding is 3.
export const MATCH_ICON_SIZE = 16;
export const MATCH_ICON_PADDING = 2;
export const MATCH_BUTTON_SIZE = MATCH_ICON_SIZE + 2 * MATCH_ICON_PADDING;
// the margin react-admin's ChipField sets on a Chip
export const CHIP_MARGIN = 4;
// a Chip's own height, which is the width of one standing on end
export const CHIP_EXTENT = 32;
// the padding a Chip gives its label, on both ends of the long axis
export const CHIP_LABEL_PADDING = 12;

export const cellLine = theme =>
    `solid ${CELL_BORDER}px ${theme.palette.divider}`;

export const matrixCellStyle = theme => ({
    textAlign: 'center',
    // a fixed extent counts the cell's border and padding, as a fixed column
    // width does, since the app does not use CssBaseline to say so
    boxSizing: 'border-box',
    padding: CELL_PADDING,
    // each cell draws only the lines to its right and below, so a line
    // between two cells is as thin as one at the table's edge; the headings
    // along the top and down the left side draw the two edges left over
    borderRight: cellLine(theme),
    borderBottom: cellLine(theme),
});

export const matrixHeadStyle = theme => ({
    backgroundColor: emphasizedPaper(theme),
});

// passing variant="head" doesn't seem to work inside TableBody
export const TableHeadCell = props => <TableCell component="th" {...props} />;

// every row of the grid has these cells, so they set how tall a row is, just
// as the column widths set how wide one is; a heading beside them can be a
// chip or a line of text without the rows coming out uneven
export const MatrixCell = withStyles(theme => ({
    root: {
        ...matrixCellStyle(theme),
        height: CELL_EXTENT,
        // the whole square reveals a control the matrix draws only on hover,
        // so the pointer does not have to find an invisible circle
        '&:hover button': {
            opacity: 1,
            transitionDuration: `${theme.transitions.duration.shorter}ms`,
        },
    },
}))(TableCell);

// for column and row headings
export const MatrixHeadCell = withStyles(theme => ({
    root: {
        ...matrixCellStyle(theme),
        ...matrixHeadStyle(theme),
        overflow: 'hidden',
        '& > div': {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        },
    },
}))(TableHeadCell);

// the columns and rows outside the viewport. Their fixed size keeps the
// mounted cells aligned with the headings of the whole matrix.
export const MatrixColumnSpacer = ({ heading, rowSpan, width }) => {
    if (!width) return null;
    const Cell = heading ? MatrixHeadCell : MatrixCell;
    return (
        <Cell
            rowSpan={rowSpan}
            style={{ padding: 0, width }}
            aria-hidden={true}
        />
    );
};

export const MatrixRowSpacer = ({ colSpan, height }) => {
    if (!height) return null;
    return (
        <TableRow style={{ height }} aria-hidden={true}>
            <MatrixCell colSpan={colSpan} style={{ height, padding: 0 }} />
        </TableRow>
    );
};

// square, spanning every heading section each way, so collapsing everything
// does not shrink the headings it spans; the card behind, rather than a
// heading
export const matrixCornerCellStyle = (theme, headingSections) => ({
    ...matrixCellStyle(theme),
    height: headingSections * HEADING_EXTENT,
    backgroundColor: theme.palette.background.paper,
});

// the corner stays at the origin of the scroll viewport, above both the
// sticky thead and the sticky row headings
export const matrixCornerStickyStyle = {
    left: 0,
    position: 'sticky',
    zIndex: 4,
};

export const stickyHeadingStyle = (theme, left) => ({
    ...matrixHeadStyle(theme),
    left,
    position: 'sticky',
    zIndex: 2,
});

// the row headings are below the corner, the column headings to its right
export const cornerRowsLabelStyle = {
    bottom: 2,
    left: 0,
    position: 'absolute',
    right: 0,
};

export const cornerColumnsLabelStyle = {
    position: 'absolute',
    right: 2,
    top: '50%',
    transform: 'translateY(-50%)',
    writingMode: 'vertical-rl',
};

// column headings read top-to-bottom so names survive the narrow columns,
// each as tall as a row heading is wide
export const MatrixColumnHeadCell = withStyles({
    root: {
        height: HEADING_EXTENT,
        verticalAlign: 'bottom',
    },
})(MatrixHeadCell);

// row headings end at the grid, as column headings end at the bottom
export const MatrixRowHeadCell = withStyles({
    root: {
        textAlign: 'right',
    },
})(MatrixHeadCell);

// `inset` is the padding or margin the content already has at the button, so
// it is not counted again. `margin` is a chip's own margin, counted at both
// ends. The cell's padding and border come off as well.
const gridEdgeContentLimit = (span, { button, inset, margin }) =>
    span * HEADING_EXTENT - CELL_PADDING_BORDER - 2 * margin - (button - inset);

// the collapse button at the grid edge, like the row headings, with the
// heading's content ending just above it; the content shares the heading
// with the button below it, just as it shares a row heading's width with the
// button beside it, and a collapsed heading spans the section below it too,
// so its content can be as long as one spanning two row headings

export const gridEdgeColumnHeadStyle = ({
    content,
    inset,
    margin = 0,
    button = COLLAPSE_BUTTON_SIZE,
}) => ({
    // the button's own height, less the padding or margin the content already
    // has against it
    paddingBottom: button - inset,
    position: 'relative',
    [`& > ${content}`]: {
        maxHeight: gridEdgeContentLimit(1, { button, inset, margin }),
    },
    [`&[rowspan="2"] > ${content}`]: {
        maxHeight: gridEdgeContentLimit(2, { button, inset, margin }),
    },
    '& > button': {
        bottom: 0,
        left: '50%',
        position: 'absolute',
        transform: 'translateX(-50%)',
    },
});

// the same, across a row heading: the content then the button beside it, in
// the reading direction, the content's inset closed up against the button
export const gridEdgeRowHeadStyle = ({
    content,
    inset,
    margin = 0,
    button = COLLAPSE_BUTTON_SIZE,
}) => ({
    '& > div': {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    '& > div > *': {
        minWidth: 0,
    },
    [`& > div > ${content}`]: {
        maxWidth: gridEdgeContentLimit(1, { button, inset, margin }),
    },
    [`&[colspan="2"] > div > ${content}`]: {
        maxWidth: gridEdgeContentLimit(2, { button, inset, margin }),
    },
    '& > div > button:first-of-type': {
        marginLeft: -inset,
    },
});

// a row heading's content starts where it would in the cell's flow, after
// the cell's padding, and its button meets the grid edge, as the button
// along the bottom of a column heading does
export const gridEdgeRowAnchor = centre => ({
    left: CELL_PADDING,
    position: 'absolute',
    right: 0,
    top: centre,
    transform: 'translateY(-50%)',
});

// the scroll viewport the sticky headings stick within; the zero width stops
// the table widening the page, the minimum width fills the space available
// weaker than a matrix button's 0.08 hover wash: this covers a whole row and
// column, so the two strengths are chosen separately
const CROSSHAIR_OPACITY = 0.04;

export const MatrixTableContainer = withStyles(theme => {
    const crosshairWash = fade(theme.palette.text.primary, CROSSHAIR_OPACITY);
    return {
        root: {
            marginTop: theme.spacing(1),
            minWidth: '100%',
            overflow: 'auto',
            position: 'relative',
            width: 0,
            [`& .${MATRIX_CROSSHAIR_CLASS}`]: {
                backgroundImage: `linear-gradient(${crosshairWash}, ${crosshairWash})`,
            },
            // the body wash, one rectangle per axis, above the cells and
            // below the sticky headings
            [`& .${MATRIX_CROSSHAIR_BAND_CLASS}`]: {
                backgroundColor: crosshairWash,
                left: 0,
                pointerEvents: 'none',
                position: 'absolute',
                top: 0,
                zIndex: 1,
            },
        },
    };
})(TableContainer);

export const MatrixTableHead = withStyles(theme => ({
    root: {
        ...matrixHeadStyle(theme),
        // the headings along the top draw the table's top edge, all but the
        // corner, which is the first cell of that row
        '& > tr:first-child > th:not(:first-child)': {
            borderTop: cellLine(theme),
        },
        position: 'sticky',
        top: 0,
        zIndex: 3,
    },
}))(TableHead);

// fixed columns so the headings ellipsize rather than stretch the grid, and
// separate borders so sticky headings keep their lines
export const matrixTableStyle = width => ({
    borderCollapse: 'separate',
    borderSpacing: 0,
    tableLayout: 'fixed',
    width,
});

// a chip standing on end, so its rounded ends are top and bottom
export const VerticalLinkChipField = withStyles({
    chip: {
        height: 'auto',
        maxHeight: HEADING_EXTENT - CELL_PADDING_BORDER - 2 * CHIP_MARGIN,
        width: CHIP_EXTENT,
        writingMode: 'vertical-rl',
        // the label padding moved to the long axis; the cross-axis padding
        // would squeeze the vertical text
        '& > span': {
            padding: `${CHIP_LABEL_PADDING}px 0`,
        },
    },
})(({ classes, className, ...props }) => (
    <LinkChipField
        className={[className, classes.chip].filter(Boolean).join(' ')}
        {...props}
    />
));

export const HorizontalLinkChipField = withStyles({
    chip: {
        maxWidth: HEADING_EXTENT - CELL_PADDING_BORDER - 2 * CHIP_MARGIN,
    },
})(({ classes, className, ...props }) => (
    <LinkChipField
        className={[className, classes.chip].filter(Boolean).join(' ')}
        {...props}
    />
));

// a collapsed heading stands in for the grid behind it, so these icons read
// like the grid rather than like a control
const EllipsisIconButton = withStyles(theme => ({
    root: {
        '&.Mui-disabled': {
            color: theme.palette.divider,
        },
    },
}))(IconButton);

// Midline Horizontal Ellipsis for when columns have been collapsed
export const HorizontalEllipsisButton = props => (
    <EllipsisIconButton size="small" children={'\u22ef'} {...props} />
);

// Vertical Ellipsis for when rows have been collapsed
export const VerticalEllipsisButton = props => (
    <EllipsisIconButton size="small" children={'\u22ee'} {...props} />
);

// Down Right Diagonal Ellipsis for when both have been collapsed
export const DiagonalEllipsisButton = props => (
    <EllipsisIconButton size="small" children={'\u22f1'} {...props} />
);
