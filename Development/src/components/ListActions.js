import React from 'react';
import { Button, TopToolbar } from 'react-admin';
import { useTheme } from '@material-ui/styles';
import JsonIcon from '../icons/JsonIcon';

const ListActions = ({ url }) => {
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
                    title={'View raw'}
                >
                    <JsonIcon />
                </Button>
            )}
        </TopToolbar>
    );
};

export default ListActions;
