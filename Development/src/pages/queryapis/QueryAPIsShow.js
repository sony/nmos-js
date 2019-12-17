import React, { Fragment } from 'react';
import {
    Button,
    ListButton,
    ShowView,
    SimpleShowLayout,
    TextField,
    Toolbar,
    TopToolbar,
    useShowController,
} from 'react-admin';
import { makeStyles } from '@material-ui/core';
import Cookies from 'universal-cookie';
import ConnectButton from '../../components/ConnectButton';
import ItemArrayField from '../../components/ItemArrayField';
import JsonIcon from '../../icons/JsonIcon';

const cookies = new Cookies();

const QueryAPIsTitle = ({ record }) => {
    return <span>Query API{record ? `: ${record.name}` : ''}</span>;
};

const QueryAPIsShowActions = ({ basePath, data }) => (
    <TopToolbar title={<QueryAPIsTitle />}>
        {data ? (
            <Button
                label={'Raw'}
                onClick={() =>
                    window.open(
                        cookies.get('DNS-SD API') +
                            '/_nmos-query._tcp/' +
                            data.id,
                        '_blank'
                    )
                }
                rel="noopener noreferrer"
                title={'View raw'}
            >
                <JsonIcon />
            </Button>
        ) : null}
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
                    <div />
                    <ItemArrayField source="addresses" />
                    <TextField label="Host Target" source="host_target" />
                    <TextField source="port" />
                    <div />
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
