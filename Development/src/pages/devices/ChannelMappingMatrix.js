import { Fragment, useState } from 'react';
import {
    Divider,
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

const StyledTableCell = withStyles({
    root: {
        padding: 2,
        border: '1px solid rgba(224, 224, 224, 1)',
    },
})(TableCell);

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

const getOutputTooltip = (
    outputId,
    outputItem,
    io,
    customNames,
    setCustomNames
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
        />
        {getCustomName(outputId, 'outputs', customNames) && (
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
                              : getCustomName(inputId, 'inputs', customNames) ||
                                get(io, `inputs.${inputId}.properties.name`)
                      )
                      .join(', ')
                : 'No Constraints'}
        </Typography>
    </>
);

const getInputTooltip = (inputId, inputItem, customNames, setCustomNames) => (
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
        />
        {getCustomName(inputId, 'inputs', customNames) && (
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
    setCustomNames
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
        />
        {getCustomChannelLabel(id, ioKey, channelIndex, customNames) && (
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

export const getCustomName = (id, ioKey, customNames) => {
    return get(customNames, `${ioKey}.${id}.name`) || '';
};

export const getCustomChannelLabel = (id, ioKey, channelIndex, customNames) => {
    return get(customNames, `${ioKey}.${id}.channels.${channelIndex}`) || '';
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

const OutputSourceAssociation = ({ outputs, isExpanded, truncateValue }) =>
    outputs.map(([outputId, outputItem]) => (
        <StyledTableCell
            align="center"
            colSpan={
                isExpanded(outputId)
                    ? Object.keys(outputItem.channels).length
                    : 1
            }
            key={outputId}
        >
            {get(outputItem, 'source_id') ? (
                <Tooltip
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
                    title={
                        <Typography variant="body2">{'No Source'}</Typography>
                    }
                    placement="bottom"
                >
                    <div>{truncateValue('No Source')}</div>
                </Tooltip>
            )}
        </StyledTableCell>
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
}) => (
    <StyledTableCell
        align="center"
        rowSpan={isRowExpanded ? Object.keys(inputItem.channels).length : 1}
    >
        {inputItem.parent.type === null ? (
            <Tooltip
                title={<Typography variant="body2">{'No Parent'}</Typography>}
                placement="bottom"
            >
                <div>{truncateValue('No Parent')}</div>
            </Tooltip>
        ) : (
            <Tooltip
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
    </StyledTableCell>
);

const EmptyCellsForCollapsedRow = ({ outputs, isColExpanded }) =>
    outputs.map(([outputId, outputItem]) =>
        isColExpanded(outputId) ? (
            Object.entries(outputItem.channels).map(([channelIndex, _]) => (
                <StyledTableCell key={channelIndex} />
            ))
        ) : (
            <StyledTableCell key={outputId} />
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
}) => (
    <>
        <StyledTableCell align="center" key={inputChannelIndex}>
            <Tooltip
                interactive
                title={getChannelTooltip(
                    inputId,
                    inputChannel.label,
                    inputChannelIndex,
                    'inputs',
                    customNames,
                    setCustomNames
                )}
                placement="bottom"
            >
                <div>
                    {truncateValue(
                        getCustomChannelLabel(
                            inputId,
                            'inputs',
                            inputChannelIndex,
                            customNames
                        ) || inputChannel.label
                    )}
                </div>
            </Tooltip>
        </StyledTableCell>
        <>
            {outputs.map(([outputId, outputItem]) =>
                isColExpanded(outputId) ? (
                    Object.entries(outputItem.channels).map(
                        ([outputChannelIndex, outputChannel]) => (
                            <StyledTableCell
                                align="center"
                                key={outputChannelIndex}
                            >
                                <Tooltip
                                    title={getMappedCellTooltip(
                                        outputItem.properties.name,
                                        getCustomName(
                                            outputId,
                                            'outputs',
                                            customNames
                                        ),
                                        outputChannel.label,
                                        getCustomChannelLabel(
                                            outputId,
                                            'outputs',
                                            outputChannelIndex,
                                            customNames
                                        ),
                                        inputName,
                                        getCustomName(
                                            inputId,
                                            'inputs',
                                            customNames
                                        ),
                                        inputChannel.label,
                                        getCustomChannelLabel(
                                            inputId,
                                            'inputs',
                                            inputChannelIndex,
                                            customNames
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
                            </StyledTableCell>
                        )
                    )
                ) : (
                    <StyledTableCell key={outputId} />
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
    truncateValue,
    customNames,
}) => (
    <TableRow>
        <StyledTableCell align="center" colSpan={3}>
            {'Unrouted'}
        </StyledTableCell>
        {outputs.map(([outputId, outputItem]) =>
            isColExpanded(outputId) ? (
                Object.entries(outputItem.channels).map(
                    ([channelIndex, channel]) => (
                        <StyledTableCell align="center" key={channelIndex}>
                            <Tooltip
                                title={getMappedCellTooltip(
                                    outputItem.properties.name,
                                    getCustomName(
                                        outputId,
                                        'outputs',
                                        customNames
                                    ),
                                    channel.label,
                                    getCustomChannelLabel(
                                        outputId,
                                        'outputs',
                                        channelIndex,
                                        customNames
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
                        </StyledTableCell>
                    )
                )
            ) : (
                <StyledTableCell key={outputId} />
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
}) => (
    <>
        <TableRow>
            {outputs.map(([outputId, outputItem]) => (
                <StyledTableCell
                    align="center"
                    colSpan={
                        isColExpanded(outputId)
                            ? Object.keys(outputItem.channels).length
                            : 1
                    }
                    rowSpan={isColExpanded(outputId) ? 1 : 2}
                    key={outputId}
                    style={{
                        padding: 4,
                    }}
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
                    <Tooltip
                        interactive
                        title={getOutputTooltip(
                            outputId,
                            outputItem,
                            io,
                            customNames,
                            setCustomNames
                        )}
                        placement="bottom"
                    >
                        <div>
                            {truncateValue(
                                getCustomName(
                                    outputId,
                                    'outputs',
                                    customNames
                                ) || outputItem.properties.name
                            )}
                        </div>
                    </Tooltip>
                </StyledTableCell>
            ))}
        </TableRow>
        <TableRow>
            {outputs.map(([outputId, outputItem]) =>
                isColExpanded(outputId)
                    ? Object.entries(outputItem.channels).map(
                          ([channelIndex, channel]) => (
                              <StyledTableCell
                                  align="center"
                                  size="small"
                                  key={channelIndex}
                              >
                                  <Tooltip
                                      interactive
                                      title={getChannelTooltip(
                                          outputId,
                                          channel.label,
                                          channelIndex,
                                          'outputs',
                                          customNames,
                                          setCustomNames
                                      )}
                                      placement="bottom"
                                  >
                                      <div>
                                          {truncateValue(
                                              getCustomChannelLabel(
                                                  outputId,
                                                  'outputs',
                                                  channelIndex,
                                                  customNames
                                              ) || channel.label
                                          )}
                                      </div>
                                  </Tooltip>
                              </StyledTableCell>
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
}) =>
    inputs.map(([inputId, inputItem]) => (
        <Fragment key={inputId}>
            <TableRow>
                <InputParentAssociation
                    isRowExpanded={isRowExpanded(inputId)}
                    inputItem={inputItem}
                    truncateValue={truncateValue}
                />
                <StyledTableCell
                    align="center"
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
                    <Tooltip
                        interactive
                        title={getInputTooltip(
                            inputId,
                            inputItem,
                            customNames,
                            setCustomNames
                        )}
                        placement="bottom"
                    >
                        <div>
                            {truncateValue(
                                getCustomName(inputId, 'inputs', customNames) ||
                                    inputItem.properties.name
                            )}
                        </div>
                    </Tooltip>
                </StyledTableCell>
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
    const maxLength = get(settingsFilter, 'limit label length');
    const truncateValue = value => truncateValueAtLength(value, maxLength);
    const filterGroup = get(settingsFilter, 'filter group');
    let filter_inputs = getFilteredInputs(
        inputsFilter,
        io,
        filterGroup,
        customNames
    );
    let filter_outputs = getFilteredOutputs(
        outputsFilter,
        io,
        filterGroup,
        customNames
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
                        <StyledTableCell align="center" rowSpan={3} colSpan={3}>
                            {'INPUTS \\ OUTPUTS'}
                        </StyledTableCell>
                        <OutputSourceAssociation
                            outputs={sorted_outputs}
                            isExpanded={outputId => isColExpanded(outputId)}
                            truncateValue={truncateValue}
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
                    />
                </TableHead>
                <TableBody>
                    <UnroutedRow
                        outputs={sorted_outputs}
                        mappingDisabled={isShow}
                        handleMap={handleMap}
                        isMapped={isMapped}
                        isColExpanded={outputId => isColExpanded(outputId)}
                        truncateValue={truncateValue}
                        customNames={customNames}
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
                    />
                </TableBody>
            </Table>
        </>
    );
};

export default ChannelMappingMatrix;
