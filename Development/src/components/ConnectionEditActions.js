import { CardActions } from '@material-ui/core';
import { ShowButton } from 'ra-ui-materialui';
import React from 'react';
import Link from 'react-router-dom/Link';

const cardActionStyle = {
    zIndex: 2,
    float: 'right',
};

export default function ConnectionEditActions({ basePath, id }) {
    return (
        <CardActions style={cardActionStyle}>
            <ShowButton component={Link} to={`${basePath}/${id}/show/staged`} />
        </CardActions>
    );
}
