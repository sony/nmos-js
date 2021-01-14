import { Fragment, useState } from 'react';
import {
    Divider,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
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
import get from 'lodash/get';
import set from 'lodash/set';
import LinkChipField from '../../components/LinkChipField';
import MappingButton from '../../components/MappingButton';
import CollapseButton from '../../components/CollapseButton';
import FilterPanel, {
    BooleanFilter,
    GroupFilter,
    NumberFilter,
    StringFilter,
} from '../../components/FilterPanel';
import {
    EditableChannelLabelField,
    EditableIONameField,
} from './EditMatrixNamesField';
import { useJSONSetting } from '../../settings';
import labelize from '../../components/labelize';
import { getFilteredInputs, getFilteredOutputs } from './FilterMatrix';

// passing variant="head" doesn't seem to work inside TableBody
const TableHeadCell = props => <TableCell component="th" {...props} />;

const mappingCellStyle = theme => ({
    textAlign: 'center',
    padding: '1px 2px',
    border: `solid 1px ${
        theme.palette.type === 'dark' ? '#515151' : '#e0e0e0'
    }`,
});

const mappingHeadStyle = theme => ({
    backgroundColor: theme.palette.type === 'dark' ? '#212121' : '#f5f5f5',
});

const MappingCell = withStyles(theme => ({
    root: mappingCellStyle(theme),
}))(TableCell);

// for column and row headings
const MappingHeadCell = withStyles(theme => ({
    root: {
        ...mappingCellStyle(theme),
        ...mappingHeadStyle(theme),
    },
}))(TableHeadCell);

const MappingCornerCell = withStyles(theme => ({
    root: {
        ...mappingCellStyle(theme),
        borderLeft: 0,
        borderTop: 0,
    },
}))(TableHeadCell);

// Midline Horizontal Ellipsis for when columns have been collapsed
const HorizontalEllipsisButton = props => (
    <IconButton size="small" children={'\u22ef'} {...props} />
);

// Vertical Ellipsis for when rows have been collapsed
const VerticalEllipsisButton = props => (
    <IconButton size="small" disabled children={'\u22ee'} {...props} />
);

// Down Right Diagonal Ellipsis for when both rows and columnns have been collapsed
const DiagonalEllipsisButton = props => (
    <IconButton size="small" disabled children={'\u22f1'} {...props} />
);

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
        backgroundColor: 'rgb(192, 192, 192)',
    },
})(Divider);

const InteractiveTooltip = ({
    getTooltip,
    display,
    tooltipOpen,
    setTooltipOpen,
}) => {
    const [displayEditTextField, setDisplayEditTextField] = useState(false);
    const [open, setOpen] = useState(false);
    const handleClose = () => {
        if (open && !displayEditTextField) {
            setOpen(false);
            setTooltipOpen(false);
        }
    };

    const handleOpen = () => {
        if (!tooltipOpen) {
            setOpen(true);
            setTooltipOpen(true);
        }
    };

    return (
        <Tooltip
            open={open}
            interactive
            title={getTooltip(displayEditTextField, setDisplayEditTextField)}
            placement="bottom"
            onOpen={handleOpen}
            onClose={handleClose}
        >
            <div>{display()}</div>
        </Tooltip>
    );
};

const getOutputTooltip = (
    outputId,
    outputItem,
    io,
    customNames,
    setCustomNames,
    deviceID,
    displayEditTextField,
    setDisplayEditTextField
) => (
    <>
        {'ID'}
        <Typography variant="body2">{outputId}</Typography>
        {'Name'}
        <EditableIONameField
            customNames={customNames}
            setCustomNames={setCustomNames}
            source={outputId}
            defaultValue={outputItem.properties.name}
            ioKey={'outputs'}
            deviceID={deviceID}
            displayEditTextField={displayEditTextField}
            setDisplayEditTextField={setDisplayEditTextField}
        />
        {getCustomName(outputId, 'outputs', customNames, deviceID) && (
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
                              : getCustomName(
                                    inputId,
                                    'inputs',
                                    customNames,
                                    deviceID
                                ) ||
                                get(io, `inputs.${inputId}.properties.name`)
                      )
                      .join(', ')
                : 'No Constraints'}
        </Typography>
    </>
);

