import { Fragment, createContext, useContext, useRef, useState } from 'react';
import {
    ClickAwayListener,
    Divider,
    MenuItem,
    Table,
    TableBody,
    TableRow,
    Tooltip,
    Typography,
    withStyles,
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import DoneIcon from '@material-ui/icons/Done';
import {
    ReferenceField,
    ReferenceManyField,
    SingleFieldList,
} from 'react-admin';
import { get, isEmpty, set, setWith, toPath, unset } from 'lodash';
import LinkChipField from '../../components/LinkChipField';
import MappingButton from '../../components/MappingButton';
import CollapseButton from '../../components/CollapseButton';
import {
    CELL_BORDER,
    CELL_EXTENT,
    CELL_FRAME,
    DiagonalEllipsisButton,
    HEADING_EXTENT,
    HEADING_INSET,
    HorizontalEllipsisButton,
    HorizontalLinkChipField,
    MatrixCell,
    MatrixColumnHeadCell,
    MatrixHeadCell,
    MatrixRowHeadCell,
    MatrixTableContainer,
    MatrixTableHead,
    TableHeadCell,
    VerticalEllipsisButton,
    VerticalLinkChipField,
    cellLine,
    cornerColumnsLabelStyle,
    cornerRowsLabelStyle,
    gridEdgeColumnHeadStyle,
    matrixCornerCellStyle,
    matrixCornerStickyStyle,
    matrixTableStyle,
    stickyHeadingStyle,
} from '../../components/matrixLayout';
import FilterPanel, {
    BooleanFilter,
    NumberFilter,
    StringFilter,
} from '../../components/FilterPanel';
import CustomNameField from '../../components/CustomNameField';
import CustomNamesContextProvider from '../../components/CustomNamesContextProvider';
import useCustomNamesContext from '../../components/useCustomNamesContext';
import useTableMaxHeight from '../../components/useTableMaxHeight';
import { useJSONSetting } from '../../settings';
import labelize from '../../components/labelize';
import { getFilteredInputs, getFilteredOutputs } from './FilterMatrix';

// lodash extension to remove empty objects/arrays when unsetting values
const unsetCleanly = (object, path) => {
    const pathArray = toPath(path);
    do {
        unset(object, pathArray);
        pathArray.pop();
    } while (!isEmpty(pathArray) && isEmpty(get(object, pathArray)));
};

// the corner is opaque so the rows scrolling underneath do not show through
const MappingCornerCell = withStyles(theme => ({
    root: {
        ...matrixCornerCellStyle(theme, 3),
        ...matrixCornerStickyStyle,
    },
}))(TableHeadCell);

const PARENT_HEADING_OFFSET = '--parent-heading-offset';
// without an association heading beside it, the I/O heading is the first
// cell of the row, and draws the table's left edge in its place
const IO_HEADING_EDGE = '--io-heading-edge';

const MappingParentHeadCell = withStyles(theme => ({
    root: {
        ...stickyHeadingStyle(theme, 0),
        // the association headings are the first cell of each row group, so
        // they draw the table's left edge
        borderLeft: cellLine(theme),
    },
}))(MatrixHeadCell);

const MappingIOHeadCell = withStyles(theme => ({
    root: {
        ...stickyHeadingStyle(theme, `var(${PARENT_HEADING_OFFSET})`),
        borderLeft: `solid var(${IO_HEADING_EDGE}) ${theme.palette.divider}`,
        paddingLeft: HEADING_INSET,
        // name then collapse button, in the reading direction
        '& > div': {
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
        },
        '& > div > div': {
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        },
    },
}))(MatrixRowHeadCell);

const MappingChannelHeadCell = withStyles(theme => ({
    root: {
        ...stickyHeadingStyle(
            theme,
            `calc(var(${PARENT_HEADING_OFFSET}) + ${HEADING_EXTENT}px)`
        ),
        paddingLeft: HEADING_INSET,
        paddingRight: HEADING_INSET,
    },
}))(MatrixRowHeadCell);

const MappingRowHeadCell = withStyles(theme => ({
    root: {
        ...stickyHeadingStyle(theme, 0),
        // a row heading spanning the heading sections likewise begins its
        // row, so it draws the left edge too
        borderLeft: cellLine(theme),
        paddingLeft: HEADING_INSET,
        paddingRight: HEADING_INSET,
    },
}))(MatrixRowHeadCell);

// the names read top-to-bottom, whatever they are, so the name block is
// capped short of the cell's own border and padding
const MappingColumnHeadCell = withStyles({
    root: {
        '& > div': {
            boxSizing: 'border-box',
            display: 'block',
            margin: '0 auto',
            maxHeight: HEADING_EXTENT - CELL_FRAME,
            padding: `${HEADING_INSET}px 0`,
            width: 'fit-content',
            writingMode: 'vertical-rl',
        },
    },
})(MatrixColumnHeadCell);

// a chip is centered and inset by its own margin, as in the row headings
const MappingParentColumnHeadCell = withStyles({
    root: {
        verticalAlign: 'middle',
        '& > div': {
            padding: 0,
        },
    },
})(MappingColumnHeadCell);

// the name is inset by the heading's own padding
const MappingIOColumnHeadCell = withStyles({
    root: gridEdgeColumnHeadStyle({
        content: 'div',
        frame: CELL_FRAME,
        inset: HEADING_INSET,
    }),
})(MappingColumnHeadCell);

const CustomNameFieldWithInputProps = ({
    classes: { input: inputClass, ...inheritedClasses },
    ...props
}) => {
    return (
        <CustomNameField
            {...props}
            InputProps={{
                className: inputClass,
            }}
            classes={inheritedClasses}
        />
    );
};

// the input text was black in 'light' theme before adding this
const TooltipCustomNameField = withStyles({
    input: {
        color: 'currentColor',
    },
})(CustomNameFieldWithInputProps);

const TooltipChipField = props => (
    <div
        style={{
            margin: 2,
            padding: 2,
        }}
    >
        <LinkChipField {...props} />
    </div>
);

const TooltipDivider = withStyles({
    root: {
        marginTop: 4,
        marginBottom: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
    },
})(Divider);

const ConstraintWarning = withStyles(theme => ({
    root: {
        color:
            theme.palette.type === 'light'
                ? theme.palette.warning.dark
                : theme.palette.warning.light,
    },
}))(Typography);

export const isRoutableInput = (outputItem, inputId) => {
    const routableInputs = get(outputItem, 'caps.routable_inputs');
    // null means that the Output has no routing restrictions. If the field is
    // absent or malformed, leave validation to the Node.
    return !Array.isArray(routableInputs) || routableInputs.includes(inputId);
};

const routableInputConstraintWarning = (outputItem, inputId) => {
    if (isRoutableInput(outputItem, inputId)) return;
    return inputId === null
        ? "This output's routable inputs do not include Unrouted."
        : "This output's routable inputs do not include this input.";
};

const setConstraintWarning = (
    warnings,
    outputId,
    outputChannelIndex,
    warning
) => {
    setWith(warnings, [outputId, outputChannelIndex], warning, Object);
};

export const channelMappingConstraintWarnings = (io, mapping) => {
    const routableInputWarnings = {};
    const blockSizeWarnings = {};
    const reorderingWarnings = {};

    for (const [outputId, outputMap] of Object.entries(mapping || {})) {
        const outputItem = get(io, ['outputs', outputId]);
        const entries = Object.entries(outputMap)
            .sort(([left], [right]) => Number(left) - Number(right))
            .map(([outputChannelIndex, entry]) => ({
                outputChannelIndex,
                outputIndex: Number(outputChannelIndex),
                inputId: get(entry, 'input'),
                inputIndex: get(entry, 'channel_index'),
            }));

        for (const entry of entries) {
            const warning = routableInputConstraintWarning(
                outputItem,
                entry.inputId
            );
            if (warning) {
                setConstraintWarning(
                    routableInputWarnings,
                    outputId,
                    entry.outputChannelIndex,
                    warning
                );
            }
        }

        const inputOffsets = {};
        const reorderingViolationInputs = new Set();
        let currentInputId;
        let currentBlockSize;
        let currentBlock = [];

        const checkCurrentBlock = () => {
            if (!currentBlock.length || !currentBlockSize) return;
            const inputBlock = Math.floor(
                currentBlock[0].inputIndex / currentBlockSize
            );
            const inputChannels = new Set(
                currentBlock.map(({ inputIndex }) => inputIndex)
            );
            const complete =
                currentBlock.length === currentBlockSize &&
                inputChannels.size === currentBlockSize &&
                currentBlock.every(
                    ({ inputIndex }) =>
                        Math.floor(inputIndex / currentBlockSize) === inputBlock
                );
            if (!complete) {
                const warning = `This input requires channels to be routed in complete blocks of ${currentBlockSize}.`;
                for (const { outputChannelIndex } of currentBlock) {
                    setConstraintWarning(
                        blockSizeWarnings,
                        outputId,
                        outputChannelIndex,
                        warning
                    );
                }
            }
        };

        for (const entry of entries) {
            if (entry.inputId === null) continue;
            const inputItem = get(io, ['inputs', entry.inputId]);
            const blockSize = get(inputItem, 'caps.block_size');
            if (
                !Number.isInteger(entry.outputIndex) ||
                !Number.isInteger(entry.inputIndex) ||
                !Number.isInteger(blockSize) ||
                blockSize < 1
            ) {
                checkCurrentBlock();
                currentBlock = [];
                currentInputId = undefined;
                currentBlockSize = undefined;
                continue;
            }

            if (entry.inputId !== currentInputId) {
                checkCurrentBlock();
                currentBlock = [];
                currentInputId = entry.inputId;
                currentBlockSize = blockSize;
                if (get(inputItem, 'caps.reordering') === false) {
                    if (entry.inputIndex % blockSize !== 0) {
                        reorderingViolationInputs.add(entry.inputId);
                    }
                    if (
                        !Object.prototype.hasOwnProperty.call(
                            inputOffsets,
                            entry.inputId
                        )
                    ) {
                        inputOffsets[entry.inputId] =
                            entry.inputIndex - entry.outputIndex;
                    }
                }
            } else if (currentBlock.length === currentBlockSize) {
                checkCurrentBlock();
                currentBlock = [];
            }

            if (get(inputItem, 'caps.reordering') === false) {
                const offset = entry.inputIndex - entry.outputIndex;
                if (offset !== inputOffsets[entry.inputId]) {
                    reorderingViolationInputs.add(entry.inputId);
                }
                if (
                    currentBlock.length &&
                    entry.inputIndex !==
                        currentBlock[currentBlock.length - 1].inputIndex + 1
                ) {
                    reorderingViolationInputs.add(entry.inputId);
                }
            }
            currentBlock.push(entry);
        }
        checkCurrentBlock();

        const reorderingWarning =
            'This input does not allow reordering; channels must keep a fixed offset on this output.';
        for (const entry of entries) {
            if (reorderingViolationInputs.has(entry.inputId)) {
                setConstraintWarning(
                    reorderingWarnings,
                    outputId,
                    entry.outputChannelIndex,
                    reorderingWarning
                );
            }
        }
    }

    const warnings = {};
    for (const [outputId, outputMap] of Object.entries(mapping || {})) {
        for (const outputChannelIndex of Object.keys(outputMap)) {
            const warning =
                get(routableInputWarnings, [outputId, outputChannelIndex]) ||
                get(blockSizeWarnings, [outputId, outputChannelIndex]) ||
                get(reorderingWarnings, [outputId, outputChannelIndex]);
            if (warning) {
                setConstraintWarning(
                    warnings,
                    outputId,
                    outputChannelIndex,
                    warning
                );
            }
        }
    }
    return warnings;
};

const MappingHeadTooltipContext = createContext();

const MappingHeadTooltip = ({ title, ...props }) => {
    const { tooltipModal, setTooltipModal } = useContext(
        MappingHeadTooltipContext
    );

    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setTooltipModal(false);
    };

    const handleClickAway = () => {
        setOpen(false);
        setTooltipModal(false);
    };

    return (
        <Tooltip
            open={open}
            disableHoverListener={tooltipModal}
            interactive
            title={
                <ClickAwayListener onClickAway={handleClickAway}>
                    <div>{title}</div>
                </ClickAwayListener>
            }
            onOpen={handleOpen}
            onClose={handleClose}
            {...props}
        />
    );
};

