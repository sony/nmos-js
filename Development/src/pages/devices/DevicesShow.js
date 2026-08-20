import { Fragment, useEffect, useState } from 'react';
import {
    ArrayField,
    BooleanField,
    Loading,
    ReferenceArrayField,
    ReferenceField,
    ReferenceManyField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
    useNotify,
    useRecordContext,
    useRefresh,
    useShowController,
} from 'react-admin';
import {
    Button,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    Typography,
} from '@material-ui/core';
import { Link, Route } from 'react-router-dom';
import { get, isEmpty, map } from 'lodash';
import { useTheme } from '@material-ui/styles';
import LinkChipField from '../../components/LinkChipField';
import ObjectField from '../../components/ObjectField';
import {
    CONTROL_TYPES,
    DEVICE_TYPES,
    ParameterField,
    TAGS,
    unversionedParameter,
} from '../../components/ParameterRegisters';
import ResourceTitle from '../../components/ResourceTitle';
import SanitizedDivider from '../../components/SanitizedDivider';
import TAIField from '../../components/TAIField';
import UnsortableDatagrid from '../../components/UnsortableDatagrid';
import UrlField from '../../components/URLField';
import { CancelScheduledActivationIcon } from '../../icons';
import labelize from '../../components/labelize';
import dataProvider from '../../dataProvider';
import {
    buildIs12BrowserLaunchUrl,
    is12BrowserUrl,
    queryVersion,
} from '../../settings';
import MappingShowActions from '../../components/MappingShowActions';
import ChannelMappingMatrix from './ChannelMappingMatrix';

// Channel Mapping tabs, and the Channel Mapping API data each one needs
const channelMappingTabs = {
    active_map: '$io',
    activations: '$activations',
};

export const DevicesShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <DevicesShowView {...props} />
        </ShowContextProvider>
    );
};

