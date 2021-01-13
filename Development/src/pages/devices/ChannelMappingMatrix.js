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
    EditableChannelNameField,
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
    personalNames,
    setPersonalNames
) => {
    return (
        <>
            {'ID'}
            <Typography variant="body2">{outputId}</Typography>
            {'Name'}
            <EditableIONameField
                personalNames={personalNames}
                setPersonalNames={setPersonalNames}
                source={outputId}
                defaultValue={outputItem.properties.name}
                ioKey={'outputs'}
            />
            {getPersonalName(outputId, 'outputs', personalNames) && (
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
                          .map(inputId => {
                              return inputId === null
                                  ? 'Unrouted'
                                  : getPersonalName(
                                        inputId,
                                        'inputs',
                                        personalNames
                                    ) ||
                                        get(
                                            io,
                                            `inputs.${inputId}.properties.name`
                                        );
                          })
                          .join(', ')
                    : 'No Constraints'}
            </Typography>
        </>
    );
};

const getInputTooltip = (
    inputId,
    inputItem,
    personalNames,
    setPersonalNames
) => {
    return (
        <>
            {'ID'}
            <Typography variant="body2">{inputId}</Typography>
            {'Name'}
            <EditableIONameField
                personalNames={personalNames}
                setPersonalNames={setPersonalNames}
                source={inputId}
                defaultValue={inputItem.properties.name}
                ioKey={'inputs'}
            />
            {getPersonalName(inputId, 'inputs', personalNames) && (
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

const getChannelTooltip = (
    id,
    channelLabel,
    channelIndex,
    ioKey,
    personalNames,
    setPersonalNames
) => {
    return (
        <>
            {'Label'}
            <EditableChannelNameField
                personalNames={personalNames}
                setPersonalNames={setPersonalNames}
                source={id}
                defaultValue={channelLabel}
                channelIndex={channelIndex}
                ioKey={ioKey}
            />
            {getPersonalChannelName(id, ioKey, channelIndex, personalNames) && (
                <>
                    {'API Label'}
                    <Typography variant="body2">{channelLabel}</Typography>
                </>
            )}
        </>
    );
};

const getMappedCellTooltip = (
    outputName,
    personalOutputName,
    outputChannelName,
    personalOutputChannelName,
    inputName,
    personalInputName,
    inputChannelName,
    personalInputChannelName
) => {
    return (
        <>
            {'Input'}
            <Typography variant="body2">
                {personalInputName || inputName}
                {inputName !== 'Unrouted' ? ' - ' : ''}
                {personalInputChannelName || inputChannelName}
            </Typography>
            {'Output'}
            <Typography variant="body2">
                {personalOutputName || outputName}
                {' - '}
                {personalOutputChannelName || outputChannelName}
            </Typography>
        </>
    );
};

const truncateValueAtLength = (value, maxLength) => {
    const ellipsis = '\u2026';
    return maxLength !== undefined &&
        !isNaN(maxLength) &&
        value.length > maxLength
        ? value.substring(0, maxLength) + ellipsis
        : value;
};

export const getPersonalName = (id, ioKey, personalNames) => {
    return get(personalNames, `${ioKey}.${id}.name`) || '';
};

export const getPersonalChannelName = (
    id,
    ioKey,
    channelIndex,
    personalNames
) => {
    return get(personalNames, `${ioKey}.${id}.channels.${channelIndex}`) || '';
};

const getOutputSourceTooltip = outputItem => {
    return (
        <>
            {'Source'}
            <ReferenceField
                record={outputItem}
                basePath="/sources"
                label="Sources"
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
};

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
                            label="Sources"
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

const getInputParentTypeTooltip = (type, inputItem) => {
    return (
        <>
            {'Parent ' + labelize(type)}
            <Typography />
            {type === 'source' ? (
                <ReferenceField
                    record={inputItem}
                    basePath="/sources"
                    label="Sources"
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
                    label="Receivers"
                    source="parent.id"
                    reference="receivers"
                    link="show"
                >
                    <LinkChipField />
                </ReferenceField>
            )}
        </>
    );
};

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
                            label="Sources"
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
                            label="Receivers"
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
    outputs.map(([outputId, outputItem]) => {
        return isColExpanded(outputId) ? (
            Object.entries(outputItem.channels).map(([channelIndex, _]) => (
                <StyledTableCell key={channelIndex} />
            ))
        ) : (
            <StyledTableCell key={outputId} />
        );
    });

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
    personalNames,
    setPersonalNames,
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
                    personalNames,
                    setPersonalNames
                )}
                placement="bottom"
            >
                <div>
                    {truncateValue(
                        getPersonalChannelName(
                            inputId,
                            'inputs',
                            inputChannelIndex,
                            personalNames
                        ) || inputChannel.label
                    )}
                </div>
            </Tooltip>
        </StyledTableCell>
        <>
            {outputs.map(([outputId, outputItem]) => {
                return isColExpanded(outputId) ? (
                    Object.entries(outputItem.channels).map(
                        ([outputChannelIndex, outputChannel]) => {
                            return (
                                <StyledTableCell
                                    align="center"
                                    key={outputChannelIndex}
                                >
                                    <Tooltip
                                        title={getMappedCellTooltip(
                                            outputItem.properties.name,
                                            getPersonalName(
                                                outputId,
                                                'outputs',
                                                personalNames
                                            ),
                                            outputChannel.label,
                                            getPersonalChannelName(
                                                outputId,
                                                'outputs',
                                                outputChannelIndex,
                                                personalNames
                                            ),
                                            inputName,
                                            getPersonalName(
                                                inputId,
                                                'inputs',
                                                personalNames
                                            ),
                                            inputChannel.label,
                                            getPersonalChannelName(
                                                inputId,
                                                'inputs',
                                                inputChannelIndex,
                                                personalNames
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
                            );
                        }
                    )
                ) : (
                    <StyledTableCell key={outputId} />
                );
            })}
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
    personalNames,
}) => (
    <TableRow>
        <StyledTableCell align="center" colSpan={3}>
            {'Unrouted'}
        </StyledTableCell>
        {outputs.map(([outputId, outputItem]) => {
            return isColExpanded(outputId) ? (
                Object.entries(outputItem.channels).map(
                    ([channelIndex, channel]) => (
                        <StyledTableCell align="center" key={channelIndex}>
                            <Tooltip
                                title={getMappedCellTooltip(
                                    outputItem.properties.name,
                                    getPersonalName(
                                        outputId,
                                        'outputs',
                                        personalNames
                                    ),
                                    channel.label,
                                    getPersonalChannelName(
                                        outputId,
                                        'outputs',
                                        channelIndex,
                                        personalNames
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
            );
        })}
    </TableRow>
);

const OutputsHeadRow = ({
    outputs,
    io,
    isColExpanded,
    handleExpandCol,
    truncateValue,
    personalNames,
    setPersonalNames,
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
                            personalNames,
                            setPersonalNames
                        )}
                        placement="bottom"
                    >
                        <div>
                            {truncateValue(
                                getPersonalName(
                                    outputId,
                                    'outputs',
                                    personalNames
                                ) || outputItem.properties.name
                            )}
                        </div>
                    </Tooltip>
                </StyledTableCell>
            ))}
        </TableRow>
        <TableRow>
            {outputs.map(([outputId, outputItem]) => {
                return isColExpanded(outputId)
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
                                          personalNames,
                                          setPersonalNames
                                      )}
                                      placement="bottom"
                                  >
                                      <div>
                                          {truncateValue(
                                              getPersonalChannelName(
                                                  outputId,
                                                  'outputs',
                                                  channelIndex,
                                                  personalNames
                                              ) || channel.label
                                          )}
                                      </div>
                                  </Tooltip>
                              </StyledTableCell>
                          )
                      )
                    : null;
            })}
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
    personalNames,
    setPersonalNames,
}) => {
    return inputs.map(([inputId, inputItem]) => (
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
                            personalNames,
                            setPersonalNames
                        )}
                        placement="bottom"
                    >
                        <div>
                            {truncateValue(
                                getPersonalName(
                                    inputId,
                                    'inputs',
                                    personalNames
                                ) || inputItem.properties.name
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
                        personalNames={personalNames}
                        setPersonalNames={setPersonalNames}
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
                                personalNames={personalNames}
                                setPersonalNames={setPersonalNames}
                            />
                        </TableRow>
                    ))}
        </Fragment>
    ));
};

