import { Fragment, useEffect, useState } from 'react';
import {
    ArrayField,
    BooleanField,
    FunctionField,
    Loading,
    ReferenceArrayField,
    ReferenceField,
    ReferenceManyField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
    useRecordContext,
    useShowController,
} from 'react-admin';
import { Paper, Tab, Tabs } from '@material-ui/core';
import { Link, Route } from 'react-router-dom';
import get from 'lodash/get';
import { useTheme } from '@material-ui/styles';
import LinkChipField from '../../components/LinkChipField';
import MapObject from '../../components/ObjectField';
import {
    CONTROL_TYPES,
    DEVICE_TYPES,
    ParameterField,
} from '../../components/ParameterRegisters';
import ResourceTitle from '../../components/ResourceTitle';
import SanitizedDivider from '../../components/SanitizedDivider';
import TAIField from '../../components/TAIField';
import UnsortableDatagrid from '../../components/UnsortableDatagrid';
import UrlField from '../../components/URLField';
import labelize from '../../components/labelize';
import { queryVersion } from '../../settings';
import MappingShowActions from '../../components/MappingShowActions';
import ChannelMappingMatrix from './ChannelMappingMatrix';

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
                        {['active_map'].map(key => (
                            <Tab
                                key={key}
                                label={labelize(key)}
                                value={`${props.match.url}/${key}`}
                                component={Link}
                                to={`${props.basePath}/${props.id}/show/${key}`}
                                disabled={
                                    !get(record, '$io') || !useChannelMappingAPI
                                }
                            />
                        ))}
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
        </>
    );
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
                    <FunctionField
                        label="Tags"
                        render={record =>
                            Object.keys(record.tags).length > 0
                                ? MapObject(record, 'tags')
                                : null
                        }
                    />
                )}
                <SanitizedDivider />
                <ParameterField source="type" register={DEVICE_TYPES} />
                {queryVersion() >= 'v1.1' && (
                    <ArrayField source="controls">
                        <UnsortableDatagrid>
                            <UrlField source="href" label="Address" />
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

export default DevicesShow;