const getInputTooltip = (
    inputId,
    inputItem,
    customNames,
    setCustomNames,
    deviceID,
    displayEditTextField,
    setDisplayEditTextField
) => (
    <>
        {'ID'}
        <Typography variant="body2">{inputId}</Typography>
        {'Name'}
        <EditableIONameField
            customNames={customNames}
            setCustomNames={setCustomNames}
            source={inputId}
            defaultValue={inputItem.properties.name}
            ioKey={'inputs'}
            deviceID={deviceID}
            displayEditTextField={displayEditTextField}
            setDisplayEditTextField={setDisplayEditTextField}
        />
        {getCustomName(inputId, 'inputs', customNames, deviceID) && (
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
            {get(inputItem, 'caps.reordering') ? <DoneIcon /> : <ClearIcon />}
        </Typography>
    </>
);

const getChannelTooltip = (
    id,
    channelLabel,
    channelIndex,
    ioKey,
    customNames,
    setCustomNames,
    deviceID,
    displayEditTextField,
    setDisplayEditTextField
) => (
    <>
        {'Label'}
        <EditableChannelLabelField
            customNames={customNames}
            setCustomNames={setCustomNames}
            source={id}
            defaultValue={channelLabel}
            channelIndex={channelIndex}
            ioKey={ioKey}
            deviceID={deviceID}
            displayEditTextField={displayEditTextField}
            setDisplayEditTextField={setDisplayEditTextField}
        />
        {getCustomChannelLabel(
            id,
            ioKey,
            channelIndex,
            customNames,
            deviceID
        ) && (
            <>
                {'API Label'}
                <Typography variant="body2">{channelLabel}</Typography>
            </>
        )}
    </>
);

const getMappedCellTooltip = (
    outputName,
    customOutputName,
    outputChannelLabel,
    customOutputChannelLabel,
    inputName,
    customInputName,
    inputChannelLabel,
    customInputChannelLabel
) => (
    <>
        {'Input'}
        <Typography variant="body2">
            {customInputName || inputName}
            {inputName !== 'Unrouted' ? ' - ' : ''}
            {customInputChannelLabel || inputChannelLabel}
        </Typography>
        {'Output'}
        <Typography variant="body2">
            {customOutputName || outputName}
            {' - '}
            {customOutputChannelLabel || outputChannelLabel}
        </Typography>
    </>
);

const truncateValueAtLength = (value, maxLength) => {
    const ellipsis = '\u2026';
    return maxLength !== undefined &&
        !isNaN(maxLength) &&
        value.length > maxLength
        ? value.substring(0, maxLength) + ellipsis
        : value;
};

export const getCustomName = (id, ioKey, customNames, deviceID) => {
    return get(customNames, `${deviceID}.${ioKey}.${id}.name`) || '';
};

export const getCustomChannelLabel = (
    id,
    ioKey,
    channelIndex,
    customNames,
    deviceID
) => {
    return (
        get(
            customNames,
            `${deviceID}.${ioKey}.${id}.channels.${channelIndex}`
        ) || ''
    );
};

const getOutputSourceTooltip = outputItem => (
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

const OutputSourceAssociation = ({
    outputs,
    isExpanded,
    truncateValue,
    tooltipOpen,
}) =>
    outputs.map(([outputId, outputItem]) => (
        <MappingHeadCell
            colSpan={
                isExpanded(outputId)
                    ? Object.keys(outputItem.channels).length
                    : 1
            }
            key={outputId}
        >
            {get(outputItem, 'source_id') ? (
                <Tooltip
                    disableHoverListener={tooltipOpen}
                    interactive
                    title={getOutputSourceTooltip(outputItem)}
                    placement="bottom"
                    link="true"
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
                            <LinkChipField transform={truncateValue} />
                        </ReferenceField>
                    </div>
                </Tooltip>
            ) : (
                <Tooltip
                    disableHoverListener={tooltipOpen}
                    title={
                        <Typography variant="body2">{'No Source'}</Typography>
                    }
                    placement="bottom"
                >
                    <div>{truncateValue('No Source')}</div>
                </Tooltip>
            )}
        </MappingHeadCell>
    ));

const getInputParentTypeTooltip = (type, inputItem) => (
    <>
        {'Parent ' + labelize(type)}
        <Typography />
        {type === 'source' ? (
            <ReferenceField
                record={inputItem}
                basePath="/sources"
                label="Source"
                source="parent.id"
                reference="sources"
                link="show"
            >
                <LinkChipField />
            </ReferenceField>
        ) : (
            <ReferenceField
                record={inputItem}
                basePath="/receivers"
                label="Receiver"
                source="parent.id"
                reference="receivers"
                link="show"
            >
                <LinkChipField />
            </ReferenceField>
        )}
    </>
);

const InputParentAssociation = ({
    isRowExpanded,
    inputItem,
    truncateValue,
    tooltipOpen,
}) => (
    <MappingHeadCell
        rowSpan={isRowExpanded ? Object.keys(inputItem.channels).length : 1}
    >
        {inputItem.parent.type === null ? (
            <Tooltip
                disableHoverListener={tooltipOpen}
                title={<Typography variant="body2">{'No Parent'}</Typography>}
                placement="bottom"
            >
                <div>{truncateValue('No Parent')}</div>
            </Tooltip>
        ) : (
            <Tooltip
                disableHoverListener={tooltipOpen}
                interactive
                title={getInputParentTypeTooltip(
                    inputItem.parent.type,
                    inputItem
                )}
                placement="bottom"
                link="true"
            >
                <div>
                    {inputItem.parent.type === 'source' ? (
                        <ReferenceField
                            record={inputItem}
                            basePath="/sources"
                            label="Source"
                            source="parent.id"
                            reference="sources"
                            link="show"
                        >
                            <LinkChipField transform={truncateValue} />
                        </ReferenceField>
                    ) : (
                        <ReferenceField
                            record={inputItem}
                            basePath="/receivers"
                            label="Receiver"
                            source="parent.id"
                            reference="receivers"
                            link="show"
                        >
                            <LinkChipField transform={truncateValue} />
                        </ReferenceField>
                    )}
                </div>
            </Tooltip>
        )}
    </MappingHeadCell>
);

const EmptyCellsForCollapsedRow = ({ outputs, isColExpanded }) =>
    outputs.map(([outputId, outputItem]) =>
        isColExpanded(outputId) ? (
            Object.entries(outputItem.channels).map(([channelIndex, _]) => (
                <MappingCell key={channelIndex}>
                    <VerticalEllipsisButton disabled />
                </MappingCell>
            ))
        ) : (
            <MappingCell key={outputId}>
                <DiagonalEllipsisButton disabled />
            </MappingCell>
        )
    );

const InputChannelMappingCells = ({
    inputChannel,
    inputChannelIndex,
    inputName,
    inputId,
    outputs,
    isColExpanded,
    mappingDisabled,
    handleMap,
    isMapped,
    truncateValue,
    customNames,
    setCustomNames,
    deviceID,
    tooltipOpen,
    setTooltipOpen,
}) => (
    <>
        <MappingHeadCell key={inputChannelIndex}>
            <InteractiveTooltip
                getTooltip={(displayEditTextField, setDisplayEditTextField) =>
                    getChannelTooltip(
                        inputId,
                        inputChannel.label,
                        inputChannelIndex,
                        'inputs',
                        customNames,
                        setCustomNames,
                        deviceID,
                        displayEditTextField,
                        setDisplayEditTextField
                    )
                }
                display={() =>
                    truncateValue(
                        getCustomChannelLabel(
                            inputId,
                            'inputs',
                            inputChannelIndex,
                            customNames,
                            deviceID
                        ) || inputChannel.label
                    )
                }
                tooltipOpen={tooltipOpen}
                setTooltipOpen={setTooltipOpen}
            />
        </MappingHeadCell>
        <>
            {outputs.map(([outputId, outputItem]) =>
                isColExpanded(outputId) ? (
                    Object.entries(outputItem.channels).map(
                        ([outputChannelIndex, outputChannel]) => (
                            <MappingCell key={outputChannelIndex}>
                                <Tooltip
                                    disableHoverListener={tooltipOpen}
                                    title={getMappedCellTooltip(
                                        outputItem.properties.name,
                                        getCustomName(
                                            outputId,
                                            'outputs',
                                            customNames,
                                            deviceID
                                        ),
                                        outputChannel.label,
                                        getCustomChannelLabel(
                                            outputId,
                                            'outputs',
                                            outputChannelIndex,
                                            customNames,
                                            deviceID
                                        ),
                                        inputName,
                                        getCustomName(
                                            inputId,
                                            'inputs',
                                            customNames,
                                            deviceID
                                        ),
                                        inputChannel.label,
                                        getCustomChannelLabel(
                                            inputId,
                                            'inputs',
                                            inputChannelIndex,
                                            customNames,
                                            deviceID
                                        )
                                    )}
                                    placement="bottom"
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
                                            isMapped={isMapped(
                                                inputId,
                                                outputId,
                                                inputChannelIndex,
                                                outputChannelIndex
                                            )}
                                        />
                                    </div>
                                </Tooltip>
                            </MappingCell>
                        )
                    )
                ) : (
                    <MappingCell key={outputId}>
                        <HorizontalEllipsisButton disabled />
                    </MappingCell>
                )
            )}
        </>
    </>
);

const UnroutedRow = ({
    outputs,
    mappingDisabled,
    handleMap,
    isMapped,
    isColExpanded,
    customNames,
    deviceID,
    tooltipOpen,
}) => (
    <TableRow>
        <MappingHeadCell colSpan={3}>{'Unrouted'}</MappingHeadCell>
        {outputs.map(([outputId, outputItem]) =>
            isColExpanded(outputId) ? (
                Object.entries(outputItem.channels).map(
                    ([channelIndex, channel]) => (
                        <MappingCell key={channelIndex}>
                            <Tooltip
                                disableHoverListener={tooltipOpen}
                                title={getMappedCellTooltip(
                                    outputItem.properties.name,
                                    getCustomName(
                                        outputId,
                                        'outputs',
                                        customNames,
                                        deviceID
                                    ),
                                    channel.label,
                                    getCustomChannelLabel(
                                        outputId,
                                        'outputs',
                                        channelIndex,
                                        customNames,
                                        deviceID
                                    ),
                                    'Unrouted'
                                )}
                                placement="bottom"
                            >
                                <div>
                                    <MappingButton
                                        disabled={mappingDisabled}
                                        onClick={() =>
                                            handleMap(
                                                null,
                                                outputId,
                                                null,
                                                channelIndex
                                            )
                                        }
                                        isMapped={isMapped(
                                            null,
                                            outputId,
                                            null,
                                            channelIndex
                                        )}
                                    />
                                </div>
                            </Tooltip>
                        </MappingCell>
                    )
                )
            ) : (
                <MappingCell key={outputId}>
                    <HorizontalEllipsisButton disabled />
                </MappingCell>
            )
        )}
    </TableRow>
);

const OutputsHeadRow = ({
    outputs,
    io,
    isColExpanded,
    handleExpandCol,
    truncateValue,
    customNames,
    setCustomNames,
    deviceID,
    tooltipOpen,
    setTooltipOpen,
}) => (
    <>
        <TableRow>
            {outputs.map(([outputId, outputItem]) => (
                <MappingHeadCell
                    colSpan={
                        isColExpanded(outputId)
                            ? Object.keys(outputItem.channels).length
                            : 1
                    }
                    rowSpan={isColExpanded(outputId) ? 1 : 2}
                    key={outputId}
                >
                    <CollapseButton
                        onClick={() => handleExpandCol(outputId)}
                        isExpanded={isColExpanded(outputId)}
                        title={
                            isColExpanded(outputId)
                                ? 'Hide channels'
                                : 'View channels'
                        }
                    />
                    <InteractiveTooltip
                        getTooltip={(
                            displayEditTextField,
                            setDisplayEditTextField
                        ) =>
                            getOutputTooltip(
                                outputId,
                                outputItem,
                                io,
                                customNames,
                                setCustomNames,
                                deviceID,
                                displayEditTextField,
                                setDisplayEditTextField
                            )
                        }
                        display={() =>
                            truncateValue(
                                getCustomName(
                                    outputId,
                                    'outputs',
                                    customNames,
                                    deviceID
                                ) || outputItem.properties.name
                            )
                        }
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
                    />
                </MappingHeadCell>
            ))}
        </TableRow>
        <TableRow>
            {outputs.map(([outputId, outputItem]) =>
                isColExpanded(outputId)
                    ? Object.entries(outputItem.channels).map(
                          ([channelIndex, channel]) => (
                              <MappingHeadCell key={channelIndex}>
                                  <InteractiveTooltip
                                      getTooltip={(
                                          displayEditTextField,
                                          setDisplayEditTextField
                                      ) =>
                                          getChannelTooltip(
                                              outputId,
                                              channel.label,
                                              channelIndex,
                                              'outputs',
                                              customNames,
                                              setCustomNames,
                                              deviceID,
                                              displayEditTextField,
                                              setDisplayEditTextField
                                          )
                                      }
                                      display={() =>
                                          truncateValue(
                                              getCustomChannelLabel(
                                                  outputId,
                                                  'outputs',
                                                  channelIndex,
                                                  customNames,
                                                  deviceID
                                              ) || channel.label
                                          )
                                      }
                                      tooltipOpen={tooltipOpen}
                                      setTooltipOpen={setTooltipOpen}
                                  />
                              </MappingHeadCell>
                          )
                      )
                    : null
            )}
        </TableRow>
    </>
);

const InputsRows = ({
    inputs,
    outputs,
    isColExpanded,
    isRowExpanded,
    handleExpandRow,
    isShow,
    handleMap,
    isMapped,
    truncateValue,
    customNames,
    setCustomNames,
    deviceID,
    tooltipOpen,
    setTooltipOpen,
}) =>
    inputs.map(([inputId, inputItem]) => (
        <Fragment key={inputId}>
            <TableRow>
                <InputParentAssociation
                    isRowExpanded={isRowExpanded(inputId)}
                    inputItem={inputItem}
                    truncateValue={truncateValue}
                    tooltipOpen={tooltipOpen}
                />
                <MappingHeadCell
                    rowSpan={
                        isRowExpanded(inputId)
                            ? Object.keys(inputItem.channels).length
                            : 1
                    }
                    colSpan={isRowExpanded(inputId) ? 1 : 2}
                >
                    <CollapseButton
                        onClick={() => handleExpandRow(inputId)}
                        isExpanded={isRowExpanded(inputId)}
                        title={
                            isRowExpanded(inputId)
                                ? 'Hide channels'
                                : 'View channels'
                        }
                        direction="horizontal"
                    />
                    <InteractiveTooltip
                        getTooltip={(
                            displayEditTextField,
                            setDisplayEditTextField
                        ) =>
                            getInputTooltip(
                                inputId,
                                inputItem,
                                customNames,
                                setCustomNames,
                                deviceID,
                                displayEditTextField,
                                setDisplayEditTextField
                            )
                        }
                        display={() =>
                            truncateValue(
                                getCustomName(
                                    inputId,
                                    'inputs',
                                    customNames,
                                    deviceID
                                ) || inputItem.properties.name
                            )
                        }
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
                    />
                </MappingHeadCell>
                {!isRowExpanded(inputId) ? (
                    <EmptyCellsForCollapsedRow
                        outputs={outputs}
                        isColExpanded={isColExpanded}
                    />
                ) : Object.keys(inputItem.channels).length >= 1 ? (
                    <InputChannelMappingCells
                        inputChannel={Object.values(inputItem.channels)[0]}
                        inputChannelIndex={Object.keys(inputItem.channels)[0]}
                        inputName={inputItem.properties.name}
                        inputId={inputId}
                        outputs={outputs}
                        isColExpanded={isColExpanded}
                        mappingDisabled={isShow}
                        handleMap={handleMap}
                        isMapped={isMapped}
                        truncateValue={truncateValue}
                        customNames={customNames}
                        setCustomNames={setCustomNames}
                        deviceID={deviceID}
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
                    />
                ) : null}
            </TableRow>
            {isRowExpanded(inputId) &&
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
                                isColExpanded={isColExpanded}
                                mappingDisabled={isShow}
                                handleMap={handleMap}
                                isMapped={isMapped}
                                truncateValue={truncateValue}
                                customNames={customNames}
                                setCustomNames={setCustomNames}
                                deviceID={deviceID}
                                tooltipOpen={tooltipOpen}
                                setTooltipOpen={setTooltipOpen}
                            />
                        </TableRow>
                    ))}
        </Fragment>
    ));

const sortByIOName = (ioObject, getCustomName) => {
    return Object.entries(ioObject).sort((ioItem1, ioItem2) => {
        let name1 = getCustomName(ioItem1[0]) || ioItem1[1].properties.name;
        let name2 = getCustomName(ioItem2[0]) || ioItem2[1].properties.name;
        return name1.localeCompare(name2);
    });
};

const ChannelMappingMatrix = ({ record, isShow, mapping, handleMap }) => {
    const [expandedCols, setExpandedCols] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const [tooltipOpen, setTooltipOpen] = useState(false);
    const handleExpandRow = inputId => {
        const currentExpandedRows = expandedRows;
        const isRowExpanded = currentExpandedRows.includes(inputId);
        const newExpandedRows = isRowExpanded
            ? currentExpandedRows.filter(id => id !== inputId)
            : currentExpandedRows.concat(inputId);
        setExpandedRows(newExpandedRows);
    };
    const handleExpandCol = outputId => {
        const currentExpandedCols = expandedCols;
        const isColExpanded = currentExpandedCols.includes(outputId);
        const newExpandedCols = isColExpanded
            ? currentExpandedCols.filter(id => id !== outputId)
            : currentExpandedCols.concat(outputId);
        setExpandedCols(newExpandedCols);
    };
    const isRowExpanded = inputId => expandedRows.includes(inputId);
    const isColExpanded = outputId => expandedCols.includes(outputId);
    const isMapped = (inputId, outputId, inputChannel, outputChannel) => {
        return (
            inputId === get(mapping, `${outputId}.${outputChannel}.input`) &&
            String(inputChannel) ===
                String(
                    get(mapping, `${outputId}.${outputChannel}.channel_index`)
                )
        );
    };
    const convertChannelsArrayToObject = () => {
        for (const item of Object.values(get(io, 'outputs'))) {
            set(item, 'channels', Object.assign({}, item.channels));
        }
        for (const item of Object.values(get(io, 'inputs'))) {
            set(item, 'channels', Object.assign({}, item.channels));
        }
    };

    const [outputsFilter, setOutputsFilter] = useJSONSetting('outputs Filter');
    const [inputsFilter, setInputsFilter] = useJSONSetting('inputs Filter');
    const [settingsFilter, setSettingsFilter] = useJSONSetting(
        'matrix settings Filter'
    );
    const [customNames, setCustomNames] = useJSONSetting(
        'channel mapping personal names'
    );
    const io = get(record, '$io');
    convertChannelsArrayToObject();
    const filterGroup = get(settingsFilter, 'filter group');
    const maxLength = get(settingsFilter, 'limit label length');
    const truncateValue = value => truncateValueAtLength(value, maxLength);
    let filter_inputs = getFilteredInputs(
        inputsFilter,
        filterGroup,
        customNames,
        get(io, `inputs`),
        get(record, `id`)
    );
    let filter_outputs = getFilteredOutputs(
        outputsFilter,
        inputId => get(io, `inputs.${inputId}.properties.name`),
        filterGroup,
        customNames,
        get(io, `outputs`),
        get(record, `id`)
    );

    const sorted_outputs = sortByIOName(filter_outputs, id =>
        getCustomName(id, 'outputs', customNames)
    );
    const sorted_inputs = sortByIOName(filter_inputs, id =>
        getCustomName(id, 'inputs', customNames)
    );

    return (
        <>
            <FilterPanel
                filter={outputsFilter}
                setFilter={setOutputsFilter}
                filterButtonLabel={'Add output filter'}
            >
                <StringFilter source="output id" />
                <StringFilter source="output name" />
                <StringFilter source="output channel label" />
                <StringFilter source="routable inputs" />
            </FilterPanel>
            <FilterPanel
                filter={inputsFilter}
                setFilter={setInputsFilter}
                filterButtonLabel={'Add input filter'}
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
            <FilterPanel
                filter={settingsFilter}
                setFilter={setSettingsFilter}
                filterButtonLabel={'settings'}
            >
                <NumberFilter
                    source="limit label length"
                    InputProps={{
                        inputProps: {
                            min: 1,
                        },
                    }}
                />
                <GroupFilter source="filter group" />
            </FilterPanel>
            <Table>
                <TableHead>
                    <TableRow>
                        <MappingCornerCell rowSpan={3} colSpan={3}>
                            {'INPUTS \\ OUTPUTS'}
                        </MappingCornerCell>
                        <OutputSourceAssociation
                            outputs={sorted_outputs}
                            isExpanded={outputId => isColExpanded(outputId)}
                            truncateValue={truncateValue}
                            tooltipOpen={tooltipOpen}
                        />
                    </TableRow>
                    <OutputsHeadRow
                        outputs={sorted_outputs}
                        io={io}
                        isColExpanded={outputId => isColExpanded(outputId)}
                        handleExpandCol={handleExpandCol}
                        truncateValue={truncateValue}
                        customNames={customNames}
                        setCustomNames={setCustomNames}
                        deviceID={get(record, `id`)}
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
                    />
                </TableHead>
                <TableBody>
                    <UnroutedRow
                        outputs={sorted_outputs}
                        mappingDisabled={isShow}
                        handleMap={handleMap}
                        isMapped={isMapped}
                        isColExpanded={outputId => isColExpanded(outputId)}
                        customNames={customNames}
                        deviceID={get(record, `id`)}
                        tooltipOpen={tooltipOpen}
                    />
                    <InputsRows
                        inputs={sorted_inputs}
                        outputs={sorted_outputs}
                        isColExpanded={outputId => isColExpanded(outputId)}
                        isRowExpanded={inputId => isRowExpanded(inputId)}
                        handleExpandRow={handleExpandRow}
                        isShow={isShow}
                        handleMap={handleMap}
                        isMapped={isMapped}
                        truncateValue={truncateValue}
                        customNames={customNames}
                        setCustomNames={setCustomNames}
                        deviceID={get(record, `id`)}
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
                    />
                </TableBody>
            </Table>
        </>
    );
};

export default ChannelMappingMatrix;