const sortByIOName = (ioObject, getPersonalName) => {
    return Object.entries(ioObject).sort((ioItem1, ioItem2) => {
        let name1 = getPersonalName(ioItem1[0]) || ioItem1[1].properties.name;
        let name2 = getPersonalName(ioItem2[0]) || ioItem2[1].properties.name;
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
    const isRowExpanded = inputId => {
        return expandedRows.includes(inputId);
    };
    const isColExpanded = outputId => {
        return expandedCols.includes(outputId);
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
    const [personalNames, setPersonalNames] = useJSONSetting(
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
        personalNames
    );
    let filter_outputs = getFilteredOutputs(
        outputsFilter,
        io,
        filterGroup,
        personalNames
    );

    const sorted_outputs = sortByIOName(filter_outputs, id =>
        getPersonalName(id, 'outputs', personalNames)
    );
    const sorted_inputs = sortByIOName(filter_inputs, id =>
        getPersonalName(id, 'inputs', personalNames)
    );

    return (
        <>
            <FilterPanel
                filter={outputsFilter}
                setFilter={setOutputsFilter}
                filterListLabel={'output filter'}
            >
                <StringFilter source="output id" />
                <StringFilter source="output name" />
                <StringFilter source="output channel label" />
                <StringFilter source="routable inputs" />
            </FilterPanel>
            <FilterPanel
                filter={inputsFilter}
                setFilter={setInputsFilter}
                filterListLabel={'input filter'}
            >
                <StringFilter source="input id" />
                <StringFilter source="input name" />
                <StringFilter source="input channel label" />
                <NumberFilter source="block size" />
                <BooleanFilter source="reordering" />
            </FilterPanel>
            <FilterPanel
                filter={settingsFilter}
                setFilter={setSettingsFilter}
                filterListLabel={'settings'}
            >
                <NumberFilter source="limit label length" />
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
                        personalNames={personalNames}
                        setPersonalNames={setPersonalNames}
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
                        personalNames={personalNames}
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
                        personalNames={personalNames}
                        setPersonalNames={setPersonalNames}
                    />
                </TableBody>
            </Table>
        </>
    );
};

export default ChannelMappingMatrix;