const DevicesShowView = props => {
    const { record } = useRecordContext();
    const [useChannelMappingAPI, setChannelMappingAPI] = useState(false);
    useEffect(() => {
        if (get(record, '$channelmappingAPI') !== undefined) {
            setChannelMappingAPI(true);
        } else {
            setChannelMappingAPI(false);
        }
    }, [record]);

    useEffect(() => {
        return function cleanup() {
            window.localStorage.removeItem('Channel Mapping Expanded');
        };
    }, []);
    const theme = useTheme();
    const tabBackgroundColor =
        theme.palette.type === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900];
    return (
        <>
            <div style={{ display: 'flex' }}>
                <Paper
                    style={{
                        alignSelf: 'flex-end',
                        background: tabBackgroundColor,
                    }}
                >
                    <Tabs
                        value={props.location.pathname}
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab
                            label="Summary"
                            value={`${props.match.url}`}
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/`}
                        />
                        {Object.entries(channelMappingTabs).map(
                            ([key, source]) => (
                                <Tab
                                    key={key}
                                    label={labelize(key)}
                                    value={`${props.match.url}/${key}`}
                                    component={Link}
                                    to={`${props.basePath}/${props.id}/show/${key}`}
                                    disabled={
                                        !get(record, source) ||
                                        !useChannelMappingAPI
                                    }
                                />
                            )
                        )}
                    </Tabs>
                </Paper>
                <span style={{ flexGrow: 1 }} />
                <MappingShowActions {...props} />
            </div>
            <Route exact path={`${props.basePath}/${props.id}/show/`}>
                <ShowSummaryTab record={record} {...props} />
            </Route>
            <Route exact path={`${props.basePath}/${props.id}/show/active_map`}>
                <ShowActiveMapTab record={record} {...props} />
            </Route>
            <Route
                exact
                path={`${props.basePath}/${props.id}/show/activations`}
            >
                <ShowActivationsTab record={record} {...props} />
            </Route>
        </>
    );
};

const ControlAddressField = ({ record, source = 'href', deviceLabel }) => {
    const href = get(record, source);
    const isDeviceControlProtocol =
        unversionedParameter(get(record, 'type')) === 'urn:x-nmos:control:ncp';

    if (isDeviceControlProtocol) {
        const launchUrl = buildIs12BrowserLaunchUrl(href, deviceLabel);
        const disabled = !is12BrowserUrl() || !launchUrl;

        if (disabled) {
            return (
                <Typography
                    color="textSecondary"
                    variant="body2"
                    title="Set IS-12 Browser in Settings"
                >
                    {href}
                </Typography>
            );
        }

        return (
            <Typography
                color="textPrimary"
                component="a"
                href="#"
                variant="body2"
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                title={`Open IS-12 Browser\n${href}`}
                onClick={event => {
                    event.preventDefault();
                    window.open(launchUrl, '_blank', 'noopener,noreferrer');
                }}
            >
                {href}
            </Typography>
        );
    }

    return <UrlField record={record} source={source} />;
};
ControlAddressField.defaultProps = {
    addLabel: true,
};

const ShowSummaryTab = ({ record, ...props }) => {
    return (
        <ShowView {...props} title={<ResourceTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                <TAIField source="version" />
                <TextField source="label" />
                {queryVersion() >= 'v1.1' && <TextField source="description" />}
                {queryVersion() >= 'v1.1' && (
                    <ObjectField register={TAGS} source="tags" />
                )}
                <SanitizedDivider />
                <ParameterField source="type" register={DEVICE_TYPES} />
                {queryVersion() >= 'v1.1' && (
                    <ArrayField source="controls">
                        <UnsortableDatagrid>
                            <ControlAddressField
                                source="href"
                                label="Address"
                                deviceLabel={record?.label}
                            />
                            <ParameterField
                                source="type"
                                register={CONTROL_TYPES}
                            />
                            {queryVersion() >= 'v1.3' && (
                                <BooleanField source="authorization" />
                            )}
                        </UnsortableDatagrid>
                    </ArrayField>
                )}
                <ReferenceField
                    label="Node"
                    source="node_id"
                    reference="nodes"
                    link="show"
                >
                    <LinkChipField />
                </ReferenceField>
                <ReferenceArrayField source="receivers" reference="receivers">
                    <SingleFieldList linkType="show">
                        <LinkChipField />
                    </SingleFieldList>
                </ReferenceArrayField>
                <ReferenceArrayField source="senders" reference="senders">
                    <SingleFieldList linkType="show">
                        <LinkChipField />
                    </SingleFieldList>
                </ReferenceArrayField>
                <ReferenceManyField
                    label="Sources"
                    reference="sources"
                    target="device_id"
                >
                    <SingleFieldList linkType="show">
                        <LinkChipField />
                    </SingleFieldList>
                </ReferenceManyField>
                <ReferenceManyField
                    label="Flows"
                    reference="flows"
                    target="device_id"
                >
                    <SingleFieldList linkType="show">
                        <LinkChipField />
                    </SingleFieldList>
                </ReferenceManyField>
            </SimpleShowLayout>
        </ShowView>
    );
};

const ShowActiveMapTab = ({ record, ...props }) => {
    if (!get(record, '$active.map')) return <Loading />;
    return (
        <ShowView {...props} title={<ResourceTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <ChannelMappingMatrix
                    record={record}
                    isShow={true}
                    mapping={get(record, '$active.map')}
                />
            </SimpleShowLayout>
        </ShowView>
    );
};

// the changed output channels of a pending activation, e.g. 'output0 (0, 1)'
const actionSummary = action =>
    map(
        action,
        (channels, outputId) =>
            `${outputId} (${Object.keys(channels).join(', ')})`
    ).join('; ');

const CancelActivationButton = ({ record, activationId }) => {
    const notify = useNotify();
    const refresh = useRefresh();
    const [cancelling, setCancelling] = useState(false);
    return (
        <Button
            color="primary"
            disabled={cancelling}
            onClick={async () => {
                setCancelling(true);
                try {
                    await dataProvider('DELETE', 'devices', {
                        id: record.id,
                        activationId,
                        previousData: record,
                    });
                    notify('Channel Mapping activation cancelled', 'info');
                    refresh();
                } catch (error) {
                    notify(error.toString(), 'warning');
                    setCancelling(false);
                }
            }}
            startIcon={<CancelScheduledActivationIcon />}
        >
            Cancel
        </Button>
    );
};

// cf. ObjectField
const ActivationsField = ({ record, source }) => {
    const activations = get(record, source);
    if (isEmpty(activations)) {
        return (
            <Typography variant="body2">{'No pending activations'}</Typography>
        );
    }
    return (
        <Table size="small">
            <TableHead>
                <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Requested Time</TableCell>
                    <TableCell>Activation Time</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell />
                </TableRow>
            </TableHead>
            <TableBody>
                {map(activations, (activation, activationId) => (
                    <TableRow key={activationId}>
                        <TableCell>{activationId}</TableCell>
                        <TableCell>
                            {get(activation, 'activation.mode')}
                        </TableCell>
                        <TableCell>
                            <TAIField
                                record={activation}
                                source="activation.requested_time"
                                mode="activation.mode"
                            />
                        </TableCell>
                        <TableCell>
                            <TAIField
                                record={activation}
                                source="activation.activation_time"
                            />
                        </TableCell>
                        <TableCell>
                            {actionSummary(get(activation, 'action'))}
                        </TableCell>
                        <TableCell>
                            <CancelActivationButton
                                record={record}
                                activationId={activationId}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};
ActivationsField.defaultProps = {
    addLabel: true,
};

const ShowActivationsTab = ({ record, ...props }) => {
    if (!record || get(record, '$activations') === undefined) {
        return <Loading />;
    }
    return (
        <ShowView {...props} title={<ResourceTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <ActivationsField label="Pending" source="$activations" />
            </SimpleShowLayout>
        </ShowView>
    );
};

export default DevicesShow;
