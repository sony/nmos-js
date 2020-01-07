import React, { Fragment } from 'react';
import {
    ListButton,
    ShowView,
    SimpleShowLayout,
    TextField,
    Toolbar,
    TopToolbar,
    useShowController,
} from 'react-admin';
import { makeStyles } from '@material-ui/core';
import ConnectButton from '../../components/ConnectButton';
import ItemArrayField from '../../components/ItemArrayField';
import RawButton from '../../components/RawButton';

const QueryAPIsTitle = ({ record }) => {
    return <span>Query API{record ? `: ${record.name}` : ''}</span>;
};

const QueryAPIsShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<QueryAPIsTitle />}>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

const useStyles = makeStyles({
    toolbar: {
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '0px',
    },
});

const QueryAPIsShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowView
            title={<QueryAPIsTitle />}
            actions={<QueryAPIsShowActions />}
            {...controllerProps}
            {...props}
        >
            <Fragment>
                <SimpleShowLayout {...props} {...controllerProps}>
                    <TextField source="name" />
                    <hr />
                    <TextField label="Host Target" source="host_target" />
                    <ItemArrayField source="addresses" />
                    <TextField source="port" />
                    <hr />
                    <TextField label="API Protocol" source="txt.api_proto" />
                    <TextField label="API Versions" source="txt.api_ver" />
                    <TextField label="Priority" source="txt.pri" />
                </SimpleShowLayout>
                <Toolbar classes={useStyles()}>
                    <Fragment>
                        <ConnectButton record={controllerProps.record} />
                    </Fragment>
                </Toolbar>
            </Fragment>
        </ShowView>
    );
};

export default QueryAPIsShow;
