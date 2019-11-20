import React from 'react';
import { CardActions, hr } from '@material-ui/core';
import {
    ListButton,
    RichTextField,
    Show,
    SimpleShowLayout,
    TextField,
} from 'react-admin';
import ConnectButton from '../../components/ConnectButton';

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

const QueryAPIShow = props => (
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

export default QueryAPIShow;
