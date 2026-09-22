import React from 'react';
import {
    IconButton,
    TableCell,
    TableContainer,
    TableHead,
    withStyles,
} from '@material-ui/core';

import LinkChipField from './LinkChipField';
import emphasizedPaper from '../theme/emphasizedPaper';

// the layout both crosspoint matrices share: the IS-08 Channel Mapping table
// and the IS-04/IS-05 Connections table

// as much padding across a cell as down it, so a heading's content is inset
// the same either way round
export const CELL_PADDING = 1;
export const CELL_BORDER = 1;
// each cell's own padding and single border, within its fixed extent
export const CELL_FRAME = 2 * CELL_PADDING + CELL_BORDER;
// as far across a row heading as down a column heading, so the matrix looks
// the same either way round
export const HEADING_EXTENT = 120;
// as far down a grid cell as across it, so the cells are square whatever
// their content; a little more than a chip in a row heading, so those rows
// are even with the rest and the control is not hard against the cell's own
// frame
export const CELL_EXTENT = 40;
// as far in from either end of the heading as the arrow on the headings
// which have one
export const HEADING_INSET = 8;
// the collapse button's own size, as a small icon button
export const COLLAPSE_BUTTON_SIZE = 30;
// a chip's own margin, which spaces it from the heading's edges and from the
// collapse button beside or below it
export const CHIP_MARGIN = 4;
// a chip is inset by its own margin as well as the heading cell's frame, so
// cap it short of the heading and the label ellipsizes inside the cell
export const CHIP_INSET = CELL_FRAME + 2 * CHIP_MARGIN;

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

// the collapse button at the grid edge, like the row headings, with the
// heading's content ending just above it; the content shares the heading
// with the button below it, just as it shares a row heading's width with the
// button beside it, and a collapsed heading spans the section below it too,
// so its content can be as long as one spanning two row headings
export const gridEdgeColumnHeadStyle = ({
    content,
    frame,
    inset,
    button = COLLAPSE_BUTTON_SIZE,
}) => ({
    // the button's own height, less the inset the content already has
    paddingBottom: button - inset,
    position: 'relative',
    [`& > ${content}`]: {
        maxHeight: HEADING_EXTENT - frame - (button - inset),
    },
    [`&[rowspan="2"] > ${content}`]: {
        maxHeight: 2 * HEADING_EXTENT - frame - (button - inset),
    },
    '& > button': {
        bottom: 0,
        left: '50%',
        position: 'absolute',
        transform: 'translateX(-50%)',
    },
});

// the scroll viewport the sticky headings stick within; the zero width stops
// the table widening the page, the minimum width fills the space available
export const MatrixTableContainer = withStyles({
    root: {
        marginTop: 8,
        minWidth: '100%',
        overflow: 'auto',
        width: 0,
    },
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
        maxHeight: HEADING_EXTENT - CHIP_INSET,
        width: 32,
        writingMode: 'vertical-rl',
        // the label's side padding would squeeze the vertical text
        '& > span': {
            padding: '12px 0',
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
        maxWidth: HEADING_EXTENT - CHIP_INSET,
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
