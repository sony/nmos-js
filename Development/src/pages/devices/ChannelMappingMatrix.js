import { Fragment, useState } from 'react';
import {
    ClickAwayListener,
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
import { get, set } from 'lodash';
import LinkChipField from '../../components/LinkChipField';
import MappingButton from '../../components/MappingButton';
import CollapseButton from '../../components/CollapseButton';
import FilterPanel, {
    BooleanFilter,
    FilterMode,
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

// de-emphasize these icons
const faded = { opacity: 0.3 };

// Midline Horizontal Ellipsis for when columns have been collapsed
const HorizontalEllipsisButton = props => (
    <IconButton size="small" style={faded} children={'\u22ef'} {...props} />
);

// Vertical Ellipsis for when rows have been collapsed
const VerticalEllipsisButton = props => (
    <IconButton size="small" style={faded} children={'\u22ee'} {...props} />
);

// Down Right Diagonal Ellipsis for when both rows and columnns have been collapsed
const DiagonalEllipsisButton = props => (
    <IconButton size="small" style={faded} children={'\u22f1'} {...props} />
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
    children,
    getTooltip,
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

    const handleClickAway = () => {
        if (displayEditTextField && tooltipOpen && open) {
            setOpen(false);
            setTooltipOpen(false);
            setDisplayEditTextField(false);
        }
    };

    return (
        <ClickAwayListener onClickAway={handleClickAway}>
            <div>
                <Tooltip
                    open={open}
                    interactive
                    title={getTooltip(
                        displayEditTextField,
                        setDisplayEditTextField
                    )}
                    placement="bottom"
                    onOpen={handleOpen}
                    onClose={handleClose}
                >
                    {children}
                </Tooltip>
            </div>
        </ClickAwayListener>
    );
};

const OutputTooltip = ({
    deviceId,
    outputId,
    outputItem,
    io,
    customNames,
    setCustomNames,
    displayEditTextField,
    setDisplayEditTextField,
}) => (
    <>
        {'ID'}
        <Typography variant="body2">{outputId}</Typography>
        {'Name'}
        <EditableIONameField
            {...{
                deviceId,
                ioResource: 'outputs',
                source: outputId,
                defaultValue: outputItem.properties.name,
                customNames,
                setCustomNames,
                displayEditTextField,
                setDisplayEditTextField,
            }}
        />
        {getCustomName(customNames, deviceId, 'outputs', outputId) && (
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
                                    customNames,
                                    deviceId,
                                    'inputs',
                                    inputId
                                ) ||
                                get(io, `inputs.${inputId}.properties.name`)
                      )
                      .join(', ')
                : 'No Constraints'}
        </Typography>
    </>
);

const InputTooltip = ({
    deviceId,
    inputId,
    inputItem,
    customNames,
    setCustomNames,
    displayEditTextField,
    setDisplayEditTextField,
}) => (
    <>
        {'ID'}
        <Typography variant="body2">{inputId}</Typography>
        {'Name'}
        <EditableIONameField
            customNames={customNames}
            setCustomNames={setCustomNames}
            source={inputId}
            defaultValue={inputItem.properties.name}
            ioResource={'inputs'}
            deviceId={deviceId}
            displayEditTextField={displayEditTextField}
            setDisplayEditTextField={setDisplayEditTextField}
        />
        {getCustomName(customNames, deviceId, 'inputs', inputId) && (
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

const ChannelTooltip = ({
    deviceId,
    ioResource,
    id,
    channelIndex,
    channelLabel,
    customNames,
    setCustomNames,
    displayEditTextField,
    setDisplayEditTextField,
}) => (
    <>
        {'Label'}
        <EditableChannelLabelField
            customNames={customNames}
            setCustomNames={setCustomNames}
            source={id}
            defaultValue={channelLabel}
            channelIndex={channelIndex}
            ioResource={ioResource}
            deviceId={deviceId}
            displayEditTextField={displayEditTextField}
            setDisplayEditTextField={setDisplayEditTextField}
        />
        {getCustomChannelLabel(
            customNames,
            deviceId,
            ioResource,
            id,
            channelIndex
        ) && (
            <>
                {'API Label'}
                <Typography variant="body2">{channelLabel}</Typography>
            </>
        )}
    </>
);

const MappedCellTooltip = ({
    outputName,
    outputChannelLabel,
    inputName,
    inputChannelLabel,
}) => (
    <>
        {'Input'}
        <Typography variant="body2">
            {inputName}
            {inputChannelLabel ? ' - ' : ''}
            {inputChannelLabel}
        </Typography>
        {'Output'}
        <Typography variant="body2">
            {outputName}
            {outputChannelLabel ? ' - ' : ''}
            {outputChannelLabel}
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

export const getCustomName = (customNames, deviceId, ioResource, id) => {
    return get(customNames, `${deviceId}.${ioResource}.${id}.name`) || '';
};

export const getCustomChannelLabel = (
    customNames,
    deviceId,
    ioResource,
    id,
    channelIndex
) => {
    return (
        get(
            customNames,
            `${deviceId}.${ioResource}.${id}.channels.${channelIndex}`
        ) || ''
    );
};

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
                    title={<OutputSourceTooltip outputItem={outputItem} />}
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

const InputParentAssociation = ({
    isInputExpanded,
    inputItem,
    truncateValue,
    tooltipOpen,
}) => (
    <MappingHeadCell
        rowSpan={isInputExpanded ? Object.keys(inputItem.channels).length : 1}
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
                title={<InputParentTooltip inputItem={inputItem} />}
                placement="bottom"
                link="true"
            >
                <div>
                    <InputParentReferenceField record={inputItem} link="show">
                        <LinkChipField transform={truncateValue} />
                    </InputParentReferenceField>
                </div>
            </Tooltip>
        )}
    </MappingHeadCell>
);

const MappingCellsForCollapsedInput = ({ outputs, isOutputExpanded }) =>
    outputs.map(([outputId, outputItem]) =>
        isOutputExpanded(outputId) ? (
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
    isOutputExpanded,
    mappingDisabled,
    handleMap,
    isMapped,
    truncateValue,
    customNames,
    setCustomNames,
    deviceId,
    tooltipOpen,
    setTooltipOpen,
}) => (
    <>
        <MappingHeadCell key={inputChannelIndex}>
            <InteractiveTooltip
                getTooltip={(displayEditTextField, setDisplayEditTextField) => (
                    <ChannelTooltip
                        {...{
                            deviceId,
                            ioResource: 'inputs',
                            id: inputId,
                            channelIndex: inputChannelIndex,
                            channelLabel: inputChannel.label,
                            customNames,
                            setCustomNames,
                            displayEditTextField,
                            setDisplayEditTextField,
                        }}
                    />
                )}
                tooltipOpen={tooltipOpen}
                setTooltipOpen={setTooltipOpen}
            >
                <div>
                    {truncateValue(
                        getCustomChannelLabel(
                            customNames,
                            deviceId,
                            'inputs',
                            inputId,
                            inputChannelIndex
                        ) || inputChannel.label
                    )}
                </div>
            </InteractiveTooltip>
        </MappingHeadCell>
        <>
            {outputs.map(([outputId, outputItem]) =>
                isOutputExpanded(outputId) ? (
                    Object.entries(outputItem.channels).map(
                        ([outputChannelIndex, outputChannel]) => (
                            <MappingCell key={outputChannelIndex}>
                                <Tooltip
                                    disableHoverListener={tooltipOpen}
                                    title={
                                        <MappedCellTooltip
                                            outputName={
                                                getCustomName(
                                                    customNames,
                                                    deviceId,
                                                    'outputs',
                                                    outputId
                                                ) || outputItem.properties.name
                                            }
                                            outputChannelLabel={
                                                getCustomChannelLabel(
                                                    customNames,
                                                    deviceId,
                                                    'outputs',
                                                    outputId,
                                                    outputChannelIndex
                                                ) || outputChannel.label
                                            }
                                            inputName={
                                                getCustomName(
                                                    customNames,
                                                    deviceId,
                                                    'inputs',
                                                    inputId
                                                ) || inputName
                                            }
                                            inputChannelLabel={
                                                getCustomChannelLabel(
                                                    customNames,
                                                    deviceId,
                                                    'inputs',
                                                    inputId,
                                                    inputChannelIndex
                                                ) || inputChannel.label
                                            }
                                        />
                                    }
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
                                            checked={isMapped(
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
    isOutputExpanded,
    customNames,
    deviceId,
    tooltipOpen,
}) => (
    <TableRow>
        <MappingHeadCell colSpan={3}>{'Unrouted'}</MappingHeadCell>
        {outputs.map(([outputId, outputItem]) =>
            isOutputExpanded(outputId) ? (
                Object.entries(outputItem.channels).map(
                    ([channelIndex, channel]) => (
                        <MappingCell key={channelIndex}>
                            <Tooltip
                                disableHoverListener={tooltipOpen}
                                title={
                                    <MappedCellTooltip
                                        outputName={
                                            getCustomName(
                                                customNames,
                                                deviceId,
                                                'outputs',
                                                outputId
                                            ) || outputItem.properties.name
                                        }
                                        outputChannelLabel={
                                            getCustomChannelLabel(
                                                customNames,
                                                deviceId,
                                                'outputs',
                                                outputId,
                                                channelIndex
                                            ) || channel.label
                                        }
                                        inputName="Unrouted"
                                    />
                                }
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
                                        checked={isMapped(
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
    isOutputExpanded,
    onExpandOutput,
    truncateValue,
    customNames,
    setCustomNames,
    deviceId,
    tooltipOpen,
    setTooltipOpen,
}) => (
    <>
        <TableRow>
            {outputs.map(([outputId, outputItem]) => (
                <MappingHeadCell
                    colSpan={
                        isOutputExpanded(outputId)
                            ? Object.keys(outputItem.channels).length
                            : 1
                    }
                    rowSpan={isOutputExpanded(outputId) ? 1 : 2}
                    key={outputId}
                >
                    <CollapseButton
                        onClick={() => onExpandOutput(outputId)}
                        isExpanded={isOutputExpanded(outputId)}
                        title={
                            isOutputExpanded(outputId)
                                ? 'Hide channels'
                                : 'View channels'
                        }
                    />
                    <InteractiveTooltip
                        getTooltip={(
                            displayEditTextField,
                            setDisplayEditTextField
                        ) => (
                            <OutputTooltip
                                {...{
                                    deviceId,
                                    outputId,
                                    outputItem,
                                    io,
                                    customNames,
                                    setCustomNames,
                                    displayEditTextField,
                                    setDisplayEditTextField,
                                }}
                            />
                        )}
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
                    >
                        <div>
                            {truncateValue(
                                getCustomName(
                                    customNames,
                                    deviceId,
                                    'outputs',
                                    outputId
                                ) || outputItem.properties.name
                            )}
                        </div>
                    </InteractiveTooltip>
                </MappingHeadCell>
            ))}
        </TableRow>
        <TableRow>
            {outputs.map(([outputId, outputItem]) =>
                isOutputExpanded(outputId)
                    ? Object.entries(outputItem.channels).map(
                          ([channelIndex, channel]) => (
                              <MappingHeadCell key={channelIndex}>
                                  <InteractiveTooltip
                                      getTooltip={(
                                          displayEditTextField,
                                          setDisplayEditTextField
                                      ) => (
                                          <ChannelTooltip
                                              {...{
                                                  deviceId,
                                                  ioResource: 'outputs',
                                                  id: outputId,
                                                  channelIndex,
                                                  channelLabel: channel.label,
                                                  customNames,
                                                  setCustomNames,
                                                  displayEditTextField,
                                                  setDisplayEditTextField,
                                              }}
                                          />
                                      )}
                                      tooltipOpen={tooltipOpen}
                                      setTooltipOpen={setTooltipOpen}
                                  >
                                      <div>
                                          {truncateValue(
                                              getCustomChannelLabel(
                                                  customNames,
                                                  deviceId,
                                                  'outputs',
                                                  outputId,
                                                  channelIndex
                                              ) || channel.label
                                          )}
                                      </div>
                                  </InteractiveTooltip>
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
    isOutputExpanded,
    isInputExpanded,
    onExpandInput,
    isShow,
    handleMap,
    isMapped,
    truncateValue,
    customNames,
    setCustomNames,
    deviceId,
    tooltipOpen,
    setTooltipOpen,
}) =>
    inputs.map(([inputId, inputItem]) => (
        <Fragment key={inputId}>
            <TableRow>
                <InputParentAssociation
                    isInputExpanded={isInputExpanded(inputId)}
                    inputItem={inputItem}
                    truncateValue={truncateValue}
                    tooltipOpen={tooltipOpen}
                />
                <MappingHeadCell
                    rowSpan={
                        isInputExpanded(inputId)
                            ? Object.keys(inputItem.channels).length
                            : 1
                    }
                    colSpan={isInputExpanded(inputId) ? 1 : 2}
                >
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
                    <InteractiveTooltip
                        getTooltip={(
                            displayEditTextField,
                            setDisplayEditTextField
                        ) => (
                            <InputTooltip
                                {...{
                                    deviceId,
                                    inputId,
                                    inputItem,
                                    customNames,
                                    setCustomNames,
                                    displayEditTextField,
                                    setDisplayEditTextField,
                                }}
                            />
                        )}
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
                    >
                        <div>
                            {truncateValue(
                                getCustomName(
                                    customNames,
                                    deviceId,
                                    'inputs',
                                    inputId
                                ) || inputItem.properties.name
                            )}
                        </div>
                    </InteractiveTooltip>
                </MappingHeadCell>
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
                        truncateValue={truncateValue}
                        customNames={customNames}
                        setCustomNames={setCustomNames}
                        deviceId={deviceId}
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
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
                                truncateValue={truncateValue}
                                customNames={customNames}
                                setCustomNames={setCustomNames}
                                deviceId={deviceId}
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

    const [tooltipOpen, setTooltipOpen] = useState(false);

    const [outputsFilter, setOutputsFilter] = useJSONSetting('Outputs Filter');
    const [inputsFilter, setInputsFilter] = useJSONSetting('Inputs Filter');
    const [settingsFilter, setSettingsFilter] = useJSONSetting(
        'Channel Mapping Settings'
    );
    const [customNames, setCustomNames] = useJSONSetting(
        'Channel Mapping Custom Names'
    );

    const filterMode = get(settingsFilter, 'filter mode');
    const maxLength = get(settingsFilter, 'label length');
    const truncateValue = value => truncateValueAtLength(value, maxLength);

    const deviceId = get(record, 'id');
    const io = convertChannelsArraysToObjects(get(record, '$io'));

    const filteredInputs = getFilteredInputs(
        inputsFilter,
        filterMode,
        customNames,
        get(io, 'inputs'),
        deviceId
    );
    const filteredOutputs = getFilteredOutputs(
        outputsFilter,
        inputId => get(io, `inputs.${inputId}.properties.name`),
        filterMode,
        customNames,
        get(io, 'outputs'),
        deviceId
    );

    const sortedOutputs = sortByIOName(filteredOutputs, id =>
        getCustomName(customNames, deviceId, 'outputs', id)
    );
    const sortedInputs = sortByIOName(filteredInputs, id =>
        getCustomName(customNames, deviceId, 'inputs', id)
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
                    source="label length"
                    InputProps={{
                        inputProps: {
                            min: 1,
                        },
                    }}
                />
                <FilterMode source="filter mode" />
            </FilterPanel>
            <Table>
                <TableHead>
                    <TableRow>
                        <MappingCornerCell rowSpan={3} colSpan={3}>
                            {'INPUTS \\ OUTPUTS'}
                        </MappingCornerCell>
                        <OutputSourceAssociation
                            outputs={sortedOutputs}
                            isExpanded={id => isExpanded('outputs', id)}
                            truncateValue={truncateValue}
                            tooltipOpen={tooltipOpen}
                        />
                    </TableRow>
                    <OutputsHeadRow
                        outputs={sortedOutputs}
                        io={io}
                        isOutputExpanded={id => isExpanded('outputs', id)}
                        onExpandOutput={id => toggleExpanded('outputs', id)}
                        truncateValue={truncateValue}
                        customNames={customNames}
                        setCustomNames={setCustomNames}
                        deviceId={deviceId}
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
                    />
                </TableHead>
                <TableBody>
                    <UnroutedRow
                        outputs={sortedOutputs}
                        mappingDisabled={isShow}
                        handleMap={handleMap}
                        isMapped={isMapped}
                        isOutputExpanded={id => isExpanded('outputs', id)}
                        customNames={customNames}
                        deviceId={deviceId}
                        tooltipOpen={tooltipOpen}
                    />
                    <InputsRows
                        inputs={sortedInputs}
                        outputs={sortedOutputs}
                        isOutputExpanded={id => isExpanded('outputs', id)}
                        isInputExpanded={id => isExpanded('inputs', id)}
                        onExpandInput={id => toggleExpanded('inputs', id)}
                        isShow={isShow}
                        handleMap={handleMap}
                        isMapped={isMapped}
                        truncateValue={truncateValue}
                        customNames={customNames}
                        setCustomNames={setCustomNames}
                        deviceId={deviceId}
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
                    />
                </TableBody>
            </Table>
        </>
    );
};

export default ChannelMappingMatrix;
