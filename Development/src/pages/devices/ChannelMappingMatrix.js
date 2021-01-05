import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@material-ui/core';
import {
    ReferenceField,
    ReferenceManyField,
    SingleFieldList,
} from 'react-admin';
import get from 'lodash/get';
import ChipConditionalLabel from '../../components/ChipConditionalLabel';
import MappingButton from '../../components/MappingButton';
import CollapseButton from '../../components/CollapseButton';

const get_output_caps = (output_item, io) => {
    return (
        <>
            <Typography variant="body1">{'Description:'}</Typography>
            {output_item.properties.description}
            <Typography variant="body1">{'Routable inputs:'}</Typography>
            {output_item.caps.routable_inputs !== null
                ? output_item.caps.routable_inputs
                      .map(input_name => {
                          return input_name === null
                              ? 'MUTE'
                              : get(io, `inputs.${input_name}.properties.name`);
                      })
                      .join(', ')
                : 'null'}
        </>
    );
};

const get_input_caps = input_item => {
    return (
        <>
            <Typography variant="body1">{'Description:'}</Typography>
            {get(input_item, `properties.description`)}
            <Typography variant="body1">{'Block size:'}</Typography>
            {get(input_item, `caps.block_size`)}
            <Typography variant="body1">{'Reordering:'}</Typography>
            {String(get(input_item, `caps.reordering`))}
        </>
    );
};

const get_source_tooltip = output_item => {
    return (
        <>
            <Typography variant="body1">{'Flows:'} </Typography>
            <div>
                <ReferenceManyField
                    record={output_item}
                    basePath="/flows"
                    label="Flows"
                    source="source_id"
                    reference="flows"
                    target="source_id"
                    link="show"
                >
                    <div
                        style={{
                            margin: 5,
                            padding: 10,
                        }}
                    >
                        <SingleFieldList linkType="show">
                            <ChipConditionalLabel source="label" />
                        </SingleFieldList>
                    </div>
                </ReferenceManyField>
            </div>
            <Typography variant="body1">{'Senders:'} </Typography>
            <div
                style={{
                    margin: 2,
                    padding: 1,
                }}
            >
                <ReferenceManyField
                    record={output_item}
                    basePath="/flows"
                    label="Flows"
                    source="source_id"
                    reference="flows"
                    target="source_id"
                >
                    <SingleFieldList>
                        <ReferenceManyField
                            label="Senders"
                            basePath="/senders"
                            source="id"
                            target="flow_id"
                            reference="senders"
                            link="show"
                        >
                            <div
                                style={{
                                    margin: 5,
                                    padding: 10,
                                }}
                            >
                                <SingleFieldList linkType="show">
                                    <ChipConditionalLabel source="label" />
                                </SingleFieldList>
                            </div>
                        </ReferenceManyField>
                    </SingleFieldList>
                </ReferenceManyField>
            </div>
        </>
    );
};

const OutputSourceAssociation = ({ outputs, isExpend }) =>
    outputs.map(([output_name, output_item]) => (
        <TableCell
            align="center"
            colSpan={isExpend(output_name) ? output_item.channels.length : 1}
        >
            {get(output_item, `source_id`) ? (
                <Tooltip
                    interactive
                    title={get_source_tooltip(output_item)}
                    placement="bottom"
                    link
                >
                    <div>
                        <ReferenceField
                            record={output_item}
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
            ) : null}
        </TableCell>
    ));

const InputSourceAssociation = ({ isRowExpanded, input_item }) => (
    <TableCell
        align="center"
        rowSpan={isRowExpanded ? input_item.channels.length + 1 : 1}
    >
        {input_item.parent.type === 'source' ? (
            <ReferenceField
                record={input_item}
                basePath="/sources"
                label="Sources"
                source="parent.id"
                reference="sources"
                link="show"
            >
                <ChipConditionalLabel source="label" />
            </ReferenceField>
        ) : input_item.parent.type === 'receiver' ? (
            <ReferenceField
                record={input_item}
                basePath="/receivers"
                label="Receivers"
                source="parent.id"
                reference="receivers"
                link="show"
            >
                <ChipConditionalLabel source="label" />
            </ReferenceField>
        ) : null}
    </TableCell>
);

