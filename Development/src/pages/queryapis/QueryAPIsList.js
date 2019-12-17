import React, { Fragment } from 'react';
import { makeStyles } from '@material-ui/core';
import { Datagrid, List, ShowButton, TextField } from 'react-admin';
import get from 'lodash/get';
import Cookies from 'universal-cookie';
import ConnectButton from '../../components/ConnectButton';
import ListActions from '../../components/ListActions';

const cookies = new Cookies();

const ShowField = ({ record = {}, basePath }) => (
    <ShowButton
        style={{
            textTransform: 'none',
        }}
        basePath={basePath}
        record={record}
        label={get(record, 'name')}
    />
);

const useStyles = makeStyles(theme => ({
    content: {
        padding: '16px',
        marginTop: 0,
        transition: theme.transitions.create('margin-top'),
        position: 'relative',
        flex: '1 1 auto',
        [theme.breakpoints.down('xs')]: {
            boxShadow: 'none',
        },
    },
}));

const QueryAPIsList = props => {
    const classes = useStyles();
    return (
        <Fragment>
            <List
                actions={
                    <ListActions
                        url={cookies.get('DNS-SD API') + '/_nmos-query._tcp'}
                    />
                }
                bulkActionButtons={false}
                classes={classes}
                title="Query APIs"
                pagination={<Fragment />}
                {...props}
            >
                <Datagrid>
                    <ShowField label="Label" />
                    <TextField source="port" sortable={false} />
                    <TextField
                        label="API Versions"
                        source="txt.api_ver"
                        sortable={false}
                    />
                    <TextField
                        label="Priority"
                        source="txt.pri"
                        sortable={false}
                    />
                    <ConnectButton />
                </Datagrid>
            </List>
        </Fragment>
    );
};

export default QueryAPIsList;