// mapping cell tooltips have no editable content, so they must not capture the
// pointer or stay open when the mouse moves on to another cell
const MappingCellTooltip = props => {
    const { tooltipModal } = useContext(MappingHeadTooltipContext);

    return <Tooltip disableHoverListener={tooltipModal} {...props} />;
};

const popperPropsOffset = (skidding, distance) => ({
    popperOptions: {
        modifiers: {
            offset: {
                offset: `${skidding}, ${distance}`,
            },
            flip: {
                enabled: false,
            },
        },
    },
});
const popperPropsNearer = popperPropsOffset(0, -10);

const OutputTooltip = ({ outputId, outputItem, getInputAPIName }) => {
    const { setTooltipModal } = useContext(MappingHeadTooltipContext);

    const { getCustomName } = useCustomNamesContext();
    const source = `outputs.${outputId}.name`;

    return (
        <>
            {'ID'}
            <Typography variant="body2">{outputId}</Typography>
            <TooltipDivider />
            {'Name'}
            <TooltipCustomNameField
                {...{
                    source,
                    defaultValue: outputItem.properties.name,
                    autoFocus: true,
                    onEditStarted: () => setTooltipModal(true),
                    onEditStopped: () => setTooltipModal(false),
                }}
            />
            {getCustomName(source) && (
                <>
                    {'API Name'}
                    <Typography variant="body2">
                        {outputItem.properties.name}
                    </Typography>
                </>
            )}
            {'Description'}
            <Typography variant="body2">
                {outputItem.properties.description}
            </Typography>
            <TooltipDivider />
            {'Routable Inputs'}
            <Typography variant="body2">
                {outputItem.caps.routable_inputs !== null
                    ? outputItem.caps.routable_inputs
                          .map(inputId =>
                              inputId === null
                                  ? 'Unrouted'
                                  : getCustomName(`inputs.${inputId}.name`) ||
                                    getInputAPIName(inputId)
                          )
                          .join(', ')
                    : 'No Constraints'}
            </Typography>
        </>
    );
};

