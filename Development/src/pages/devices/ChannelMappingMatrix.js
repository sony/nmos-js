import { Fragment, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    withStyles,
} from '@material-ui/core';
import {
    ReferenceField,
    ReferenceManyField,
    SingleFieldList,
} from 'react-admin';
import get from 'lodash/get';
import ChipConditionalLabel, {
    StyledChipConditionalLabel,
} from '../../components/ChipConditionalLabel';
import MappingButton from '../../components/MappingButton';
import CollapseButton from '../../components/CollapseButton';

const StyledTableCell = withStyles({
    root: {
        padding: 2,
        border: '1px solid rgba(224, 224, 224, 1)',
    },
})(TableCell);

const getOutputTooltipTitle = (outputItem, io) => {
    return (
        <>
            <Typography variant="body1">{'Name:'}</Typography>
            {outputItem.properties.name}
            <Typography variant="body1">{'Description:'}</Typography>
            {outputItem.properties.description}
            <Typography variant="body1">{'Routable inputs:'}</Typography>
            {outputItem.caps.routable_inputs !== null
                ? outputItem.caps.routable_inputs
                      .map(inputId => {
                          return inputId === null
                              ? 'MUTE'
                              : get(io, `inputs.${inputId}.properties.name`);
                      })
                      .join(', ')
                : 'ANY'}
        </>
    );
};

const getInputTooltipTitle = inputItem => {
    return (
        <>
            <Typography variant="body1">{'Name:'}</Typography>
            {inputItem.properties.name}
            <Typography variant="body1">{'Description:'}</Typography>
            {get(inputItem, `properties.description`)}
            <Typography variant="body1">{'Block size:'}</Typography>
            {get(inputItem, `caps.block_size`)}
            <Typography variant="body1">{'Reordering:'}</Typography>
            {String(get(inputItem, `caps.reordering`))}
        </>
    );
};

const getSourceTooltip = outputItem => {
    return (
        <>
            <Typography variant="body1">{'Flows:'} </Typography>
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
                    <StyledChipConditionalLabel source="label" />
                </SingleFieldList>
            </ReferenceManyField>
            <Typography variant="body1">{'Senders:'} </Typography>
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
                            <StyledChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </ReferenceManyField>
                </SingleFieldList>
            </ReferenceManyField>
        </>
    );
};

const OutputSourceAssociation = ({ outputs, isExpanded }) =>
    outputs.map(([outputId, outputItem]) => (
        <StyledTableCell
            align="center"
            colSpan={isExpanded(outputId) ? outputItem.channels.length : 1}
            key={outputId}
        >
            {get(outputItem, `source_id`) ? (
                <Tooltip
                    interactive
                    title={getSourceTooltip(outputItem)}
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
                            <ChipConditionalLabel source="label" />
                        </ReferenceField>
                    </div>
                </Tooltip>
            ) : (
                'No source'
            )}
        </StyledTableCell>
    ));

const getInputParentTypeTooltip = type => {
    return (
        <>
            <Typography variant="body1">{'Type:'} </Typography>
            {type}
        </>
    );
};

