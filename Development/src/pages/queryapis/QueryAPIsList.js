import React from 'react';
import { CardActions } from '@material-ui/core';
import { Datagrid, List, ShowButton, TextField } from 'react-admin';
import ConnectButton from '../../components/ConnectButton';

const QueryAPITitle = ({ record }) => {
    return <span>Query APIs{record ? `: ${record.name}` : ''}</span>;
};

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

const QueryAPIList = props => (
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

export default QueryAPIList;
