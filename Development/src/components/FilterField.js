import React from 'react';
import { Button, Grow } from '@material-ui/core';
import ContentFilter from '@material-ui/icons/FilterList';

class FilterField extends React.Component {
    constructor(props) {
        super(props);

        this.sendValue = this.sendValue.bind(this);
        this.toggleClass = this.toggleClass.bind(this);
        this.state = {
            expanded: false,
            value: '',
        };
    }

    sendValue(event) {
        this.setState({ value: event.target.value });
        this.props.setFilter(event.target.value, this.props.name);
    }
    toggleClass() {
        const currentState = this.state.expanded;
        window.setTimeout(function() {
            document.getElementById('filter').select();
        }, 0);
        this.setState({ expanded: !currentState });
    }
    render() {
        return (
            <span>
                <Grow in={this.state.expanded} timeout={250}>
                    <input
                        autoFocus
                        id="filter"
                        className={
                            this.state.expanded ? 'search.expanded' : 'search'
                        }
                        type="text"
                        style={{
                            width: '160px',
                            borderRadius: '3px',
                            border: 'solid 1px #2196f3',
                        }}
                        placeholder="Filter: None"
                        onChange={this.sendValue}
                    />
                </Grow>
                <span>
                    <Button
                        className="addFilter"
                        style={
                            this.state.value === ''
                                ? {
                                      maxWidth: '30px',
                                      maxHeight: '30px',
                                      minWidth: '30px',
                                      minHeight: '30px',
                                  }
                                : {
                                      maxWidth: '30px',
                                      maxHeight: '30px',
                                      minWidth: '30px',
                                      minHeight: '30px',
                                      color: '#2196f3',
                                  }
                        }
                        onClick={this.toggleClass}
                    >
                        <ContentFilter
                            style={{
                                transform: 'translatey(-3px)',
                                maxWidth: '20px',
                                maxHeight: '20px',
                                minWidth: '20px',
                                minHeight: '20px',
                            }}
                        />
                    </Button>
                </span>
            </span>
        );
    }
}

export default FilterField;
