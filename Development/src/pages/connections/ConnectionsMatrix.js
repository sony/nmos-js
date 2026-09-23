import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import {
    Divider,
    IconButton,
    Menu,
    MenuItem,
    Table,
    TableBody,
    TableRow,
    Tooltip,
    Typography,
    withStyles,
} from '@material-ui/core';
import FilterListIcon from '@material-ui/icons/FilterList';
import { unstable_batchedUpdates } from 'react-dom';
import { Link } from 'react-router-dom';
import {
    linkToRecord,
    useDataProvider,
    useNotify,
    useRefresh,
    useVersion,
} from 'react-admin';
import get from 'lodash/get';
import groupBy from 'lodash/groupBy';
import uniq from 'lodash/uniq';

import {
    ConnectionRank,
    connectionRankMessage,
    rankConnection,
} from './connectionRank';
import {
    receiverEssenceFromSender,
    senderEssenceFromReceiver,
} from './connectionHeadingMatch';

import CollapseButton from '../../components/CollapseButton';
import ActiveField from '../../components/ActiveField';
import MappingButton from '../../components/MappingButton';
import makeConnection from '../../components/makeConnection';
import dataProvider from '../../dataProvider';
import useTableMaxHeight from '../../components/useTableMaxHeight';
import { CONNECTION_API_NOT_AVAILABLE } from '../../components/controlApiMessages';
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
import {
    FORMATS,
    TRANSPORTS,
    parameterLabel,
} from '../../components/ParameterRegisters';
import {
    FRIENDLY_PARAMETERS,
    QUERY_API,
    apiUsingRql,
    queryVersion,
    useJSONSetting,
} from '../../settings';

// the match button is smaller than the collapse arrow, so the port name
// stays the subject of the heading
const MATCH_ICON_SIZE = 16;
const MATCH_ICON_PADDING = 2;
const MATCH_BUTTON_SIZE = MATCH_ICON_SIZE + 2 * MATCH_ICON_PADDING;

// the chip is inset by its own margin
const ConnectionsDeviceColumnHeadCell = withStyles({
    root: gridEdgeColumnHeadStyle({
        content: 'a > div',
        frame: CHIP_INSET,
        inset: CHIP_MARGIN,
    }),
})(MatrixColumnHeadCell);

const ConnectionsResourceColumnHeadCell = withStyles({
    root: gridEdgeColumnHeadStyle({
        button: MATCH_BUTTON_SIZE,
        content: 'a > div',
        frame: CHIP_INSET,
        inset: CHIP_MARGIN,
    }),
})(MatrixColumnHeadCell);

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
    root: {
        ...stickyHeadingStyle(theme, HEADING_EXTENT),
        '& > div': {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'flex-end',
            overflow: 'hidden',
        },
        '& > div > a': {
            minWidth: 0,
        },
        '& > div > button': {
            marginLeft: -CHIP_MARGIN,
        },
        '& > div > a > div': {
            maxWidth:
                HEADING_EXTENT - CHIP_INSET - (MATCH_BUTTON_SIZE - CHIP_MARGIN),
        },
    },
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
    const version = useVersion();
    // senders/receivers are a new array every parent render, so a useMemo
    // on those would still be a new ids array; getMany only when the set
    // of ids or a page refresh actually changed
    const idsKey = [
        ...uniq(
            [...senders, ...receivers]
                .map(resource => resource.device_id)
                .filter(Boolean)
        ),
    ]
        .sort()
        .join(',');
    const [devices, setDevices] = useState({});

    useEffect(() => {
        let active = true;
        const ids = idsKey ? idsKey.split(',') : [];
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
    }, [dataProvider, idsKey, notify, version]);

    return devices;
};

const useConnectionFlows = senders => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const version = useVersion();
    // same as devices: senders is a new array every parent render
    const idsKey = [
        ...uniq(senders.map(sender => sender.flow_id).filter(Boolean)),
    ]
        .sort()
        .join(',');
    const [flows, setFlows] = useState({});
    const [flowsLoaded, setFlowsLoaded] = useState(false);

    useEffect(() => {
        let active = true;
        const ids = idsKey ? idsKey.split(',') : [];
        if (ids.length === 0) {
            setFlows({});
            setFlowsLoaded(true);
            return () => {
                active = false;
            };
        }
        setFlowsLoaded(false);
        dataProvider
            .getMany('flows', { ids })
            .then(({ data }) => {
                if (active) {
                    setFlows(
                        Object.fromEntries(data.map(flow => [flow.id, flow]))
                    );
                    setFlowsLoaded(true);
                }
            })
            .catch(error => {
                if (active) {
                    notify(error.message || 'Unable to load Flows', 'warning');
                    setFlowsLoaded(true);
                }
            });
        return () => {
            active = false;
        };
    }, [dataProvider, idsKey, notify, version]);

    return { flows, flowsLoaded };
};

