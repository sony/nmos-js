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

const QueryAPITitle = ({ record }) => {
    return <span>Query APIs{record ? `: ${record.name}` : ''}</span>;
};

const cardActionsStyle = {
    zIndex: 2,
    float: 'right',
};

const QueryAPIShowActions = ({ basePath }) => (
    <CardActions title={<QueryAPITitle />} style={cardActionsStyle}>
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </CardActions>
);

const QueryAPIPagination = () => {
    return (
        <p>
            <br />
        </p>
    );
};

const QueryAPIActions = ({
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

export const QueryAPIList = props => (
    <List
        title={<QueryAPITitle />}
        actions={<QueryAPIActions />}
        bulkActionButtons={false}
        pagination={<QueryAPIPagination />}
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

export const QueryAPIShow = props => (
    <Show
        title={<QueryAPITitle />}
        actions={<QueryAPIShowActions />}
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
