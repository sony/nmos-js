import React from 'react';
import { Button, CreateButton, TopToolbar } from 'react-admin';
import { useTheme } from '@material-ui/styles';
import JsonIcon from '../icons/JsonIcon';

const ListActions = ({ basePath, hasCreate, url }) => {
    const theme = useTheme();
    return (
        <TopToolbar
            style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                paddingTop: theme.spacing(4),
                paddingBottom: 0,
                paddingRight: theme.spacing(2),
                minHeight: theme.spacing(5),
            }}
        >
            {url && (
                <Button
                    label={'Raw'}
                    onClick={() => window.open(url, '_blank')}
                    rel="noopener noreferrer"
                    style={{ float: 'right' }}
                    title={`View raw\n${url}`}
                >
                    <JsonIcon />
                </Button>
            )}
            {hasCreate && <CreateButton basePath={basePath} />}
        </TopToolbar>
    );
};

export default ListActions;