const InputTooltip = ({ inputId, inputItem }) => {
    const { setTooltipModal } = useContext(MappingHeadTooltipContext);

    const { getCustomName } = useCustomNamesContext();
    const source = `inputs.${inputId}.name`;

    return (
        <>
            {'ID'}
            <Typography variant="body2">{inputId}</Typography>
            <TooltipDivider />
            {'Name'}
            <TooltipCustomNameField
                {...{
                    source,
                    defaultValue: inputItem.properties.name,
                    autoFocus: true,
                    onEditStarted: () => setTooltipModal(true),
                    onEditStopped: () => setTooltipModal(false),
                }}
            />
            {getCustomName(source) && (
                <>
                    {'API Name'}
                    <Typography variant="body2">
                        {inputItem.properties.name}
                    </Typography>
                </>
            )}
            {'Description'}
            <Typography variant="body2">
                {get(inputItem, 'properties.description')}
            </Typography>
            <TooltipDivider />
            {'Block Size'}
            <Typography variant="body2">
                {get(inputItem, 'caps.block_size')}
            </Typography>
            {'Reordering'}
            <Typography variant="body2">
                {get(inputItem, 'caps.reordering') ? (
                    <DoneIcon />
                ) : (
                    <ClearIcon />
                )}
            </Typography>
        </>
    );
};

const ChannelTooltip = ({ ioResource, id, channelIndex, channelLabel }) => {
    const { getCustomName } = useCustomNamesContext();
    const { setTooltipModal } = useContext(MappingHeadTooltipContext);
    const source = `${ioResource}.${id}.channels.${channelIndex}`;
    return (
        <>
            {'Channel ' + channelIndex}
            <TooltipDivider />
            {'Label'}
            <TooltipCustomNameField
                {...{
                    source,
                    defaultValue: channelLabel,
                    autoFocus: true,
                    onEditStarted: () => setTooltipModal(true),
                    onEditStopped: () => setTooltipModal(false),
                }}
            />
            {getCustomName(source) && (
                <>
                    {'API Label'}
                    <Typography variant="body2">{channelLabel}</Typography>
                </>
            )}
        </>
    );
};

const MappedCellTooltip = ({
    outputName,
    outputChannelIndex,
    outputChannelLabel,
    inputName,
    inputChannelIndex,
    inputChannelLabel,
    constraintWarning,
}) => (
    <>
        {'Input'}
        <Typography variant="body2">
            {inputName}
            {inputChannelLabel && ' - '}
            {inputChannelLabel}
            {inputChannelIndex && ` (Channel ${inputChannelIndex})`}
        </Typography>
        {'Output'}
        <Typography variant="body2">
            {outputName}
            {outputChannelLabel && ' - '}
            {outputChannelLabel}
            {outputChannelIndex && ` (Channel ${outputChannelIndex})`}
        </Typography>
        {constraintWarning && (
            <>
                <TooltipDivider />
                {'Expected Constraint Violation'}
                <ConstraintWarning variant="body2">
                    {constraintWarning}
                </ConstraintWarning>
            </>
        )}
    </>
);

const OutputSourceTooltip = ({ outputItem }) => (
    <>
        {'Source'}
        <ReferenceField
            record={outputItem}
            basePath="/sources"
            label="Source"
            source="source_id"
            reference="sources"
            link="show"
        >
            <TooltipChipField />
        </ReferenceField>
        {'Flows'}
        <ReferenceManyField
            record={outputItem}
            basePath="/flows"
            label="Flows"
            source="source_id"
            reference="flows"
            target="source_id"
            link="show"
            style={{
                margin: 1,
                padding: 1,
            }}
        >
            <SingleFieldList linkType="show">
                <TooltipChipField />
            </SingleFieldList>
        </ReferenceManyField>
        {'Senders'}
        <ReferenceManyField
            record={outputItem}
            basePath="/flows"
            label="Flows"
            source="source_id"
            reference="flows"
            target="source_id"
            style={{
                margin: 2,
                padding: 1,
            }}
        >
            <SingleFieldList linkType={false}>
                <ReferenceManyField
                    label="Senders"
                    basePath="/senders"
                    source="id"
                    target="flow_id"
                    reference="senders"
                    link="show"
                >
                    <SingleFieldList linkType="show">
                        <TooltipChipField />
                    </SingleFieldList>
                </ReferenceManyField>
            </SingleFieldList>
        </ReferenceManyField>
    </>
);

const OutputSourceAssociation = ({ outputs, isExpanded }) =>
    outputs.map(([outputId, outputItem]) => (
        <MappingParentColumnHeadCell
            colSpan={
                isExpanded(outputId)
                    ? Object.keys(outputItem.channels).length
                    : 1
            }
            key={outputId}
        >
            {get(outputItem, 'source_id') ? (
                <MappingHeadTooltip
                    title={<OutputSourceTooltip {...{ outputItem }} />}
                    placement="top"
                    arrow
                    PopperProps={popperPropsNearer}
                >
                    <div>
                        <ReferenceField
                            record={outputItem}
                            basePath="/sources"
                            label="Source"
                            source="source_id"
                            reference="sources"
                            link="show"
                        >
                            <VerticalLinkChipField />
                        </ReferenceField>
                    </div>
                </MappingHeadTooltip>
            ) : (
                <MappingHeadTooltip
                    title={
                        <Typography variant="body2">{'No Source'}</Typography>
                    }
                    placement="top"
                    arrow
                    PopperProps={popperPropsNearer}
                >
                    <div>{'No Source'}</div>
                </MappingHeadTooltip>
            )}
        </MappingParentColumnHeadCell>
    ));

// parent.type is 'source' or 'receiver'
const InputParentReferenceField = ({ record, ...props }) => (
    <ReferenceField
        record={record}
        basePath={`/${record.parent.type}s`}
        label={labelize(record.parent.type)}
        source="parent.id"
        reference={`${record.parent.type}s`}
        {...props}
    />
);

const InputParentTooltip = ({ inputItem }) => (
    <>
        {'Parent ' + labelize(inputItem.parent.type)}
        <InputParentReferenceField record={inputItem} link="show">
            <TooltipChipField />
        </InputParentReferenceField>
    </>
);

const InputParentAssociation = ({ isInputExpanded, inputItem }) => (
    <MappingParentHeadCell
        rowSpan={isInputExpanded ? Object.keys(inputItem.channels).length : 1}
    >
        {inputItem.parent.type === null ? (
            <MappingHeadTooltip
                title={<Typography variant="body2">{'No Parent'}</Typography>}
                placement="left"
                arrow
                PopperProps={popperPropsNearer}
            >
                <div>{'No Parent'}</div>
            </MappingHeadTooltip>
        ) : (
            <MappingHeadTooltip
                title={<InputParentTooltip inputItem={inputItem} />}
                placement="left"
                arrow
                PopperProps={popperPropsNearer}
            >
                <div>
                    <InputParentReferenceField record={inputItem} link="show">
                        <HorizontalLinkChipField />
                    </InputParentReferenceField>
                </div>
            </MappingHeadTooltip>
        )}
    </MappingParentHeadCell>
);

