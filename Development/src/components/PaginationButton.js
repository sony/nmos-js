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
    PREV: ChevronLeft,
    NEXT: ChevronRight,
    LAST: LastPage,
    FIRST: FirstPage,
};

class PaginationButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.enabled = true;
        this.firstLoad = this.firstLoad.bind(this);
        this.onClick = this.onClick.bind(this);
        this.firstLoad();
    }
    async firstLoad() {
        var paginationSupport = cookies.get('Pagination');

        if (paginationSupport === 'enabled') {
            this.enabled = true;
        } else if (paginationSupport === 'disabled') {
            this.enabled = false;
        } else {
            // paginationSupport === 'partial'
            this.enabled =
                this.props.label === 'NEXT' || this.props.label === 'PREV';
        }
    }

    getIcon(label) {
        const ButtonIcon = components[label];
        return <ButtonIcon style={{ transform: 'rotate(270deg)' }} />;
    }

    onClick() {
        this.props.nextPage(this.props.label);
    }

    render() {
        return (
            <Button
                onClick={this.onClick}
                label={this.props.label}
                disabled={!this.enabled}
            >
                {this.getIcon(this.props.label)}
                {this.props.label}
            </Button>
        );
    }
}

export default PaginationButton;
