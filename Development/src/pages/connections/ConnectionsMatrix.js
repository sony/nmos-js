import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Divider,
    Table,
    TableBody,
    TableRow,
    Tooltip,
    Typography,
    withStyles,
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import { linkToRecord, useDataProvider, useNotify } from 'react-admin';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import uniq from 'lodash/uniq';

import {
    ConnectionRank,
    connectionRankMessage,
    rankConnection,
} from './connectionRank';

import CollapseButton from '../../components/CollapseButton';
import MappingButton from '../../components/MappingButton';
import useTableMaxHeight from '../../components/useTableMaxHeight';
import {
    CELL_EXTENT,
    CHIP_INSET,
    CHIP_MARGIN,
    COLLAPSE_BUTTON_SIZE,
    DiagonalEllipsisButton,
    HEADING_EXTENT,
    HorizontalEllipsisButton,
    HorizontalLinkChipField,
    MatrixCell,
    MatrixColumnHeadCell,
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

// the chip is inset by its own margin
const ConnectionsDeviceColumnHeadCell = withStyles({
    root: gridEdgeColumnHeadStyle({
        content: 'a > div',
        frame: CHIP_INSET,
        inset: CHIP_MARGIN,
    }),
})(MatrixColumnHeadCell);

const ConnectionsResourceColumnHeadCell = MatrixColumnHeadCell;

const ConnectionsDeviceRowHeadCell = withStyles(theme => ({
    root: {
        ...stickyHeadingStyle(theme, 0),
        // likewise the Device headings are the first cell of each row group,
        // so they draw the table's left edge
        borderLeft: cellLine(theme),
        // chip then collapse button, in the reading direction
        '& > div': {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'flex-end',
            overflow: 'hidden',
        },
        '& > div > a': {
            minWidth: 0,
        },
        // the chip's own margin spaces it from the button, as it does below
        // the chip in a column heading
        '& > div > button': {
            marginLeft: -CHIP_MARGIN,
        },
        // the chip shares the heading's width with the button beside it,
        // just as it shares a column heading with the button below it
        '& > div > a > div': {
            maxWidth:
                HEADING_EXTENT -
                CHIP_INSET -
                (COLLAPSE_BUTTON_SIZE - CHIP_MARGIN),
        },
        // a collapsed Device spans the resource heading too, so its chip can
        // be as wide as one spanning two row headings
        '&[colspan="2"] > div > a > div': {
            maxWidth:
                2 * HEADING_EXTENT -
                CHIP_INSET -
                (COLLAPSE_BUTTON_SIZE - CHIP_MARGIN),
        },
    },
}))(MatrixRowHeadCell);

const ConnectionsResourceRowHeadCell = withStyles(theme => ({
    root: stickyHeadingStyle(theme, HEADING_EXTENT),
}))(MatrixRowHeadCell);

const ConnectionsCornerCell = withStyles(theme => ({
    root: {
        ...matrixCornerCellStyle(theme, 2),
        ...matrixCornerStickyStyle,
    },
}))(TableHeadCell);

export const groupConnectionsResources = (
    resources,
    devices = {},
    autoSort = false
) => {
    const groups = Object.entries(groupBy(resources, 'device_id')).map(
        ([id, groupedResources]) => ({
            id,
            label: get(devices, [id, 'label']) || id,
            resources: autoSort
                ? [...groupedResources].sort((a, b) =>
                      (a.label || a.id).localeCompare(b.label || b.id)
                  )
                : groupedResources,
        })
    );
    return autoSort
        ? groups.sort((a, b) => a.label.localeCompare(b.label))
        : groups;
};

export const isActiveConnection = (sender, receiver, supportsActive = true) =>
    Boolean(
        get(receiver, 'subscription.sender_id') === sender.id &&
            (!supportsActive || get(receiver, 'subscription.active'))
    );

export const connectionsCornerLabels = swapAxes =>
    swapAxes
        ? { rows: 'RECEIVERS', columns: 'SENDERS' }
        : { rows: 'SENDERS', columns: 'RECEIVERS' };

const useConnectionDevices = (senders, receivers) => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const ids = useMemo(
        () =>
            uniq(
                [...senders, ...receivers]
                    .map(resource => resource.device_id)
                    .filter(Boolean)
            ),
        [senders, receivers]
    );
    const [devices, setDevices] = useState({});

    useEffect(() => {
        let active = true;
        if (ids.length === 0) {
            setDevices({});
            return () => {
                active = false;
            };
        }
        dataProvider
            .getMany('devices', { ids })
            .then(({ data }) => {
                if (active) {
                    setDevices(
                        Object.fromEntries(
                            data.map(device => [device.id, device])
                        )
                    );
                }
            })
            .catch(error => {
                if (active) {
                    notify(
                        error.message || 'Unable to load Devices',
                        'warning'
                    );
                }
            });
        return () => {
            active = false;
        };
    }, [dataProvider, ids, notify]);

    return devices;
};

