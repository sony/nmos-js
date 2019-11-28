import React from 'react';
import Link from 'react-router-dom/Link';
import { ShowButton, TopToolbar } from 'react-admin';
import { useTheme } from '@material-ui/styles';

export default function ConnectionEditActions({ basePath, id }) {
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
            <ShowButton
                label={'Show'}
                component={Link}
                to={`${basePath}/${id}/show/staged`}
            />
        </TopToolbar>
    );
}
