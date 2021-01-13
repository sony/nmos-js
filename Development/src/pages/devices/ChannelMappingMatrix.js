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
import has from 'lodash/has';
import ChipFunctionalLabel from '../../components/ChipFunctionalLabel';
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
import { getFilteredIO } from './FilterMatrix';

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

const getOutputTooltipTitle = (outputId, outputItem, io, personalName) => {
    return (
        <>
            {'ID'}
            <Typography variant="body2">{outputId}</Typography>
            {'Name'}
            {personalName ? (
                <>
                    <Typography variant="body2">{personalName}</Typography>
                    {'Original Name'}
                    <Typography variant="body2">
                        {outputItem.properties.name}
                    </Typography>
                </>
            ) : (
                <Typography variant="body2">
                    {outputItem.properties.name}
                </Typography>
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
                                  : get(
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

const getInputTooltipTitle = (inputId, inputItem, personalName) => {
    return (
        <>
            {'ID'}
            <Typography variant="body2">{inputId}</Typography>
            {'Name'}
            {personalName ? (
                <>
                    <Typography variant="body2">{personalName}</Typography>
                    {'Original Name'}
                    <Typography variant="body2">
                        {inputItem.properties.name}
                    </Typography>
                </>
            ) : (
                <Typography variant="body2">
                    {inputItem.properties.name}
                </Typography>
            )}
            {'Description'}
            <Typography variant="body2">
                {get(inputItem, `properties.description`)}
            </Typography>
            <TooltipDivider />
            {'Block Size'}
            <Typography variant="body2">
                {get(inputItem, `caps.block_size`)}
            </Typography>
            {'Reordering'}
            <Typography variant="body2">
                {get(inputItem, `caps.reordering`) ? (
                    <DoneIcon />
                ) : (
                    <ClearIcon />
                )}
            </Typography>
        </>
    );
};

const getChannelTooltipTitle = (channelItem, personalName) => {
    return (
        <>
            {'Name'}
            {personalName ? (
                <>
                    <Typography variant="body2">{personalName}</Typography>
                    {'Original Name'}
                    <Typography variant="body2">{channelItem.label}</Typography>
                </>
            ) : (
                <Typography variant="body2">{channelItem.label}</Typography>
            )}
        </>
    );
};

const getMappedCellTooltipTitle = (
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
            {personalInputName || personalInputChannelName
                ? 'Personal Input'
                : 'Input'}
            <Typography variant="body2">
                {personalInputName ? personalInputName : inputName}
                {inputName !== 'Unrouted' ? ' - ' : ''}
                {personalInputChannelName
                    ? personalInputChannelName
                    : inputChannelName}
            </Typography>
            {personalOutputName || personalOutputChannelName
                ? 'Personal Output'
                : 'Output'}
            <Typography variant="body2">
                {personalOutputName ? personalOutputName : outputName}
                {' - '}
                {personalOutputChannelName
                    ? personalOutputChannelName
                    : outputChannelName}
            </Typography>
        </>
    );
};

const getLabelByLenght = (label, limit_lenght) => {
    return (limit_lenght !== undefined || !isNaN(limit_lenght)) &&
        label.length > limit_lenght
        ? label.substring(0, limit_lenght) + '...'
        : label;
};

export const getPersonalName = (id, ioKey, personalNames) => {
    return get(personalNames, `${ioKey}.${id}.name`)
        ? get(personalNames, `${ioKey}.${id}.name`)
        : '';
};

export const getPersonalChannelName = (
    id,
    ioKey,
    channelIndex,
    personalNames
) => {
    return has(personalNames, `${ioKey}.${id}.channels.${channelIndex}`)
        ? get(personalNames, `${ioKey}.${id}.channels.${channelIndex}`)
        : '';
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

const OutputSourceAssociation = ({ outputs, isExpanded, labelLength }) =>
    outputs.map(([outputId, outputItem]) => (
        <StyledTableCell
            align="center"
            colSpan={isExpanded(outputId) ? outputItem.channels.length : 1}
            key={outputId}
        >
            {get(outputItem, `source_id`) ? (
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
                            <ChipFunctionalLabel
                                source="label"
                                labelFunction={name =>
                                    getLabelByLenght(name, labelLength)
                                }
                            />
                        </ReferenceField>
                    </div>
                </Tooltip>
            ) : (
                getLabelByLenght('No Source', labelLength)
            )}
        </StyledTableCell>
    ));

const getInputParentTypeTooltip = (type, inputItem) => {
    return (
        <>
            {labelize(type)}
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

const InputParentAssociation = ({ isRowExpanded, inputItem, labelLength }) => (
    <StyledTableCell
        align="center"
        rowSpan={isRowExpanded ? inputItem.channels.length : 1}
    >
        {inputItem.parent.type === null ? (
            getLabelByLenght('No Parent', labelLength)
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
                            <ChipFunctionalLabel
                                source="label"
                                labelFunction={name =>
                                    getLabelByLenght(name, labelLength)
                                }
                            />
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
                            <ChipFunctionalLabel
                                source="label"
                                labelFunction={name =>
                                    getLabelByLenght(name, labelLength)
                                }
                            />
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
            outputItem.channels.map((channel, channelIndex) => (
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
    labelLength,
    personalNames,
    setPersonalNames,
}) => (
    <>
        <StyledTableCell align="center" key={inputChannelIndex}>
            <EditableChannelNameField
                personalNames={personalNames}
                setPersonalNames={setPersonalNames}
                source={inputId}
                defaultValue={inputChannel.label}
                getLabelByLenght={name => getLabelByLenght(name, labelLength)}
                channelIndex={inputChannelIndex}
                title={getChannelTooltipTitle(
                    inputChannel,
                    getPersonalChannelName(
                        inputId,
                        'inputs',
                        inputChannelIndex,
                        personalNames
                    )
                )}
                ioKey={'inputs'}
            />
        </StyledTableCell>
        <>
            {outputs.map(([outputId, outputItem]) => {
                return isColExpanded(outputId) ? (
                    outputItem.channels.map(
                        (outputChannel, outputChannelIndex) => {
                            return (
                                <StyledTableCell
                                    align="center"
                                    key={outputChannelIndex}
                                >
                                    <Tooltip
                                        title={getMappedCellTooltipTitle(
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
    labelLength,
    personalNames,
}) => (
    <TableRow>
        <StyledTableCell align="center" colSpan={3}>
            {getLabelByLenght('Unrouted', labelLength)}
        </StyledTableCell>
        {outputs.map(([outputId, outputItem]) => {
            return isColExpanded(outputId) ? (
                outputItem.channels.map((channel, channelIndex) => (
                    <StyledTableCell align="center" key={channelIndex}>
                        <Tooltip
                            title={getMappedCellTooltipTitle(
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
                ))
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
    labelLength,
    personalNames,
    setPersonalNames,
}) => (
    <>
        <TableRow>
            {outputs.map(([outputId, outputItem]) => (
                <StyledTableCell
                    align="center"
                    colSpan={
                        isColExpanded(outputId) ? outputItem.channels.length : 1
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
                    <EditableIONameField
                        personalNames={personalNames}
                        setPersonalNames={setPersonalNames}
                        source={outputId}
                        defaultValue={outputItem.properties.name}
                        getLabelByLenght={name =>
                            getLabelByLenght(name, labelLength)
                        }
                        title={getOutputTooltipTitle(
                            outputId,
                            outputItem,
                            io,
                            getPersonalName(outputId, 'outputs', personalNames)
                        )}
                        ioKey={'outputs'}
                    />
                </StyledTableCell>
            ))}
        </TableRow>
        <TableRow>
            {outputs.map(([outputId, outputItem]) => {
                return isColExpanded(outputId)
                    ? outputItem.channels.map((channel, channelIndex) => (
                          <StyledTableCell
                              align="center"
                              size="small"
                              key={channelIndex}
                          >
                              <EditableChannelNameField
                                  personalNames={personalNames}
                                  setPersonalNames={setPersonalNames}
                                  source={outputId}
                                  defaultValue={channel.label}
                                  getLabelByLenght={name =>
                                      getLabelByLenght(name, labelLength)
                                  }
                                  channelIndex={channelIndex}
                                  title={getChannelTooltipTitle(
                                      channel,
                                      getPersonalChannelName(
                                          outputId,
                                          'outputs',
                                          channelIndex,
                                          personalNames
                                      )
                                  )}
                                  ioKey={'outputs'}
                              />
                          </StyledTableCell>
                      ))
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
    labelLength,
    personalNames,
    setPersonalNames,
}) => {
    return inputs.map(([inputId, inputItem]) => (
        <Fragment key={inputId}>
            <TableRow>
                <InputParentAssociation
                    isRowExpanded={isRowExpanded(inputId)}
                    inputItem={inputItem}
                    labelLength={labelLength}
                />
                <StyledTableCell
                    align="center"
                    rowSpan={
                        isRowExpanded(inputId) ? inputItem.channels.length : 1
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
                    <EditableIONameField
                        personalNames={personalNames}
                        setPersonalNames={setPersonalNames}
                        source={inputId}
                        defaultValue={inputItem.properties.name}
                        getLabelByLenght={name =>
                            getLabelByLenght(name, labelLength)
                        }
                        title={getInputTooltipTitle(
                            inputId,
                            inputItem,
                            getPersonalName(inputId, 'inputs', personalNames)
                        )}
                        ioKey={'inputs'}
                    />
                </StyledTableCell>
                {!isRowExpanded(inputId) ? (
                    <EmptyCellsForCollapsedRow
                        outputs={outputs}
                        isColExpanded={isColExpanded}
                    />
                ) : inputItem.channels.length >= 1 ? (
                    <InputChannelMappingCells
                        inputChannel={inputItem.channels[0]}
                        inputChannelIndex={0}
                        inputName={inputItem.properties.name}
                        inputId={inputId}
                        outputs={outputs}
                        isColExpanded={isColExpanded}
                        mappingDisabled={isShow}
                        handleMap={handleMap}
                        isMapped={isMapped}
                        labelLength={labelLength}
                        personalNames={personalNames}
                        setPersonalNames={setPersonalNames}
                    />
                ) : null}
            </TableRow>
            {isRowExpanded(inputId) &&
                inputItem.channels.length > 1 &&
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
                                labelLength={labelLength}
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
        let name1 = getPersonalName(ioItem1[0])
            ? getPersonalName(ioItem1[0])
            : ioItem1[1].properties.name;
        let name2 = getPersonalName(ioItem2[0])
            ? getPersonalName(ioItem2[0])
            : ioItem2[1].properties.name;
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
    const [filter, setFilter] = useJSONSetting('channel mapping Filter');
    const [personalNames, setPersonalNames] = useJSONSetting(
        'channel mapping personal names'
    );
    const io = get(record, '$io');
    let [filter_inputs, filter_outputs] = getFilteredIO(
        filter,
        io,
        personalNames
    );
    const sorted_outputs = sortByIOName(filter_outputs, id =>
        getPersonalName(id, 'outputs', personalNames)
    );
    const sorted_inputs = sortByIOName(filter_inputs, id =>
        getPersonalName(id, 'inputs', personalNames)
    );
    const labelLength = get(filter, `limit label length`);
    return (
        <>
            <FilterPanel filter={filter} setFilter={setFilter}>
                <StringFilter source="output label" />
                <StringFilter source="personal output label" />
                <StringFilter source="output channel label" />
                <StringFilter source="personal output channel label" />
                <StringFilter source="input label" />
                <StringFilter source="personal input label" />
                <StringFilter source="input channel label" />
                <StringFilter source="personal input channel label" />
                <NumberFilter source="block size" />
                <BooleanFilter source="reordering" />
                <StringFilter source="routable inputs" />
                <NumberFilter source="limit label length" />
                <GroupFilter source="filter group" />
            </FilterPanel>
            <Table>
                <TableHead>
                    <TableRow>
                        <StyledTableCell align="center" rowSpan={3} colSpan={3}>
                            {getLabelByLenght('INPUTS \\ OUTPUTS', labelLength)}
                        </StyledTableCell>
                        <OutputSourceAssociation
                            outputs={sorted_outputs}
                            isExpanded={outputId => isColExpanded(outputId)}
                            labelLength={labelLength}
                        />
                    </TableRow>
                    <OutputsHeadRow
                        outputs={sorted_outputs}
                        io={io}
                        isColExpanded={outputId => isColExpanded(outputId)}
                        handleExpandCol={handleExpandCol}
                        labelLength={labelLength}
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
                        labelLength={labelLength}
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
                        labelLength={labelLength}
                        personalNames={personalNames}
                        setPersonalNames={setPersonalNames}
                    />
                </TableBody>
            </Table>
        </>
    );
};

export default ChannelMappingMatrix;
