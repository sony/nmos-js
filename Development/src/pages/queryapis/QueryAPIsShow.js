import React from 'react';
import { hr } from '@material-ui/core';
import {
    ListButton,
    RichTextField,
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
} from 'react-admin';
import ConnectButton from '../../components/ConnectButton';

const QueryAPIsTitle = ({ record }) => {
    return <span>Query APIs{record ? `: ${record.name}` : ''}</span>;
};

const QueryAPIsShowActions = ({ basePath }) => (
    <TopToolbar title={<QueryAPIsTitle />}>
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

const QueryAPIsShow = props => (
    <Show
        title={<QueryAPIsTitle />}
        actions={<QueryAPIsShowActions />}
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

export default QueryAPIsShow;