const FillEmptyCellsForCollapseRow = ({ outputs, isColExpanded }) =>
    outputs.map(([output_name, output_item]) => {
        return isColExpanded(output_name) ? (
            output_item.channels.map(() => <TableCell />)
        ) : (
            <TableCell />
        );
    });

const InputChannelsMappingRows = ({
    input_item,
    input_nmos_name,
    outputs,
    isColExpanded,
    mapping_disabeld,
    handleMap,
    isMapped,
}) => {
    return Object.entries(input_item.channels).map(([input_index, channel]) => (
        <TableRow>
            <TableCell size="small">{channel.label}</TableCell>
            <>
                {outputs.map(([output_nmos_name, output_item]) => {
                    return isColExpanded(output_nmos_name) ? (
                        output_item.channels.map((output_channel, index) => {
                            return (
                                <TableCell align="center">
                                    <Tooltip
                                        title={
                                            <>
                                                <Typography variant="body1">
                                                    {'Input Channel: '}
                                                </Typography>
                                                {channel.label}
                                                <Typography variant="body1">
                                                    {'Output Channel: '}
                                                </Typography>
                                                {output_channel.label}
                                            </>
                                        }
                                        placement="bottom"
                                    >
                                        <div>
                                            <MappingButton
                                                disabeld={mapping_disabeld}
                                                onClick={() =>
                                                    handleMap(
                                                        input_nmos_name,
                                                        output_nmos_name,
                                                        input_index,
                                                        index
                                                    )
                                                }
                                                isMapped={isMapped(
                                                    input_nmos_name,
                                                    output_nmos_name,
                                                    input_index,
                                                    index
                                                )}
                                            />
                                        </div>
                                    </Tooltip>
                                </TableCell>
                            );
                        })
                    ) : (
                        <TableCell align="right">{''}</TableCell>
                    );
                })}
            </>
        </TableRow>
    ));
};

const MuteRow = ({
    outputs,
    mapping_disabeld,
    handleMap,
    isMapped,
    isColExpanded,
}) => (
    <TableRow>
        <TableCell align="center" colSpan={3}>
            {'MUTE'}
        </TableCell>
        {outputs.map(([output_name, output_item]) => {
            return isColExpanded(output_name) ? (
                output_item.channels.map((channel, index) => (
                    <TableCell align="center">
                        <Tooltip
                            title={
                                <>
                                    <Typography variant="body1">
                                        {'Input Channel: '}
                                    </Typography>
                                    {'MUTE'}
                                    <Typography variant="body1">
                                        {'Output Channel: '}
                                    </Typography>
                                    {channel.label}
                                </>
                            }
                            placement="bottom"
                        >
                            <div>
                                <MappingButton
                                    disabeld={mapping_disabeld}
                                    onClick={() =>
                                        handleMap(
                                            null,
                                            output_name,
                                            null,
                                            index
                                        )
                                    }
                                    isMapped={isMapped(
                                        null,
                                        output_name,
                                        null,
                                        index
                                    )}
                                />
                            </div>
                        </Tooltip>
                    </TableCell>
                ))
            ) : (
                <TableCell />
            );
        })}
    </TableRow>
);