const MappingCellsForCollapsedInput = ({ outputs, isOutputExpanded }) =>
    outputs.map(([outputId, outputItem]) =>
        isOutputExpanded(outputId) ? (
            Object.entries(outputItem.channels).map(([channelIndex, _]) => (
                <MatrixCell key={channelIndex}>
                    <VerticalEllipsisButton disabled />
                </MatrixCell>
            ))
        ) : (
            <MatrixCell key={outputId}>
                <DiagonalEllipsisButton disabled />
            </MatrixCell>
        )
    );

const ChannelMappingCell = ({
    outputId,
    outputItem,
    outputChannelIndex,
    outputChannel,
    inputId,
    inputName,
    inputChannelIndex,
    inputChannel,
    mappingDisabled,
    handleMap,
    isMapped,
    getConstraintWarning,
}) => {
    const { getCustomName } = useCustomNamesContext();
    const constraintWarning = getConstraintWarning(
        inputId,
        outputId,
        inputChannelIndex,
        outputChannelIndex,
        outputItem
    );

    return (
        <MatrixCell>
            <MappingCellTooltip
                title={
                    <MappedCellTooltip
                        outputName={
                            getCustomName(`outputs.${outputId}.name`) ||
                            outputItem.properties.name
                        }
                        outputChannelIndex={outputChannelIndex}
                        outputChannelLabel={
                            getCustomName(
                                `outputs.${outputId}.channels.${outputChannelIndex}`
                            ) || outputChannel.label
                        }
                        inputName={
                            inputId === null
                                ? 'Unrouted'
                                : getCustomName(`inputs.${inputId}.name`) ||
                                  inputName
                        }
                        inputChannelIndex={inputChannelIndex}
                        inputChannelLabel={
                            inputChannel &&
                            (getCustomName(
                                `inputs.${inputId}.channels.${inputChannelIndex}`
                            ) ||
                                inputChannel.label)
                        }
                        constraintWarning={constraintWarning}
                    />
                }
                placement="bottom-start"
                arrow
                PopperProps={popperPropsOffset(40, -10)}
            >
                <div>
                    <MappingButton
                        disabled={mappingDisabled}
                        onClick={() =>
                            handleMap(
                                inputId,
                                outputId,
                                inputChannelIndex,
                                outputChannelIndex
                            )
                        }
                        checked={isMapped(
                            inputId,
                            outputId,
                            inputChannelIndex,
                            outputChannelIndex
                        )}
                        constraintWarning={constraintWarning}
                    />
                </div>
            </MappingCellTooltip>
        </MatrixCell>
    );
};

const InputChannelMappingCells = ({
    inputChannel,
    inputChannelIndex,
    inputName,
    inputId,
    outputs,
    isOutputExpanded,
    mappingDisabled,
    handleMap,
    isMapped,
    getConstraintWarning,
}) => {
    const { getCustomName } = useCustomNamesContext();
    return (
        <>
            <MappingChannelHeadCell key={inputChannelIndex}>
                <MappingHeadTooltip
                    title={
                        <ChannelTooltip
                            {...{
                                ioResource: 'inputs',
                                id: inputId,
                                channelIndex: inputChannelIndex,
                                channelLabel: inputChannel.label,
                            }}
                        />
                    }
                    placement="left"
                    arrow
                    PopperProps={popperPropsNearer}
                >
                    <div>
                        {getCustomName(
                            `inputs.${inputId}.channels.${inputChannelIndex}`
                        ) || inputChannel.label}
                    </div>
                </MappingHeadTooltip>
            </MappingChannelHeadCell>
            <>
                {outputs.map(([outputId, outputItem]) =>
                    isOutputExpanded(outputId) ? (
                        Object.entries(outputItem.channels).map(
                            ([outputChannelIndex, outputChannel]) => (
                                <ChannelMappingCell
                                    key={outputChannelIndex}
                                    {...{
                                        outputId,
                                        outputItem,
                                        outputChannelIndex,
                                        outputChannel,
                                        inputId,
                                        inputName,
                                        inputChannelIndex,
                                        inputChannel,
                                        mappingDisabled,
                                        handleMap,
                                        isMapped,
                                        getConstraintWarning,
                                    }}
                                />
                            )
                        )
                    ) : (
                        <MatrixCell key={outputId}>
                            <HorizontalEllipsisButton disabled />
                        </MatrixCell>
                    )
                )}
            </>
        </>
    );
};

const UnroutedRow = ({
    outputs,
    headingSections,
    mappingDisabled,
    handleMap,
    isMapped,
    getConstraintWarning,
    isOutputExpanded,
}) => {
    return (
        <TableRow>
            <MappingRowHeadCell colSpan={headingSections}>
                {'Unrouted'}
            </MappingRowHeadCell>
            {outputs.map(([outputId, outputItem]) =>
                isOutputExpanded(outputId) ? (
                    Object.entries(outputItem.channels).map(
                        ([outputChannelIndex, outputChannel]) => (
                            <ChannelMappingCell
                                key={outputChannelIndex}
                                {...{
                                    outputId,
                                    outputItem,
                                    outputChannelIndex,
                                    outputChannel,
                                    mappingDisabled,
                                    handleMap,
                                    isMapped,
                                    getConstraintWarning,
                                }}
                                inputId={null}
                                inputName="Unrouted"
                                inputChannelIndex={null}
                            />
                        )
                    )
                ) : (
                    <MatrixCell key={outputId}>
                        <HorizontalEllipsisButton disabled />
                    </MatrixCell>
                )
            )}
        </TableRow>
    );
};

const OutputsHeadRow = ({
    cornerCells,
    outputs,
    getInputAPIName,
    isOutputExpanded,
    onExpandOutput,
}) => {
    const { getCustomName } = useCustomNamesContext();
    return (
        <>
            <TableRow>
                {cornerCells}
                {outputs.map(([outputId, outputItem]) => (
                    <MappingIOColumnHeadCell
                        colSpan={
                            isOutputExpanded(outputId)
                                ? Object.keys(outputItem.channels).length
                                : 1
                        }
                        rowSpan={isOutputExpanded(outputId) ? 1 : 2}
                        key={outputId}
                    >
                        <MappingHeadTooltip
                            title={
                                <OutputTooltip
                                    {...{
                                        outputId,
                                        outputItem,
                                        getInputAPIName,
                                    }}
                                />
                            }
                            placement="top"
                            arrow
                            PopperProps={popperPropsNearer}
                        >
                            <div>
                                {getCustomName(`outputs.${outputId}.name`) ||
                                    outputItem.properties.name}
                            </div>
                        </MappingHeadTooltip>
                        <CollapseButton
                            onClick={() => onExpandOutput(outputId)}
                            isExpanded={isOutputExpanded(outputId)}
                            title={
                                isOutputExpanded(outputId)
                                    ? 'Hide channels'
                                    : 'View channels'
                            }
                        />
                    </MappingIOColumnHeadCell>
                ))}
            </TableRow>
            <TableRow>
                {outputs.map(([outputId, outputItem]) =>
                    isOutputExpanded(outputId)
                        ? Object.entries(outputItem.channels).map(
                              ([channelIndex, channel]) => (
                                  <MappingColumnHeadCell key={channelIndex}>
                                      <MappingHeadTooltip
                                          title={
                                              <ChannelTooltip
                                                  {...{
                                                      ioResource: 'outputs',
                                                      id: outputId,
                                                      channelIndex,
                                                      channelLabel:
                                                          channel.label,
                                                  }}
                                              />
                                          }
                                          placement="top"
                                          arrow
                                          PopperProps={popperPropsNearer}
                                      >
                                          <div>
                                              {getCustomName(
                                                  `outputs.${outputId}.channels.${channelIndex}`
                                              ) || channel.label}
                                          </div>
                                      </MappingHeadTooltip>
                                  </MappingColumnHeadCell>
                              )
                          )
                        : null
                )}
            </TableRow>
        </>
    );
};