const useConnectionFlows = senders => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const ids = useMemo(
        () => uniq(senders.map(sender => sender.flow_id).filter(Boolean)),
        [senders]
    );
    const [flows, setFlows] = useState({});

    useEffect(() => {
        let active = true;
        if (ids.length === 0) {
            setFlows({});
            return () => {
                active = false;
            };
        }
        dataProvider
            .getMany('flows', { ids })
            .then(({ data }) => {
                if (active) {
                    setFlows(
                        Object.fromEntries(data.map(flow => [flow.id, flow]))
                    );
                }
            })
            .catch(error => {
                if (active) {
                    notify(error.message || 'Unable to load Flows', 'warning');
                }
            });
        return () => {
            active = false;
        };
    }, [dataProvider, ids, notify]);

    return flows;
};

// linkToRecord rather than ReferenceField, which would make a new
// unnecessary network request for a record the matrix already has
const ResourceLink = ({ resource, id, children }) => (
    <Link to={`${linkToRecord(`/${resource}`, id)}/show`}>{children}</Link>
);

export const getConnectionsTableColumns = groups =>
    groups.flatMap(group =>
        group.units.map(unit =>
            unit.type === 'group' ? group.id : unit.resource.id
        )
    );

const renderedGroups = (groups, expanded) =>
    groups.map(group => ({
        ...group,
        units: expanded.includes(group.id)
            ? group.resources.map(resource => ({
                  group,
                  resource,
                  type: 'resource',
              }))
            : [{ group, type: 'group' }],
    }));

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

const ConnectionsCellTooltip = ({ sender, receiver, warning }) => (
    <>
        {'Sender'}
        <Typography variant="body2">{sender.label || sender.id}</Typography>
        {'Receiver'}
        <Typography variant="body2">{receiver.label || receiver.id}</Typography>
        {warning && (
            <>
                <TooltipDivider />
                {'Expected Constraint Violation'}
                <ConstraintWarning variant="body2">{warning}</ConstraintWarning>
            </>
        )}
    </>
);

const MatrixDot = ({ column, flows, row, senderRows, supportsActive }) => {
    if (row.type === 'group' && column.type === 'group') {
        return <DiagonalEllipsisButton disabled />;
    }
    if (row.type === 'group') return <VerticalEllipsisButton disabled />;
    if (column.type === 'group') return <HorizontalEllipsisButton disabled />;

    const sender = senderRows ? row.resource : column.resource;
    const receiver = senderRows ? column.resource : row.resource;
    const flow = sender.flow_id ? flows[sender.flow_id] || null : null;
    const rank = rankConnection(sender, receiver, flow);
    const warning =
        rank < ConnectionRank.Compatible ? connectionRankMessage(rank) : null;

    return (
        <Tooltip
            arrow
            placement="bottom-start"
            title={
                <ConnectionsCellTooltip
                    receiver={receiver}
                    sender={sender}
                    warning={warning}
                />
            }
        >
            <div>
                <MappingButton
                    checked={isActiveConnection(
                        sender,
                        receiver,
                        supportsActive
                    )}
                    constraintWarning={Boolean(warning)}
                    disabled
                />
            </div>
        </Tooltip>
    );
};

