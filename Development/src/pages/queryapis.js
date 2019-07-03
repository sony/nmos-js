import React from 'react';
import {
    TextField,
    RichTextField,
    Datagrid,
    Show,
    List,
    SimpleShowLayout,
    ListButton,
    ShowButton,
} from 'react-admin';
import ConnectButton from '../components/ConnectButton';
import { CardActions, hr } from '@material-ui/core';

const SettingsTitle = ({ record }) => {
    return <span> Settings {record ? `${record.name}` : ''}</span>;
};

const cardActionsStyle = {
    zIndex: 2,
    float: 'right',
};

const SettingsShowActions = ({ basePath }) => (
    <CardActions title={<SettingsTitle />} style={cardActionsStyle}>
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </CardActions>
);

const SettingsPagination2 = () => {
    return (
        <p>
            <br />
        </p>
    );
};

const SettingsActions = ({
    bulkActions,
    basePath,
    displayedFilters,
    filters,
    filterValues,
    onUnselectItems,
    resource,
    selectedIds,
    showFilter,
}) => (
    <CardActions>
        {bulkActions &&
            React.cloneElement(bulkActions, {
                basePath,
                filterValues,
                resource,
                selectedIds,
                onUnselectItems,
            })}
        {filters &&
            React.cloneElement(filters, {
                resource,
                showFilter,
                displayedFilters,
                filterValues,
                context: 'button',
            })}
    </CardActions>
);

export const SettingsList = props => (
    <List
        title={<SettingsTitle />}
        actions={<SettingsActions />}
        bulkActionButtons={false}
        pagination={<SettingsPagination2 />}
        {...props}
    >
        <Datagrid>
            <ShowButton label="" />

            <TextField source="name" sortable={false} />
            <TextField label="Port" source="port" sortable={false} />
            <TextField
                label="API Versions"
                source="txt.api_ver"
                sortable={false}
            />
            <TextField label="Priority" source="txt.pri" sortable={false} />
            <ConnectButton />
        </Datagrid>
    </List>
);

export const SettingsShow = props => (
    <Show
        title={<SettingsTitle />}
        actions={<SettingsShowActions />}
        {...props}
    >
        <SimpleShowLayout>
            <br />
            <ConnectButton />
            <TextField source="name" />
            <hr />
            <RichTextField source="addresses" />
            <TextField source="host_target" />
            <TextField source="port" />
            <hr />
            <TextField source="txt.api_proto" />
            <TextField source="txt.api_ver" />
            <TextField source="txt.pri" />
        </SimpleShowLayout>
    </Show>
);
