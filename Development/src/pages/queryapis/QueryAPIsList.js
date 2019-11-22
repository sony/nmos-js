import React, { Fragment } from 'react';
import { Datagrid, List, ShowButton, TextField } from 'react-admin';
import ConnectButton from '../../components/ConnectButton';

const QueryAPIsTitle = ({ record }) => {
    return <span>Query APIs{record ? `: ${record.name}` : ''}</span>;
};

const QueryAPIsList = props => (
    <List
        title={<QueryAPIsTitle />}
        exporter={true}
        bulkActionButtons={false}
        pagination={<Fragment />}
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

export default QueryAPIsList;
