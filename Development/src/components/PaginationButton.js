import React from 'react';
import {
    ChevronLeft,
    ChevronRight,
    FirstPage,
    LastPage,
} from '@material-ui/icons';
import { Button } from '@material-ui/core';

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
        this.onClick = this.onClick.bind(this);
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
            <Button onClick={this.onClick} label={this.props.label}>
                {this.getIcon(this.props.label)}
                {this.props.label}
            </Button>
        );
    }
}

export default PaginationButton;