// linkToRecord rather than ReferenceField, which would make a new
// unnecessary network request for a record the matrix already has
const ResourceLink = forwardRef(({ resource, id, children, ...props }, ref) => (
    <Link ref={ref} to={`${linkToRecord(`/${resource}`, id)}/show`} {...props}>
        {children}
    </Link>
));

const PortTooltip = ({ flow, resource, resourceName, supportsActive }) => {
    const [friendly] = useJSONSetting(FRIENDLY_PARAMETERS, false);
    const transport = parameterLabel(TRANSPORTS, resource.transport, friendly);
    const format = parameterLabel(
        FORMATS,
        (flow && flow.format) || resource.format,
        friendly
    );
    return (
        <>
            {'ID'}
            <Typography variant="body2">{resource.id}</Typography>
            {resource.label && (
                <>
                    {'Label'}
                    <Typography variant="body2">{resource.label}</Typography>
                </>
            )}
            {(transport || format) && <TooltipDivider />}
            {format && (
                <>
                    {'Format'}
                    <Typography variant="body2">{format}</Typography>
                </>
            )}
            {transport && (
                <>
                    {'Transport'}
                    <Typography variant="body2">{transport}</Typography>
                </>
            )}
            {supportsActive && (
                <>
                    {'Active'}
                    {
                        // the switch is the value here, so it belongs under
                        // the name like the other values, not beside it
                    }
                    <div>
                        <ActiveField
                            record={resource}
                            resource={resourceName}
                            size="small"
                        />
                    </div>
                </>
            )}
        </>
    );
};

const PortHeading = ({
    Chip,
    flow,
    id,
    resource,
    resourceName,
    supportsActive,
}) => (
    <Tooltip
        arrow
        // the Active switch is in here, so the pointer has to be able to
        // reach it, as on the Channel Mapping headings
        interactive
        placement="bottom-start"
        title={
            <PortTooltip
                flow={flow}
                resource={resource}
                resourceName={resourceName}
                supportsActive={supportsActive}
            />
        }
    >
        <ResourceLink resource={resourceName} id={id}>
            <Chip record={resource} />
        </ResourceLink>
    </Tooltip>
);

const headingMatchTitle = (fromResource, usingRql) => {
    const base =
        fromResource === 'senders'
            ? "Filter receivers to this sender's transport and format."
            : "Filter senders to this receiver's transport, format, and caps.";
    return usingRql
        ? base
        : `${base} Media-type and transport subclass matching need RQL.`;
};

// the heading's own name is the subject; match is an aside so the glyph
// is smaller than the collapse arrow, in the same ink as other actions
const MatchIconButton = withStyles(theme => ({
    root: {
        color: theme.palette.action.active,
        fontSize: MATCH_ICON_SIZE,
        padding: MATCH_ICON_PADDING,
    },
}))(IconButton);

