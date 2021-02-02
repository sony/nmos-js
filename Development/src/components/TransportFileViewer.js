import React from 'react';
import { Card, CardContent, IconButton, Typography } from '@material-ui/core';
import { Labeled, useNotify } from 'react-admin';
import copy from 'clipboard-copy';
import get from 'lodash/get';
import { ContentCopyIcon } from '../icons';

const TransportFileViewer = ({ endpoint, ...props }) => {
    const notify = useNotify();
    const handleCopy = () => {
        copy(get(props.record, `${endpoint}`)).then(() => {
            notify('Transport file copied');
        });
    };

    if (!get(props.record, `${endpoint}`)) {
        return null;
    }

    return (
        <Labeled label="Transport File">
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
                        <Typography>
                            {get(props.record, `${endpoint}`)}
                        </Typography>
                    </pre>
                </CardContent>
            </Card>
        </Labeled>
    );
};

export default TransportFileViewer;
