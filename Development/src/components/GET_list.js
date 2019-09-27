import { Button, GET_LIST } from 'react-admin';
import React from 'react';
import dataProvider from '../dataProvider';

class GET_button extends React.Component {
    handleClick = () => {
        dataProvider(GET_LIST, this.props.path);
    };

    render() {
        return (
            <Button
                path={this.props.path}
                cursor={this.props.cursor}
                label={this.props.cursor}
                onClick={this.handleClick}
            />
        );
    }
}
export default GET_button;