const HeadingMatchButton = ({ disabled, onClick, title }) => (
    <MatchIconButton
        disabled={disabled}
        onClick={event => {
            event.preventDefault();
            event.stopPropagation();
            onClick();
        }}
        size="small"
        title={title}
    >
        <FilterListIcon fontSize="inherit" />
    </MatchIconButton>
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

const ConnectionsCellTooltip = ({
    noConnectionApi,
    receiver,
    sender,
    warning,
}) => (
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
        {noConnectionApi && (
            <>
                <TooltipDivider />
                {'Connection API'}
                <Typography variant="body2">Not available.</Typography>
            </>
        )}
    </>
);

const notifyConnectionError = (notify, error) => {
    if (error && error.hasOwnProperty('body')) {
        notify(
            get(error.body, 'error') +
                ' - ' +
                get(error.body, 'code') +
                ' - ' +
                get(error.body, 'debug'),
            'warning'
        );
    }
    notify(error.toString(), 'warning');
};

const unlinkReceiver = receiverId =>
    dataProvider('GET_ONE', 'receivers', { id: receiverId }).then(
        ({ data }) => {
            if (!data.hasOwnProperty('$staged')) {
                throw new Error(CONNECTION_API_NOT_AVAILABLE);
            }
            return dataProvider('UPDATE', 'receivers', {
                id: data.id,
                data: {
                    ...data,
                    $staged: {
                        ...get(data, '$staged'),
                        master_enable: false,
                        activation: { mode: 'activate_immediate' },
                    },
                },
                previousData: data,
            });
        }
    );

const MatrixDot = ({
    column,
    flows,
    noConnectionApi,
    onActivate,
    onUnlink,
    row,
    senderRows,
    supportsActive,
}) => {
    const [hovered, setHovered] = useState(false);
    const cellRef = useRef(null);

    // mounting the Tooltip replaces the node the pointer entered. A pointer
    // that has already moved on then leaves that old node, not this cell, so
    // without watching mousemove a tooltip can stay after a fast sweep
    useEffect(() => {
        if (!hovered) return undefined;
        const close = event => {
            const cell = cellRef.current && cellRef.current.closest('td');
            if (cell && !cell.contains(event.target)) setHovered(false);
        };
        document.addEventListener('mousemove', close);
        return () => document.removeEventListener('mousemove', close);
    }, [hovered]);

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
    const checked = isActiveConnection(sender, receiver, supportsActive);

    // this div keeps enter/leave across that remount, and takes the pointer
    // when the button is disabled, as Material-UI asks of a tooltip on a
    // disabled control
    const cell = (
        <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            ref={cellRef}
        >
            <MappingButton
                checked={checked}
                constraintWarning={Boolean(warning)}
                disabled={noConnectionApi}
                onClick={event =>
                    checked
                        ? onUnlink(receiver)
                        : onActivate(sender, receiver, event)
                }
            />
        </div>
    );

    // wrapping every cell in Tooltip would be tens of thousands of them, so
    // a cell makes one when the pointer arrives
    return hovered ? (
        <Tooltip
            arrow
            open
            placement="bottom-start"
            title={
                <ConnectionsCellTooltip
                    noConnectionApi={noConnectionApi}
                    receiver={receiver}
                    sender={sender}
                    warning={warning}
                />
            }
        >
            {cell}
        </Tooltip>
    ) : (
        cell
    );
};

// useState for this menu on the matrix re-renders every cell when it opens
const ConnectionsLegMenu = forwardRef(({ onSelectLeg }, ref) => {
    const [menu, setMenu] = useState(null);

    useImperativeHandle(ref, () => ({
        open: setMenu,
        close: () => setMenu(null),
    }));

    return (
        <Menu
            anchorEl={menu && menu.anchorEl}
            keepMounted
            onClose={() => setMenu(null)}
            open={Boolean(menu)}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
        >
            {menu &&
                [...Array(menu.legs).keys()].map(leg => (
                    <MenuItem
                        key={leg}
                        onClick={() =>
                            onSelectLeg(
                                menu.senderId,
                                menu.receiverId,
                                leg,
                                menu.sender,
                                menu.receiver
                            )
                        }
                        style={{ fontSize: '0.875rem' }}
                    >
                        Leg {leg + 1}
                    </MenuItem>
                ))}
        </Menu>
    );
});

const ConnectionsMatrix = ({
    autoSort,
    expanded,
    onMatchReceivers,
    onMatchSenders,
    receivers,
    senders,
    setExpanded,
    supportsActive,
    swapAxes,
}) => {
    const matrixTableRef = useRef(null);
    const matrixTableMaxHeight = useTableMaxHeight(matrixTableRef);
    const devices = useConnectionDevices(senders, receivers);
    const { flows, flowsLoaded } = useConnectionFlows(senders);
    const refresh = useRefresh();
    const notify = useNotify();
    // a write in flight must not be joined by another. useState for that,
    // passed into every cell as disabled, re-renders the whole matrix twice
    // per click
    const busy = useRef(false);
    const [noConnectionApi, setNoConnectionApi] = useState({});
    const legMenu = useRef(null);
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

    const matchOpts = {
        usingRql: apiUsingRql(QUERY_API),
        version: queryVersion(),
    };

    const matchFromPort = resource => port => {
        if (resource === 'senders') {
            const flow = port.flow_id ? flows[port.flow_id] : null;
            const essence = receiverEssenceFromSender(port, flow, matchOpts);
            if (essence) onMatchReceivers(essence);
            return;
        }
        onMatchSenders(senderEssenceFromReceiver(port, matchOpts));
    };

    const senderMatchDisabled = port =>
        !(port.flow_id && flowsLoaded && flows[port.flow_id]);

    // React 17 does not batch updates from a promise, so notify, refresh and
    // closing the menu would each re-render the matrix in turn
    const finishWrite = () => {
        busy.current = false;
        unstable_batchedUpdates(() => {
            notify('Element updated', 'info');
            refresh();
            legMenu.current.close();
        });
    };

    const failWrite = (receiverId, error) => {
        busy.current = false;
        unstable_batchedUpdates(() => {
            legMenu.current.close();
            if (
                error &&
                error.message === CONNECTION_API_NOT_AVAILABLE &&
                error.resource !== 'senders'
            ) {
                setNoConnectionApi(current => ({
                    ...current,
                    [receiverId]: true,
                }));
            }
            notifyConnectionError(notify, error);
        });
    };

    const connectPair = (
        senderId,
        receiverId,
        senderLeg,
        senderData,
        receiverData
    ) => {
        busy.current = true;
        const options = {
            ...(senderLeg === undefined ? {} : { singleSenderLeg: senderLeg }),
            ...(senderData && receiverData
                ? { sender: senderData, receiver: receiverData }
                : {}),
        };
        makeConnection(senderId, receiverId, 'active', options)
            .then(finishWrite)
            .catch(error => failWrite(receiverId, error));
    };

    const onActivate = (sender, receiver, event) => {
        if (busy.current) return;
        const ref = event.currentTarget;
        busy.current = true;
        Promise.all([
            dataProvider('GET_ONE', 'senders', { id: sender.id }),
            dataProvider('GET_ONE', 'receivers', { id: receiver.id }),
        ])
            .then(([{ data: senderData }, { data: receiverData }]) => {
                if (!receiverData.hasOwnProperty('$staged')) {
                    throw new Error(CONNECTION_API_NOT_AVAILABLE);
                }
                const receiverLegs = get(
                    receiverData,
                    '$staged.transport_params.length'
                );
                const senderLegs = get(
                    senderData,
                    '$staged.transport_params.length'
                );
                if (receiverLegs === 1 && senderLegs > 1) {
                    busy.current = false;
                    legMenu.current.open({
                        anchorEl: ref,
                        legs: senderLegs,
                        receiver: receiverData,
                        receiverId: receiver.id,
                        sender: senderData,
                        senderId: sender.id,
                    });
                    return;
                }
                return makeConnection(sender.id, receiver.id, 'active', {
                    sender: senderData,
                    receiver: receiverData,
                }).then(finishWrite);
            })
            .catch(error => failWrite(receiver.id, error));
    };

    const onUnlink = receiver => {
        if (busy.current) return;
        busy.current = true;
        unlinkReceiver(receiver.id)
            .then(finishWrite)
            .catch(error => failWrite(receiver.id, error));
    };

    return (
        <>
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
                                    <ResourceLink
                                        resource="devices"
                                        id={group.id}
                                    >
                                        <VerticalLinkChipField
                                            record={{ label: group.label }}
                                        />
                                    </ResourceLink>
                                    <CollapseButton
                                        isExpanded={
                                            group.units[0].type !== 'group'
                                        }
                                        onClick={() =>
                                            toggleExpanded(
                                                columnResource,
                                                group.id
                                            )
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
                                        >
                                            <PortHeading
                                                Chip={VerticalLinkChipField}
                                                flow={
                                                    flows[unit.resource.flow_id]
                                                }
                                                id={unit.resource.id}
                                                resource={unit.resource}
                                                resourceName={columnResource}
                                                supportsActive={supportsActive}
                                            />
                                            <HeadingMatchButton
                                                disabled={
                                                    columnResource ===
                                                        'senders' &&
                                                    senderMatchDisabled(
                                                        unit.resource
                                                    )
                                                }
                                                onClick={() =>
                                                    matchFromPort(
                                                        columnResource
                                                    )(unit.resource)
                                                }
                                                title={headingMatchTitle(
                                                    columnResource,
                                                    matchOpts.usingRql
                                                )}
                                            />
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
                                            colSpan={
                                                row.type === 'group' ? 2 : 1
                                            }
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
                                        <ConnectionsResourceRowHeadCell>
                                            <div>
                                                <PortHeading
                                                    Chip={
                                                        HorizontalLinkChipField
                                                    }
                                                    flow={
                                                        flows[
                                                            row.resource.flow_id
                                                        ]
                                                    }
                                                    id={row.resource.id}
                                                    resource={row.resource}
                                                    resourceName={rowResource}
                                                    supportsActive={
                                                        supportsActive
                                                    }
                                                />
                                                <HeadingMatchButton
                                                    disabled={
                                                        rowResource ===
                                                            'senders' &&
                                                        senderMatchDisabled(
                                                            row.resource
                                                        )
                                                    }
                                                    onClick={() =>
                                                        matchFromPort(
                                                            rowResource
                                                        )(row.resource)
                                                    }
                                                    title={headingMatchTitle(
                                                        rowResource,
                                                        matchOpts.usingRql
                                                    )}
                                                />
                                            </div>
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
                                                    noConnectionApi={Boolean(
                                                        column.type ===
                                                            'resource' &&
                                                            row.type ===
                                                                'resource' &&
                                                            noConnectionApi[
                                                                swapAxes
                                                                    ? row
                                                                          .resource
                                                                          .id
                                                                    : column
                                                                          .resource
                                                                          .id
                                                            ]
                                                    )}
                                                    onActivate={onActivate}
                                                    onUnlink={onUnlink}
                                                    row={row}
                                                    senderRows={!swapAxes}
                                                    supportsActive={
                                                        supportsActive
                                                    }
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
            <ConnectionsLegMenu onSelectLeg={connectPair} ref={legMenu} />
        </>
    );
};

export default ConnectionsMatrix;