const InputsRows = ({
    inputs,
    outputs,
    isOutputExpanded,
    isInputExpanded,
    onExpandInput,
    isShow,
    handleMap,
    isMapped,
    getConstraintWarning,
    showAssociations,
}) => {
    const { getCustomName } = useCustomNamesContext();
    return inputs.map(([inputId, inputItem]) => (
        <Fragment key={inputId}>
            <TableRow>
                {showAssociations && (
                    <InputParentAssociation
                        isInputExpanded={isInputExpanded(inputId)}
                        inputItem={inputItem}
                    />
                )}
                <MappingIOHeadCell
                    rowSpan={
                        isInputExpanded(inputId)
                            ? Object.keys(inputItem.channels).length
                            : 1
                    }
                    colSpan={isInputExpanded(inputId) ? 1 : 2}
                >
                    <div>
                        <MappingHeadTooltip
                            title={
                                <InputTooltip
                                    {...{
                                        inputId,
                                        inputItem,
                                    }}
                                />
                            }
                            placement="left"
                            arrow
                            PopperProps={popperPropsNearer}
                        >
                            <div>
                                {getCustomName(`inputs.${inputId}.name`) ||
                                    inputItem.properties.name}
                            </div>
                        </MappingHeadTooltip>
                        <CollapseButton
                            onClick={() => onExpandInput(inputId)}
                            isExpanded={isInputExpanded(inputId)}
                            title={
                                isInputExpanded(inputId)
                                    ? 'Hide channels'
                                    : 'View channels'
                            }
                            direction="horizontal"
                        />
                    </div>
                </MappingIOHeadCell>
                {!isInputExpanded(inputId) ? (
                    <MappingCellsForCollapsedInput
                        outputs={outputs}
                        isOutputExpanded={isOutputExpanded}
                    />
                ) : Object.keys(inputItem.channels).length >= 1 ? (
                    <InputChannelMappingCells
                        inputChannel={Object.values(inputItem.channels)[0]}
                        inputChannelIndex={Object.keys(inputItem.channels)[0]}
                        inputName={inputItem.properties.name}
                        inputId={inputId}
                        outputs={outputs}
                        isOutputExpanded={isOutputExpanded}
                        mappingDisabled={isShow}
                        handleMap={handleMap}
                        isMapped={isMapped}
                        getConstraintWarning={getConstraintWarning}
                    />
                ) : null}
            </TableRow>
            {isInputExpanded(inputId) &&
                Object.keys(inputItem.channels).length > 1 &&
                Object.entries(inputItem.channels)
                    .slice(1)
                    .map(([inputChannelIndex, inputChannel]) => (
                        <TableRow key={inputChannelIndex}>
                            <InputChannelMappingCells
                                inputChannel={inputChannel}
                                inputChannelIndex={inputChannelIndex}
                                inputName={inputItem.properties.name}
                                inputId={inputId}
                                outputs={outputs}
                                isOutputExpanded={isOutputExpanded}
                                mappingDisabled={isShow}
                                handleMap={handleMap}
                                isMapped={isMapped}
                                getConstraintWarning={getConstraintWarning}
                            />
                        </TableRow>
                    ))}
        </Fragment>
    ));
};

const InputParentHeadCells = ({ inputs, isInputExpanded }) =>
    inputs.map(([inputId, inputItem]) => (
        <MappingParentColumnHeadCell
            colSpan={
                isInputExpanded(inputId)
                    ? Object.keys(inputItem.channels).length
                    : 1
            }
            key={inputId}
        >
            {inputItem.parent.type === null ? (
                <MappingHeadTooltip
                    title={
                        <Typography variant="body2">{'No Parent'}</Typography>
                    }
                    placement="top"
                    arrow
                    PopperProps={popperPropsNearer}
                >
                    <div>{'No Parent'}</div>
                </MappingHeadTooltip>
            ) : (
                <MappingHeadTooltip
                    title={<InputParentTooltip inputItem={inputItem} />}
                    placement="top"
                    arrow
                    PopperProps={popperPropsNearer}
                >
                    <div>
                        <InputParentReferenceField
                            record={inputItem}
                            link="show"
                        >
                            <VerticalLinkChipField />
                        </InputParentReferenceField>
                    </div>
                </MappingHeadTooltip>
            )}
        </MappingParentColumnHeadCell>
    ));

const InputsHeadRows = ({
    cornerCells,
    inputs,
    isInputExpanded,
    onExpandInput,
}) => {
    const { getCustomName } = useCustomNamesContext();
    return (
        <>
            <TableRow>
                {cornerCells}
                {inputs.map(([inputId, inputItem]) => (
                    <MappingIOColumnHeadCell
                        colSpan={
                            isInputExpanded(inputId)
                                ? Object.keys(inputItem.channels).length
                                : 1
                        }
                        rowSpan={isInputExpanded(inputId) ? 1 : 2}
                        key={inputId}
                    >
                        <MappingHeadTooltip
                            title={<InputTooltip {...{ inputId, inputItem }} />}
                            placement="top"
                            arrow
                            PopperProps={popperPropsNearer}
                        >
                            <div>
                                {getCustomName(`inputs.${inputId}.name`) ||
                                    inputItem.properties.name}
                            </div>
                        </MappingHeadTooltip>
                        <CollapseButton
                            onClick={() => onExpandInput(inputId)}
                            isExpanded={isInputExpanded(inputId)}
                            title={
                                isInputExpanded(inputId)
                                    ? 'Hide channels'
                                    : 'View channels'
                            }
                        />
                    </MappingIOColumnHeadCell>
                ))}
            </TableRow>
            <TableRow>
                {inputs.map(([inputId, inputItem]) =>
                    isInputExpanded(inputId)
                        ? Object.entries(inputItem.channels).map(
                              ([channelIndex, channel]) => (
                                  <MappingColumnHeadCell key={channelIndex}>
                                      <MappingHeadTooltip
                                          title={
                                              <ChannelTooltip
                                                  {...{
                                                      ioResource: 'inputs',
                                                      id: inputId,
                                                      channelIndex,
                                                      channelLabel:
                                                          channel.label,
                                                  }}
                                              />
                                          }
                                          placement="top"
                                          arrow
                                          PopperProps={popperPropsNearer}
                                      >
                                          <div>
                                              {getCustomName(
                                                  `inputs.${inputId}.channels.${channelIndex}`
                                              ) || channel.label}
                                          </div>
                                      </MappingHeadTooltip>
                                  </MappingColumnHeadCell>
                              )
                          )
                        : null
                )}
            </TableRow>
        </>
    );
};