const OutputsHeadRow = ({ outputs, io, isColExpanded, handleEpandCol }) => (
    <>
        <TableRow>
            {outputs.map(([output_name, output_item]) => (
                <TableCell
                    size="small"
                    align="center"
                    colSpan={
                        isColExpanded(output_name)
                            ? output_item.channels.length
                            : 1
                    }
                    rowSpan={isColExpanded(output_name) ? 1 : 2}
                >
                    <CollapseButton
                        onClick={() => handleEpandCol(output_name)}
                        isExpand={isColExpanded(output_name)}
                    />
                    <Tooltip
                        title={get_output_caps(output_item, io)}
                        placement="bottom"
                    >
                        <div>{output_item.properties.name}</div>
                    </Tooltip>
                </TableCell>
            ))}
        </TableRow>
        <TableRow>
            {outputs.map(([output_name, output_item]) => {
                return isColExpanded(output_name)
                    ? output_item.channels.map(channel => (
                          <TableCell align="center" size="small">
                              {channel.label}
                          </TableCell>
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
    is_show,
    handleMap,
    isMapped,
}) => {
    return inputs.map(([input_name, input_item]) => (
        <>
            <TableRow>
                <InputSourceAssociation
                    isRowExpanded={isRowExpanded(input_name)}
                    input_item={input_item}
                />
                <TableCell
                    size="small"
                    rowSpan={
                        isRowExpanded(input_name)
                            ? input_item.channels.length + 1
                            : 1
                    }
                    colSpan={isRowExpanded(input_name) ? 1 : 2}
                >
                    <CollapseButton
                        onClick={() => handleEpandRow(input_name)}
                        isExpand={isRowExpanded(input_name)}
                    />
                    <Tooltip
                        title={get_input_caps(input_item)}
                        placement="bottom"
                    >
                        <div>{input_item.properties.name}</div>
                    </Tooltip>
                </TableCell>
                {!isRowExpanded(input_name) && (
                    <FillEmptyCellsForCollapseRow
                        outputs={outputs}
                        isColExpanded={isColExpanded}
                    />
                )}
            </TableRow>
            {isRowExpanded(input_name) && (
                <InputChannelsMappingRows
                    input_item={input_item}
                    input_nmos_name={input_name}
                    outputs={outputs}
                    isColExpanded={isColExpanded}
                    mapping_disabeld={is_show}
                    handleMap={handleMap}
                    isMapped={isMapped}
                />
            )}
        </>
    ));
};

const SortByIOName = io_object => {
    return Object.entries(io_object).sort((io_item1, io_item2) =>
        io_item1[1].properties.name.localeCompare(io_item2[1].properties.name)
    );
};

const ChannelMappingMatrix = ({ record, is_show, mapping, handleMap }) => {
    const [expandedCols, setExpandedCols] = useState([]);
    const [expandedRows, setExpandedRows] = useState([]);
    const handleEpandRow = input_name => {
        const currentExpandedRows = expandedRows;
        const isRowExpanded = currentExpandedRows.includes(input_name);
        const newExpandedRows = isRowExpanded
            ? currentExpandedRows.filter(name => name !== input_name)
            : currentExpandedRows.concat(input_name);
        setExpandedRows(newExpandedRows);
    };
    const handleEpandCol = output_name => {
        const currentExpandedCols = expandedCols;
        const isColExpanded = currentExpandedCols.includes(output_name);
        const newExpandedCols = isColExpanded
            ? currentExpandedCols.filter(name => name !== output_name)
            : currentExpandedCols.concat(output_name);
        setExpandedCols(newExpandedCols);
    };
    const isRowExpanded = input_name => {
        return expandedRows.includes(input_name);
    };
    const isColExpanded = output_name => {
        return expandedCols.includes(output_name);
    };
    const isMapped = (
        input_name,
        output_name,
        input_channel,
        output_channel
    ) => {
        return (
            input_name ===
                get(mapping, `${output_name}.${output_channel}.input`) &&
            String(input_channel) ===
                String(
                    get(
                        mapping,
                        `${output_name}.${output_channel}.channel_index`
                    )
                )
        );
    };
    const io = get(record, '$io');
    const sorted_outputs = SortByIOName(get(io, `outputs`));
    const sorted_inputs = SortByIOName(get(io, `inputs`));
    return (
        <Table border={1}>
            <TableHead>
                <TableRow>
                    <TableCell
                        size="small"
                        align="center"
                        rowSpan={3}
                        colSpan={3}
                    >
                        {'INPUTS \\ OUTPUTS'}
                    </TableCell>
                    <OutputSourceAssociation
                        outputs={sorted_outputs}
                        isExpend={output => isColExpanded(output)}
                    />
                </TableRow>
                <OutputsHeadRow
                    outputs={sorted_outputs}
                    io={io}
                    isColExpanded={output => isColExpanded(output)}
                    handleEpandCol={handleEpandCol}
                />
            </TableHead>
            <TableBody>
                <MuteRow
                    outputs={sorted_outputs}
                    mapping_disabeld={is_show}
                    handleMap={handleMap}
                    isMapped={isMapped}
                    isColExpanded={output => isColExpanded(output)}
                />
                <InputsRows
                    inputs={sorted_inputs}
                    outputs={sorted_outputs}
                    isColExpanded={output => isColExpanded(output)}
                    isRowExpanded={input => isRowExpanded(input)}
                    handleEpandRow={handleEpandRow}
                    is_show={is_show}
                    handleMap={handleMap}
                    isMapped={isMapped}
                />
            </TableBody>
        </Table>
    );
};

export default ChannelMappingMatrix;
