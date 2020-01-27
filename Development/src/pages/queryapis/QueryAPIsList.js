import React, { Fragment } from 'react';
import { makeStyles } from '@material-ui/core';
import { Datagrid, List, ShowButton, TextField } from 'react-admin';
import get from 'lodash/get';
import ConnectButton from '../../components/ConnectButton';
import ListActions from '../../components/ListActions';
import { resourceUrl } from '../../dataProvider';

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
                actions={<ListActions url={resourceUrl(props.resource)} />}
                bulkActionButtons={false}
                classes={classes}
                title="Query APIs"
                pagination={<Fragment />}
                {...props}
            >
                <Datagrid>
                    <ShowField label="Name" />
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
                    <ConnectButton variant="text" />
                </Datagrid>
            </List>
        </Fragment>
    );
};

export default QueryAPIsList;
