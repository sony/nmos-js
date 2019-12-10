import React, { Fragment } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    FirstPage,
    LastPage,
} from '@material-ui/icons';
import { Button } from '@material-ui/core';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

const components = {
    prev: ChevronLeft,
    next: ChevronRight,
    last: LastPage,
    first: FirstPage,
};

export const PaginationButton = ({ disabled, label, nextPage, rel }) => {
    rel.toLowerCase();
    const paginationSupport = cookies.get('Pagination');
    const enabled = (() => {
        if (disabled) return false;
        if (paginationSupport === 'enabled') {
            return true;
        } else if (paginationSupport === 'disabled') {
            return false;
        } else {
            // paginationSupport === 'partial'
            return rel === 'next' || rel === 'prev';
        }
    })();

    const getIcon = label => {
        const ButtonIcon = components[label];
        return <ButtonIcon style={{ transform: 'rotate(270deg)' }} />;
    };

    return (
        <Button onClick={() => nextPage(rel)} label={label} disabled={!enabled}>
            {getIcon(rel)}
            {label}
        </Button>
    );
};

const PaginationButtons = props => (
    <Fragment>
        <PaginationButton label="First" rel="first" {...props} />
        <PaginationButton label="Prev" rel="prev" {...props} />
        <PaginationButton label="Next" rel="next" {...props} />
        <PaginationButton label="Last" rel="last" {...props} />
    </Fragment>
);

export default PaginationButtons;
