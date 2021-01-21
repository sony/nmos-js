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
import { get, isEmpty, set, setWith, toPath, unset } from 'lodash';
import LinkChipField from '../../components/LinkChipField';
import MappingButton from '../../components/MappingButton';
import CollapseButton from '../../components/CollapseButton';
import FilterPanel, {
    BooleanFilter,
    NumberFilter,
    StringFilter,
} from '../../components/FilterPanel';
import CustomNameField from '../../components/CustomNameField';
import CustomNamesContextProvider from '../../components/CustomNamesContextProvider';
import useCustomNamesContext from '../../components/useCustomNamesContext';
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
    outputId,
    outputItem,
    getInputAPIName,
    displayEditTextField,
    setDisplayEditTextField,
}) => {
    const { getCustomName } = useCustomNamesContext();
    const source = `outputs.${outputId}.name`;
    return (
        <>
            {'ID'}
            <Typography variant="body2">{outputId}</Typography>
            {'Name'}
            <CustomNameField
                {...{
                    source,
                    defaultValue: outputItem.properties.name,
                    displayEditTextField,
                    setDisplayEditTextField,
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

const InputTooltip = ({
    inputId,
    inputItem,
    displayEditTextField,
    setDisplayEditTextField,
}) => {
    const { getCustomName } = useCustomNamesContext();
    const source = `inputs.${inputId}.name`;
    return (
        <>
            {'ID'}
            <Typography variant="body2">{inputId}</Typography>
            {'Name'}
            <CustomNameField
                {...{
                    source,
                    defaultValue: inputItem.properties.name,
                    displayEditTextField,
                    setDisplayEditTextField,
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

const ChannelTooltip = ({
    ioResource,
    id,
    channelIndex,
    channelLabel,
    displayEditTextField,
    setDisplayEditTextField,
}) => {
    const { getCustomName } = useCustomNamesContext();
    const source = `${ioResource}.${id}.channels.${channelIndex}`;
    return (
        <>
            {'Label'}
            <CustomNameField
                {...{
                    source,
                    defaultValue: channelLabel,
                    displayEditTextField,
                    setDisplayEditTextField,
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
    tooltipOpen,
    setTooltipOpen,
}) => {
    const { getCustomName } = useCustomNamesContext();
    return (
        <>
            <MappingHeadCell key={inputChannelIndex}>
                <InteractiveTooltip
                    getTooltip={(
                        displayEditTextField,
                        setDisplayEditTextField
                    ) => (
                        <ChannelTooltip
                            {...{
                                ioResource: 'inputs',
                                id: inputId,
                                channelIndex: inputChannelIndex,
                                channelLabel: inputChannel.label,
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
                                `inputs.${inputId}.channels.${inputChannelIndex}`
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
                                                        `outputs.${outputId}.name`
                                                    ) ||
                                                    outputItem.properties.name
                                                }
                                                outputChannelLabel={
                                                    getCustomName(
                                                        `outputs.${outputId}.channels.${outputChannelIndex}`
                                                    ) || outputChannel.label
                                                }
                                                inputName={
                                                    getCustomName(
                                                        `inputs.${inputId}.name`
                                                    ) || inputName
                                                }
                                                inputChannelLabel={
                                                    getCustomName(
                                                        `inputs.${inputId}.channels.${inputChannelIndex}`
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
};

const UnroutedRow = ({
    outputs,
    mappingDisabled,
    handleMap,
    isMapped,
    isOutputExpanded,
    tooltipOpen,
}) => {
    const { getCustomName } = useCustomNamesContext();
    return (
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
                                                    `outputs.${outputId}.name`
                                                ) || outputItem.properties.name
                                            }
                                            outputChannelLabel={
                                                getCustomName(
                                                    `outputs.${outputId}.channels.${channelIndex}`
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
};

const OutputsHeadRow = ({
    outputs,
    getInputAPIName,
    isOutputExpanded,
    onExpandOutput,
    truncateValue,
    tooltipOpen,
    setTooltipOpen,
}) => {
    const { getCustomName } = useCustomNamesContext();
    return (
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
                                        outputId,
                                        outputItem,
                                        getInputAPIName,
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
                                    getCustomName(`outputs.${outputId}.name`) ||
                                        outputItem.properties.name
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
                                                      ioResource: 'outputs',
                                                      id: outputId,
                                                      channelIndex,
                                                      channelLabel:
                                                          channel.label,
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
                                                      `outputs.${outputId}.channels.${channelIndex}`
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
    truncateValue,
    tooltipOpen,
    setTooltipOpen,
}) => {
    const { getCustomName } = useCustomNamesContext();
    return inputs.map(([inputId, inputItem]) => (
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
                                    inputId,
                                    inputItem,
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
                                getCustomName(`inputs.${inputId}.name`) ||
                                    inputItem.properties.name
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
                                tooltipOpen={tooltipOpen}
                                setTooltipOpen={setTooltipOpen}
                            />
                        </TableRow>
                    ))}
        </Fragment>
    ));
};

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

    const maxLength = get(settingsFilter, 'label length');
    const truncateValue = value => truncateValueAtLength(value, maxLength);

    const io = convertChannelsArraysToObjects(get(record, '$io'));

    const getInputAPIName = inputId =>
        get(io, `inputs.${inputId}.properties.name`);

    const filteredInputs = getFilteredInputs(
        inputsFilter,
        get(io, 'inputs'),
        getCustomName
    );
    const filteredOutputs = getFilteredOutputs(
        outputsFilter,
        get(io, 'outputs'),
        getInputAPIName,
        getCustomName
    );

    const sortedOutputs = sortByIOName(filteredOutputs, outputId =>
        getCustomName(`outputs.${outputId}.name`)
    );
    const sortedInputs = sortByIOName(filteredInputs, inputId =>
        getCustomName(`inputs.${inputId}.name`)
    );

    return (
        <CustomNamesContextProvider
            value={{ getCustomName, setCustomName, unsetCustomName }}
        >
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
                        getInputAPIName={getInputAPIName}
                        isOutputExpanded={id => isExpanded('outputs', id)}
                        onExpandOutput={id => toggleExpanded('outputs', id)}
                        truncateValue={truncateValue}
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
                        tooltipOpen={tooltipOpen}
                        setTooltipOpen={setTooltipOpen}
                    />
                </TableBody>
            </Table>
        </CustomNamesContextProvider>
    );
};

export default ChannelMappingMatrix;