const OutputSourceAssociationCell = ({ isOutputExpanded, outputItem }) => (
    <MappingParentHeadCell
        rowSpan={isOutputExpanded ? Object.keys(outputItem.channels).length : 1}
    >
        {get(outputItem, 'source_id') ? (
            <MappingHeadTooltip
                title={<OutputSourceTooltip {...{ outputItem }} />}
                placement="left"
                arrow
                PopperProps={popperPropsNearer}
            >
                <div>
                    <ReferenceField
                        record={outputItem}
                        basePath="/sources"
                        label="Source"
                        source="source_id"
                        reference="sources"
                        link="show"
                    >
                        <HorizontalLinkChipField />
                    </ReferenceField>
                </div>
            </MappingHeadTooltip>
        ) : (
            <MappingHeadTooltip
                title={<Typography variant="body2">{'No Source'}</Typography>}
                placement="left"
                arrow
                PopperProps={popperPropsNearer}
            >
                <div>{'No Source'}</div>
            </MappingHeadTooltip>
        )}
    </MappingParentHeadCell>
);

const MappingCellsForCollapsedOutput = ({ inputs, isInputExpanded }) => (
    <>
        <MatrixCell>
            <VerticalEllipsisButton disabled />
        </MatrixCell>
        {inputs.map(([inputId, inputItem]) =>
            isInputExpanded(inputId) ? (
                Object.keys(inputItem.channels).map(channelIndex => (
                    <MatrixCell key={channelIndex}>
                        <VerticalEllipsisButton disabled />
                    </MatrixCell>
                ))
            ) : (
                <MatrixCell key={inputId}>
                    <DiagonalEllipsisButton disabled />
                </MatrixCell>
            )
        )}
    </>
);

const OutputChannelMappingCells = ({
    outputChannel,
    outputChannelIndex,
    outputId,
    outputItem,
    inputs,
    isInputExpanded,
    mappingDisabled,
    handleMap,
    isMapped,
    getConstraintWarning,
}) => (
    <>
        <ChannelMappingCell
            {...{
                outputId,
                outputItem,
                outputChannelIndex,
                outputChannel,
                mappingDisabled,
                handleMap,
                isMapped,
                getConstraintWarning,
            }}
            inputId={null}
            inputName="Unrouted"
            inputChannelIndex={null}
        />
        {inputs.map(([inputId, inputItem]) =>
            isInputExpanded(inputId) ? (
                Object.entries(inputItem.channels).map(
                    ([inputChannelIndex, inputChannel]) => (
                        <ChannelMappingCell
                            key={inputChannelIndex}
                            {...{
                                outputId,
                                outputItem,
                                outputChannelIndex,
                                outputChannel,
                                inputId,
                                inputChannelIndex,
                                inputChannel,
                                mappingDisabled,
                                handleMap,
                                isMapped,
                                getConstraintWarning,
                            }}
                            inputName={inputItem.properties.name}
                        />
                    )
                )
            ) : (
                <MatrixCell key={inputId}>
                    <HorizontalEllipsisButton disabled />
                </MatrixCell>
            )
        )}
    </>
);

const OutputsRows = ({
    outputs,
    inputs,
    getInputAPIName,
    isOutputExpanded,
    isInputExpanded,
    onExpandOutput,
    mappingDisabled,
    handleMap,
    isMapped,
    getConstraintWarning,
    showAssociations,
}) => {
    const { getCustomName } = useCustomNamesContext();
    return outputs.map(([outputId, outputItem]) => (
        <Fragment key={outputId}>
            <TableRow>
                {showAssociations && (
                    <OutputSourceAssociationCell
                        isOutputExpanded={isOutputExpanded(outputId)}
                        outputItem={outputItem}
                    />
                )}
                <MappingIOHeadCell
                    rowSpan={
                        isOutputExpanded(outputId)
                            ? Object.keys(outputItem.channels).length
                            : 1
                    }
                    colSpan={isOutputExpanded(outputId) ? 1 : 2}
                >
                    <div>
                        <MappingHeadTooltip
                            title={
                                <OutputTooltip
                                    {...{
                                        outputId,
                                        outputItem,
                                        getInputAPIName,
                                    }}
                                />
                            }
                            placement="left"
                            arrow
                            PopperProps={popperPropsNearer}
                        >
                            <div>
                                {getCustomName(`outputs.${outputId}.name`) ||
                                    outputItem.properties.name}
                            </div>
                        </MappingHeadTooltip>
                        <CollapseButton
                            onClick={() => onExpandOutput(outputId)}
                            isExpanded={isOutputExpanded(outputId)}
                            title={
                                isOutputExpanded(outputId)
                                    ? 'Hide channels'
                                    : 'View channels'
                            }
                            direction="horizontal"
                        />
                    </div>
                </MappingIOHeadCell>
                {!isOutputExpanded(outputId) ? (
                    <MappingCellsForCollapsedOutput
                        inputs={inputs}
                        isInputExpanded={isInputExpanded}
                    />
                ) : Object.keys(outputItem.channels).length >= 1 ? (
                    <>
                        <MappingChannelHeadCell>
                            <MappingHeadTooltip
                                title={
                                    <ChannelTooltip
                                        ioResource="outputs"
                                        id={outputId}
                                        channelIndex={
                                            Object.keys(outputItem.channels)[0]
                                        }
                                        channelLabel={
                                            Object.values(
                                                outputItem.channels
                                            )[0].label
                                        }
                                    />
                                }
                                placement="left"
                                arrow
                                PopperProps={popperPropsNearer}
                            >
                                <div>
                                    {getCustomName(
                                        `outputs.${outputId}.channels.${
                                            Object.keys(outputItem.channels)[0]
                                        }`
                                    ) ||
                                        Object.values(outputItem.channels)[0]
                                            .label}
                                </div>
                            </MappingHeadTooltip>
                        </MappingChannelHeadCell>
                        <OutputChannelMappingCells
                            outputChannel={
                                Object.values(outputItem.channels)[0]
                            }
                            outputChannelIndex={
                                Object.keys(outputItem.channels)[0]
                            }
                            {...{
                                outputId,
                                outputItem,
                                inputs,
                                isInputExpanded,
                                mappingDisabled,
                                handleMap,
                                isMapped,
                                getConstraintWarning,
                            }}
                        />
                    </>
                ) : null}
            </TableRow>
            {isOutputExpanded(outputId) &&
                Object.entries(outputItem.channels)
                    .slice(1)
                    .map(([outputChannelIndex, outputChannel]) => (
                        <TableRow key={outputChannelIndex}>
                            <MappingChannelHeadCell>
                                <MappingHeadTooltip
                                    title={
                                        <ChannelTooltip
                                            ioResource="outputs"
                                            id={outputId}
                                            channelIndex={outputChannelIndex}
                                            channelLabel={outputChannel.label}
                                        />
                                    }
                                    placement="left"
                                    arrow
                                    PopperProps={popperPropsNearer}
                                >
                                    <div>
                                        {getCustomName(
                                            `outputs.${outputId}.channels.${outputChannelIndex}`
                                        ) || outputChannel.label}
                                    </div>
                                </MappingHeadTooltip>
                            </MappingChannelHeadCell>
                            <OutputChannelMappingCells
                                {...{
                                    outputChannel,
                                    outputChannelIndex,
                                    outputId,
                                    outputItem,
                                    inputs,
                                    isInputExpanded,
                                    mappingDisabled,
                                    handleMap,
                                    isMapped,
                                    getConstraintWarning,
                                }}
                            />
                        </TableRow>
                    ))}
        </Fragment>
    ));
};