const ConnectionsMatrix = ({
    autoSort,
    expanded,
    receivers,
    senders,
    setExpanded,
    supportsActive,
    swapAxes,
}) => {
    const matrixTableRef = useRef(null);
    const matrixTableMaxHeight = useTableMaxHeight(matrixTableRef);
    const devices = useConnectionDevices(senders, receivers);
    const flows = useConnectionFlows(senders);
    const senderGroups = renderedGroups(
        groupConnectionsResources(senders, devices, autoSort),
        expanded.senders
    );
    const receiverGroups = renderedGroups(
        groupConnectionsResources(receivers, devices, autoSort),
        expanded.receivers
    );
    const rowGroups = swapAxes ? receiverGroups : senderGroups;
    const columnGroups = swapAxes ? senderGroups : receiverGroups;
    const rowResource = swapAxes ? 'receivers' : 'senders';
    const columnResource = swapAxes ? 'senders' : 'receivers';
    const labels = connectionsCornerLabels(swapAxes);
    const columns = getConnectionsTableColumns(columnGroups);

    const toggleExpanded = (resource, id) =>
        setExpanded(current => ({
            ...current,
            [resource]: current[resource].includes(id)
                ? current[resource].filter(expandedId => expandedId !== id)
                : current[resource].concat(id),
        }));

    return (
        <MatrixTableContainer
            ref={matrixTableRef}
            style={{ maxHeight: matrixTableMaxHeight }}
        >
            <Table
                style={matrixTableStyle(
                    2 * HEADING_EXTENT + columns.length * CELL_EXTENT
                )}
            >
                <colgroup>
                    <col style={{ width: HEADING_EXTENT }} />
                    <col style={{ width: HEADING_EXTENT }} />
                    {columns.map(key => (
                        <col key={key} style={{ width: CELL_EXTENT }} />
                    ))}
                </colgroup>
                <MatrixTableHead>
                    <TableRow>
                        <ConnectionsCornerCell rowSpan={2} colSpan={2}>
                            <span style={cornerRowsLabelStyle}>
                                {labels.rows}
                            </span>
                            <span style={cornerColumnsLabelStyle}>
                                {labels.columns}
                            </span>
                        </ConnectionsCornerCell>
                        {columnGroups.map(group => (
                            <ConnectionsDeviceColumnHeadCell
                                key={group.id}
                                colSpan={group.units.length}
                                rowSpan={
                                    group.units[0].type === 'group' ? 2 : 1
                                }
                                title={group.label}
                            >
                                <ResourceLink resource="devices" id={group.id}>
                                    <VerticalLinkChipField
                                        record={{ label: group.label }}
                                    />
                                </ResourceLink>
                                <CollapseButton
                                    isExpanded={group.units[0].type !== 'group'}
                                    onClick={() =>
                                        toggleExpanded(columnResource, group.id)
                                    }
                                    title={
                                        group.units[0].type === 'group'
                                            ? `View ${columnResource}`
                                            : `Hide ${columnResource}`
                                    }
                                />
                            </ConnectionsDeviceColumnHeadCell>
                        ))}
                    </TableRow>
                    <TableRow>
                        {columnGroups.flatMap(group =>
                            group.units
                                .filter(unit => unit.type === 'resource')
                                .map(unit => (
                                    <ConnectionsResourceColumnHeadCell
                                        key={unit.resource.id}
                                        title={
                                            unit.resource.label ||
                                            unit.resource.id
                                        }
                                    >
                                        <ResourceLink
                                            resource={columnResource}
                                            id={unit.resource.id}
                                        >
                                            <VerticalLinkChipField
                                                record={unit.resource}
                                            />
                                        </ResourceLink>
                                    </ConnectionsResourceColumnHeadCell>
                                ))
                        )}
                    </TableRow>
                </MatrixTableHead>
                <TableBody>
                    {rowGroups.flatMap(group =>
                        group.units.map((row, rowIndex) => (
                            <TableRow
                                key={
                                    row.type === 'group'
                                        ? group.id
                                        : row.resource.id
                                }
                            >
                                {rowIndex === 0 && (
                                    <ConnectionsDeviceRowHeadCell
                                        rowSpan={group.units.length}
                                        colSpan={row.type === 'group' ? 2 : 1}
                                        title={group.label}
                                    >
                                        <div>
                                            <ResourceLink
                                                resource="devices"
                                                id={group.id}
                                            >
                                                <HorizontalLinkChipField
                                                    record={{
                                                        label: group.label,
                                                    }}
                                                />
                                            </ResourceLink>
                                            <CollapseButton
                                                direction="horizontal"
                                                isExpanded={
                                                    row.type !== 'group'
                                                }
                                                onClick={() =>
                                                    toggleExpanded(
                                                        rowResource,
                                                        group.id
                                                    )
                                                }
                                                title={
                                                    row.type === 'group'
                                                        ? `View ${rowResource}`
                                                        : `Hide ${rowResource}`
                                                }
                                            />
                                        </div>
                                    </ConnectionsDeviceRowHeadCell>
                                )}
                                {row.type === 'resource' && (
                                    <ConnectionsResourceRowHeadCell
                                        title={
                                            row.resource.label ||
                                            row.resource.id
                                        }
                                    >
                                        <ResourceLink
                                            resource={rowResource}
                                            id={row.resource.id}
                                        >
                                            <HorizontalLinkChipField
                                                record={row.resource}
                                            />
                                        </ResourceLink>
                                    </ConnectionsResourceRowHeadCell>
                                )}
                                {columnGroups.flatMap(columnGroup =>
                                    columnGroup.units.map(column => (
                                        <MatrixCell
                                            key={
                                                column.type === 'group'
                                                    ? column.group.id
                                                    : column.resource.id
                                            }
                                        >
                                            <MatrixDot
                                                column={column}
                                                flows={flows}
                                                row={row}
                                                senderRows={!swapAxes}
                                                supportsActive={supportsActive}
                                            />
                                        </MatrixCell>
                                    ))
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </MatrixTableContainer>
    );
};

export default ConnectionsMatrix;
