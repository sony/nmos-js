import React from 'react';
import { Card, CardContent, IconButton, Typography } from '@material-ui/core';
import { Labeled, useNotify } from 'react-admin';
import copy from 'clipboard-copy';
import get from 'lodash/get';
import { ContentCopyIcon } from '../icons';

const TransportFileViewer = ({ endpoint, ...props }) => {
    const notify = useNotify();
    const handleCopy = () => {
        copy(data).then(() => {
            notify('Transport file copied');
        });
    };

    const data = get(props.record, endpoint);
    if (!data) {
        return (
            <Labeled label="Transport File Data">
                <span />
            </Labeled>
        );
    }

    return (
        <Labeled label="Transport File Data">
            <Card elevation={3}>
                <CardContent>
                    <IconButton
                        onClick={handleCopy}
                        style={{ float: 'right' }}
                        title="Copy"
                    >
                        <ContentCopyIcon fontSize="small" />
                    </IconButton>
                    <pre style={{ fontFamily: 'inherit' }}>
                        <Typography>{data}</Typography>
                    </pre>
                </CardContent>
            </Card>
        </Labeled>
    );
};

export default TransportFileViewer;