const InputSourceAssociation = ({ isRowExpanded, inputItem }) => (
    <StyledTableCell
        align="center"
        rowSpan={isRowExpanded ? inputItem.channels.length + 1 : 1}
    >
        {inputItem.parent.type === null ? (
            'No parent'
        ) : (
            <Tooltip
                title={getInputParentTypeTooltip(inputItem.parent.type)}
                placement="bottom"
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
                            <ChipConditionalLabel source="label" />
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
                            <ChipConditionalLabel source="label" />
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
            outputItem.channels.map(channel => (
                <StyledTableCell key={channel.label} />
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
}) => (
    <>
        <StyledTableCell key={inputChannel.label}>
            {inputChannel.label}
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
                                        title={
                                            <>
                                                <Typography variant="body1">
                                                    {'Input:'}
                                                </Typography>
                                                {[
                                                    inputName,
                                                    inputChannel.label,
                                                ].join(', ')}
                                                <Typography variant="body1">
                                                    {'Output:'}
                                                </Typography>
                                                {[
                                                    outputItem.properties.name,
                                                    outputChannel.label,
                                                ].join(', ')}
                                            </>
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

const MuteRow = ({
    outputs,
    mappingDisabled,
    handleMap,
    isMapped,
    isColExpanded,
}) => (
    <TableRow>
        <StyledTableCell align="center" colSpan={3}>
            {'MUTE'}
        </StyledTableCell>
        {outputs.map(([outputId, outputItem]) => {
            return isColExpanded(outputId) ? (
                outputItem.channels.map((channel, channelIndex) => (
                    <StyledTableCell align="center" key={channel.label}>
                        <Tooltip
                            title={
                                <>
                                    <Typography variant="body1">
                                        {'Input:'}
                                    </Typography>
                                    {'MUTE'}
                                    <Typography variant="body1">
                                        {'Output:'}
                                    </Typography>
                                    {[
                                        outputItem.properties.name,
                                        channel.label,
                                    ].join(', ')}
                                </>
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

const OutputsHeadRow = ({ outputs, io, isColExpanded, handleEpandCol }) => (
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
                        onClick={() => handleEpandCol(outputId)}
                        isExpanded={isColExpanded(outputId)}
                        title={
                            isColExpanded(outputId)
                                ? 'Hide channels'
                                : 'View channels'
                        }
                    />
                    <Tooltip
                        title={getOutputTooltipTitle(outputItem, io)}
                        placement="bottom"
                    >
                        <div>{outputItem.properties.name}</div>
                    </Tooltip>
                </StyledTableCell>
            ))}
        </TableRow>
        <TableRow>
            {outputs.map(([outputId, outputItem]) => {
                return isColExpanded(outputId)
                    ? outputItem.channels.map(channel => (
                          <StyledTableCell
                              align="center"
                              size="small"
                              key={channel.label}
                          >
                              {channel.label}
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
    handleEpandRow,
    isShow,
    handleMap,
    isMapped,
}) => {
    return inputs.map(([inputId, inputItem]) => (
        <Fragment key={inputId}>
            <TableRow>
                <InputSourceAssociation
                    isRowExpanded={isRowExpanded(inputId)}
                    inputItem={inputItem}
                />
                <StyledTableCell
                    rowSpan={
                        isRowExpanded(inputId)
                            ? inputItem.channels.length + 1
                            : 1
                    }
                    colSpan={isRowExpanded(inputId) ? 1 : 2}
                >
                    <CollapseButton
                        onClick={() => handleEpandRow(inputId)}
                        isExpanded={isRowExpanded(inputId)}
                        title={
                            isRowExpanded(inputId)
                                ? 'Hide channels'
                                : 'View channels'
                        }
                    />
                    <Tooltip
                        title={getInputTooltipTitle(inputItem)}
                        placement="bottom"
                    >
                        <div>{inputItem.properties.name}</div>
                    </Tooltip>
                </StyledTableCell>
                {!isRowExpanded(inputId) ? (
                    <EmptyCellsForCollapsedRow
                        outputs={outputs}
                        isColExpanded={isColExpanded}
                    />
                ) : inputItem.channels.length === 1 ? (
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
                    />
                ) : null}
            </TableRow>
            {isRowExpanded(inputId) &&
                inputItem.channels.length > 1 &&
                Object.entries(inputItem.channels).map(
                    ([inputChannelIndex, inputChannel]) => (
                        <TableRow key={[inputId, inputChannel.label].join('_')}>
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
                            />
                        </TableRow>
                    )
                )}
        </Fragment>
    ));
};

const sortByIOName = ioObject => {
    return Object.entries(ioObject).sort((ioItem1, ioItem2) =>
        ioItem1[1].properties.name.localeCompare(ioItem2[1].properties.name)
    );
};

const ChannelMappingMatrix = ({ record, isShow, mapping, handleMap }) => {
    const [expandedCols, setExpandedCols] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const handleEpandRow = inputId => {
        const currentExpandedRows = expandedRows;
        const isRowExpanded = currentExpandedRows.includes(inputId);
        const newExpandedRows = isRowExpanded
            ? currentExpandedRows.filter(id => id !== inputId)
            : currentExpandedRows.concat(inputId);
        setExpandedRows(newExpandedRows);
    };
    const handleEpandCol = outputId => {
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
    const io = get(record, '$io');
    const sorted_outputs = sortByIOName(get(io, `outputs`));
    const sorted_inputs = sortByIOName(get(io, `inputs`));
    return (
        <Table>
            <TableHead>
                <TableRow>
                    <StyledTableCell align="center" rowSpan={3} colSpan={3}>
                        {'INPUTS \\ OUTPUTS'}
                    </StyledTableCell>
                    <OutputSourceAssociation
                        outputs={sorted_outputs}
                        isExpanded={outputId => isColExpanded(outputId)}
                    />
                </TableRow>
                <OutputsHeadRow
                    outputs={sorted_outputs}
                    io={io}
                    isColExpanded={outputId => isColExpanded(outputId)}
                    handleEpandCol={handleEpandCol}
                />
            </TableHead>
            <TableBody>
                <MuteRow
                    outputs={sorted_outputs}
                    mappingDisabled={isShow}
                    handleMap={handleMap}
                    isMapped={isMapped}
                    isColExpanded={outputId => isColExpanded(outputId)}
                />
                <InputsRows
                    inputs={sorted_inputs}
                    outputs={sorted_outputs}
                    isColExpanded={outputId => isColExpanded(outputId)}
                    isRowExpanded={inputId => isRowExpanded(inputId)}
                    handleEpandRow={handleEpandRow}
                    isShow={isShow}
                    handleMap={handleMap}
                    isMapped={isMapped}
                />
            </TableBody>
        </Table>
    );
};

export default ChannelMappingMatrix;