const sortedByIOName = (ioEntries, getCustomName) => {
    return ioEntries.sort((ioItem1, ioItem2) => {
        let name1 = getCustomName(ioItem1[0]) || ioItem1[1].properties.name;
        let name2 = getCustomName(ioItem2[0]) || ioItem2[1].properties.name;
        return name1.localeCompare(name2);
    });
};

export const getRenderedIOColumns = (ioResource, ioEntries, isExpanded) =>
    ioEntries.flatMap(([id, item]) =>
        isExpanded(ioResource, id)
            ? Object.keys(item.channels).map(
                  channelIndex => `${id}.${channelIndex}`
              )
            : [id]
    );

export const getMappingTableColumns = (
    inputs,
    outputs,
    isExpanded,
    swapAxes
) =>
    swapAxes
        ? ['unrouted', ...getRenderedIOColumns('inputs', inputs, isExpanded)]
        : getRenderedIOColumns('outputs', outputs, isExpanded);

export const channelMappingCornerLabels = swapAxes =>
    swapAxes
        ? { rows: 'OUTPUTS', columns: 'INPUTS' }
        : { rows: 'INPUTS', columns: 'OUTPUTS' };

export const showMappingAssociations = settings =>
    get(settings, 'parent/source headings') !== false;

const ChannelMappingMatrix = ({ record, isShow, mapping, handleMap }) => {
    const [expanded, setExpanded] = useJSONSetting('Channel Mapping Expanded', {
        inputs: [],
        outputs: [],
    });
    const isExpanded = (ioResource, id) =>
        get(expanded, ioResource).includes(id);
    const toggleExpanded = (ioResource, id) => {
        setExpanded(expanded => {
            let newExpanded = { ...expanded };
            const expandedIoResource = get(newExpanded, ioResource);
            const isExpanded = expandedIoResource.includes(id);
            const newExpandedIoResource = isExpanded
                ? expandedIoResource.filter(_ => _ !== id)
                : expandedIoResource.concat(id);
            set(newExpanded, ioResource, newExpandedIoResource);
            return newExpanded;
        });
    };

    const isMapped = (inputId, outputId, inputChannel, outputChannel) => {
        return (
            inputId === get(mapping, `${outputId}.${outputChannel}.input`) &&
            String(inputChannel) ===
                String(
                    get(mapping, `${outputId}.${outputChannel}.channel_index`)
                )
        );
    };

    const convertChannelsArraysToObjects = io => {
        for (const item of Object.values(get(io, 'outputs'))) {
            set(item, 'channels', Object.assign({}, item.channels));
        }
        for (const item of Object.values(get(io, 'inputs'))) {
            set(item, 'channels', Object.assign({}, item.channels));
        }
        return io;
    };

    const [tooltipModal, setTooltipModal] = useState(false);

    const [outputsFilter, setOutputsFilter] = useJSONSetting('Outputs Filter');
    const [inputsFilter, setInputsFilter] = useJSONSetting('Inputs Filter');
    const [settingsFilter, setSettingsFilter] = useJSONSetting(
        'Channel Mapping Settings'
    );

    const deviceId = get(record, 'id');

    const [customNames, setCustomNames] = useJSONSetting(
        'Channel Mapping Custom Names'
    );

    const getCustomName = source =>
        get(customNames, `${deviceId}.${source}`) || '';

    const setCustomName = (source, value) =>
        setCustomNames(customNames => {
            let newCustomNames = { ...customNames };
            // use setWith rather than set to avoid creating arrays if any
            // source path component is a number
            setWith(newCustomNames, `${deviceId}.${source}`, value, Object);
            return newCustomNames;
        });

    const unsetCustomName = source =>
        setCustomNames(customNames => {
            let newCustomNames = { ...customNames };
            unsetCleanly(newCustomNames, `${deviceId}.${source}`);
            return newCustomNames;
        });

    const unsetCustomNames = () =>
        setCustomNames(customNames => {
            let newCustomNames = { ...customNames };
            unsetCleanly(newCustomNames, deviceId);
            return newCustomNames;
        });

    const io = convertChannelsArraysToObjects(get(record, '$io'));
    const constraintWarnings = channelMappingConstraintWarnings(io, mapping);
    const getConstraintWarning = (
        inputId,
        outputId,
        inputChannelIndex,
        outputChannelIndex,
        outputItem
    ) => {
        if (isShow) return;
        return isMapped(
            inputId,
            outputId,
            inputChannelIndex,
            outputChannelIndex
        )
            ? get(constraintWarnings, [outputId, outputChannelIndex])
            : routableInputConstraintWarning(outputItem, inputId);
    };

    const getInputAPIName = inputId =>
        get(io, `inputs.${inputId}.properties.name`);

    const filteredInputs = Object.entries(
        getFilteredInputs(inputsFilter, get(io, 'inputs'), getCustomName)
    );
    const filteredOutputs = Object.entries(
        getFilteredOutputs(
            outputsFilter,
            get(io, 'outputs'),
            getInputAPIName,
            getCustomName
        )
    );

    const sorted = get(settingsFilter, 'auto sort');
    const swapAxes = get(settingsFilter, 'swap axes') || false;
    const showAssociations = showMappingAssociations(settingsFilter);
    const headingSections = showAssociations ? 3 : 2;

    const renderedOutputs =
        sorted === undefined || sorted
            ? sortedByIOName(filteredOutputs, outputId =>
                  getCustomName(`outputs.${outputId}.name`)
              )
            : filteredOutputs;
    const renderedInputs =
        sorted === undefined || sorted
            ? sortedByIOName(filteredInputs, inputId =>
                  getCustomName(`inputs.${inputId}.name`)
              )
            : filteredInputs;

    const mappingColumns = getMappingTableColumns(
        renderedInputs,
        renderedOutputs,
        isExpanded,
        swapAxes
    );
    const mappingTableWidth =
        headingSections * HEADING_EXTENT + mappingColumns.length * CELL_EXTENT;
    const mappingTableRef = useRef(null);
    const mappingTableMaxHeight = useTableMaxHeight(mappingTableRef);
    const cornerLabels = channelMappingCornerLabels(swapAxes);

    // the corner spans every heading section each way, so it belongs to the
    // first heading row there is, whether or not that is the association row
    const cornerCell = (
        <MappingCornerCell
            rowSpan={headingSections}
            colSpan={headingSections}
            style={{ height: headingSections * HEADING_EXTENT }}
        >
            <span style={cornerRowsLabelStyle}>{cornerLabels.rows}</span>
            <span style={cornerColumnsLabelStyle}>{cornerLabels.columns}</span>
        </MappingCornerCell>
    );
    const unroutedColumnCell = (
        <MappingColumnHeadCell rowSpan={headingSections}>
            <div>{'Unrouted'}</div>
        </MappingColumnHeadCell>
    );

    return (
        <CustomNamesContextProvider
            value={{ getCustomName, setCustomName, unsetCustomName }}
        >
            <FilterPanel
                filter={outputsFilter}
                setFilter={setOutputsFilter}
                filterButtonLabel={'Output filters'}
                noFilters
            >
                <StringFilter source="output id" />
                <StringFilter source="output name" />
                <StringFilter source="output channel label" />
                <StringFilter source="routable inputs" />
            </FilterPanel>
            <Divider light style={{ margin: '8px 0' }} />
            <FilterPanel
                filter={inputsFilter}
                setFilter={setInputsFilter}
                filterButtonLabel={'Input filters'}
                noFilters
            >
                <StringFilter source="input id" />
                <StringFilter source="input name" />
                <StringFilter source="input channel label" />
                <NumberFilter
                    source="block size"
                    InputProps={{
                        inputProps: {
                            min: 1,
                        },
                    }}
                />
                <BooleanFilter source="reordering" />
            </FilterPanel>
            <Divider light style={{ margin: '8px 0' }} />
            <FilterPanel
                filter={settingsFilter}
                setFilter={setSettingsFilter}
                filterButtonLabel={'settings'}
                allFilters={false}
            >
                <BooleanFilter source="auto sort" />
                <BooleanFilter source="swap axes" />
                <BooleanFilter
                    source="parent/source headings"
                    label="Parent/Source Headings"
                />
                <Divider />
                <MenuItem onClick={unsetCustomNames}>
                    Clear Custom Names
                </MenuItem>
            </FilterPanel>
            <MappingHeadTooltipContext.Provider
                value={{ tooltipModal, setTooltipModal }}
            >
                <MatrixTableContainer
                    ref={mappingTableRef}
                    style={{ maxHeight: mappingTableMaxHeight }}
                >
                    <Table
                        style={{
                            [PARENT_HEADING_OFFSET]: showAssociations
                                ? `${HEADING_EXTENT}px`
                                : '0px',
                            [IO_HEADING_EDGE]: showAssociations
                                ? '0'
                                : `${CELL_BORDER}px`,
                            ...matrixTableStyle(mappingTableWidth),
                        }}
                    >
                        <colgroup>
                            {showAssociations && (
                                <col style={{ width: HEADING_EXTENT }} />
                            )}
                            <col style={{ width: HEADING_EXTENT }} />
                            <col style={{ width: HEADING_EXTENT }} />
                            {mappingColumns.map(key => (
                                <col key={key} style={{ width: CELL_EXTENT }} />
                            ))}
                        </colgroup>
                        {swapAxes ? (
                            <>
                                <MatrixTableHead>
                                    {showAssociations && (
                                        <TableRow>
                                            {cornerCell}
                                            {unroutedColumnCell}
                                            <InputParentHeadCells
                                                inputs={renderedInputs}
                                                isInputExpanded={id =>
                                                    isExpanded('inputs', id)
                                                }
                                            />
                                        </TableRow>
                                    )}
                                    <InputsHeadRows
                                        cornerCells={
                                            !showAssociations && (
                                                <>
                                                    {cornerCell}
                                                    {unroutedColumnCell}
                                                </>
                                            )
                                        }
                                        inputs={renderedInputs}
                                        isInputExpanded={id =>
                                            isExpanded('inputs', id)
                                        }
                                        onExpandInput={id =>
                                            toggleExpanded('inputs', id)
                                        }
                                    />
                                </MatrixTableHead>
                                <TableBody>
                                    <OutputsRows
                                        outputs={renderedOutputs}
                                        inputs={renderedInputs}
                                        getInputAPIName={getInputAPIName}
                                        isOutputExpanded={id =>
                                            isExpanded('outputs', id)
                                        }
                                        isInputExpanded={id =>
                                            isExpanded('inputs', id)
                                        }
                                        onExpandOutput={id =>
                                            toggleExpanded('outputs', id)
                                        }
                                        mappingDisabled={isShow}
                                        handleMap={handleMap}
                                        isMapped={isMapped}
                                        getConstraintWarning={
                                            getConstraintWarning
                                        }
                                        showAssociations={showAssociations}
                                    />
                                </TableBody>
                            </>
                        ) : (
                            <>
                                <MatrixTableHead>
                                    {showAssociations && (
                                        <TableRow>
                                            {cornerCell}
                                            <OutputSourceAssociation
                                                outputs={renderedOutputs}
                                                isExpanded={id =>
                                                    isExpanded('outputs', id)
                                                }
                                            />
                                        </TableRow>
                                    )}
                                    <OutputsHeadRow
                                        cornerCells={
                                            !showAssociations && cornerCell
                                        }
                                        outputs={renderedOutputs}
                                        getInputAPIName={getInputAPIName}
                                        isOutputExpanded={id =>
                                            isExpanded('outputs', id)
                                        }
                                        onExpandOutput={id =>
                                            toggleExpanded('outputs', id)
                                        }
                                    />
                                </MatrixTableHead>
                                <TableBody>
                                    <UnroutedRow
                                        outputs={renderedOutputs}
                                        headingSections={headingSections}
                                        mappingDisabled={isShow}
                                        handleMap={handleMap}
                                        isMapped={isMapped}
                                        getConstraintWarning={
                                            getConstraintWarning
                                        }
                                        isOutputExpanded={id =>
                                            isExpanded('outputs', id)
                                        }
                                    />
                                    <InputsRows
                                        inputs={renderedInputs}
                                        outputs={renderedOutputs}
                                        isOutputExpanded={id =>
                                            isExpanded('outputs', id)
                                        }
                                        isInputExpanded={id =>
                                            isExpanded('inputs', id)
                                        }
                                        onExpandInput={id =>
                                            toggleExpanded('inputs', id)
                                        }
                                        isShow={isShow}
                                        handleMap={handleMap}
                                        isMapped={isMapped}
                                        getConstraintWarning={
                                            getConstraintWarning
                                        }
                                        showAssociations={showAssociations}
                                    />
                                </TableBody>
                            </>
                        )}
                    </Table>
                </MatrixTableContainer>
            </MappingHeadTooltipContext.Provider>
        </CustomNamesContextProvider>
    );
};

export default ChannelMappingMatrix;
