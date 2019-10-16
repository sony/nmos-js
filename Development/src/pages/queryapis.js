import React from 'react';
import {
    Datagrid,
    List,
    ListButton,
    RichTextField,
    Show,
    ShowButton,
    SimpleShowLayout,
    TextField,
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

const SettingsPagination = () => {
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
        pagination={<SettingsPagination />}
        {...props}
    >
        <Datagrid>
            <ShowButton label="" />

            <TextField source="name" sortable={false} />
            <TextField source="port" sortable={false} />
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
            <TextField label="Host Target" source="host_target" />
            <TextField source="port" />
            <hr />
            <TextField label="API Protocol" source="txt.api_proto" />
            <TextField label="API Versions" source="txt.api_ver" />
            <TextField label="Priority" source="txt.pri" />
        </SimpleShowLayout>
    </Show>
);
