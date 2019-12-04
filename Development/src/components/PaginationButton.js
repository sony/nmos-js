import React from 'react';
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

const PaginationButton = props => {
    const label = props.label.toLowerCase();
    const paginationSupport = cookies.get('Pagination');
    const enabled = (() => {
        if (props.disabled) return false;
        if (paginationSupport === 'enabled') {
            return true;
        } else if (paginationSupport === 'disabled') {
            return false;
        } else {
            // paginationSupport === 'partial'
            return label === 'next' || label === 'prev';
        }
    })();

    const getIcon = label => {
        const ButtonIcon = components[label];
        return <ButtonIcon style={{ transform: 'rotate(270deg)' }} />;
    };

    return (
        <Button
            onClick={() => props.nextPage(label)}
            label={label}
            disabled={!enabled}
        >
            {getIcon(label)}
            {label}
        </Button>
    );
};

export default PaginationButton;
