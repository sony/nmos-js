import { Fragment, useEffect, useState } from 'react';
import {
    ArrayField,
    BooleanField,
    Datagrid,
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
import ResourceTitle from '../../components/ResourceTitle';
import TAIField from '../../components/TAIField';
import UrlField from '../../components/URLField';
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
                        {['active_map'].map(label => (
                            <Tab
                                key={label}
                                value={`${props.match.url}/${label}`}
                                component={Link}
                                to={`${props.basePath}/${props.id}/show/${label}`}
                                disabled={
                                    !get(record, '$io') || !useChannelMappingAPI
                                }
                                label={label.replace('_', ' ')}
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
                <ShowActiveMapTab deviceData={record} {...props} />
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
                <hr />
                <TextField source="type" />
                {queryVersion() >= 'v1.1' && (
                    <ArrayField source="controls">
                        <Datagrid>
                            <UrlField source="href" label="Address" />
                            <TextField source="type" />
                            {queryVersion() >= 'v1.3' && (
                                <BooleanField source="authorization" />
                            )}
                        </Datagrid>
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

const ShowActiveMapTab = ({ deviceData, ...props }) => {
    if (!get(deviceData, '$active.map')) return <Loading />;
    return (
        <ShowView {...props} title={<ResourceTitle />} actions={<Fragment />}>
            <SimpleShowLayout>
                <ChannelMappingMatrix
                    record={deviceData}
                    isShow={true}
                    mapping={get(deviceData, '$active.map')}
                />
            </SimpleShowLayout>
        </ShowView>
    );
};

export default DevicesShow;
