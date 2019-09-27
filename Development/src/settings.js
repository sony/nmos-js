import React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import Cookies from 'universal-cookie';

import { changePaging, returnChangeQuery } from './dataProvider';
import { FormControlLabel, Switch } from '@material-ui/core';

const cookies = new Cookies();
let x = '';

class Settings extends React.Component {
    state = {
        open: false,
        vertical: 'top',
        horizontal: 'center',
        checked: false,
        rql: this.getBool(cookies.get('RQL')),
        theme: 'light',
    };

    getBool(cookie) {
        if (cookie === 'false') {
            return false;
        } else {
            return true;
        }
    }

    handleClickQuery = state => () => {
        this.setState({ open: true, ...state });
        this.queryApiSave();
    };

    handeClickResetQuery = state => () => {
        this.setState({ open: true, ...state });
        this.queryApiReset();
    };

    handleClickEvents = state => () => {
        this.setState({ open: true, ...state });
        this.eventFunctionSave();
    };

    handleClickResetEvents = state => () => {
        this.setState({ open: true, ...state });
        this.eventFunctionReset();
    };

    handleClickDns = state => () => {
        this.setState({ open: true, ...state });
        this.dnsSave();
    };

    handleClickResetDns = state => () => {
        this.setState({ open: true, ...state });
        this.dnsReset();
    };

    handleClickPaging = state => () => {
        this.setState({ open: true, ...state });
        this.pagingSave();
    };

    handleClickResetPaging = state => () => {
        this.setState({ open: true, ...state });
        this.pagingReset();
    };

    handleClose = reason => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({ open: false });
    };

    advancedRqlMode = state => event => {
        this.setState({ rql: event.target.checked }, function() {
            if (!this.state.rql) {
                cookies.set('RQL', false, { path: '/' });
                x = 'RQL Disabled';
            }
            if (this.state.rql) {
                cookies.set('RQL', true, { path: '/' });
                x = 'RQL Enabled';
            }
            this.setState({ open: true, ...state });
        });
    };

    queryApiSave = () => {
        x = document.getElementById('queryApiInput').value;
        document.getElementById('queryApiInput').placeholder = x;
        returnChangeQuery('Query API', x);
    };

    queryApiReset = () => {
        x = returnChangeQuery('Query API', 'reset');
        document.getElementById('queryApiInput').value = x;
    };

    eventFunctionSave = () => {
        x = document.getElementById('loggingApiInput').value;
        document.getElementById('loggingApiInput').placeholder = x;
        returnChangeQuery('Logging API', x);
    };

    eventFunctionReset = () => {
        x = returnChangeQuery('Logging API', 'reset');
        document.getElementById('loggingApiInput').value = x;
    };

    dnsSave = () => {
        x = document.getElementById('dnsApiInput').value;
        document.getElementById('dnsApiInput').placeholder = x;
        returnChangeQuery('DNS-SD API', x);
    };

    dnsReset = () => {
        x = returnChangeQuery('DNS-SD API', 'reset');
        document.getElementById('dnsApiInput').value = x;
    };

    pagingSave = () => {
        x = document.getElementById('pagingLimitInput').value;
        document.getElementById('pagingLimitInput').placeholder = x;
        changePaging(x);
        cookies.set('Paging Limit', x, { path: '/' });
    };

    pagingReset = () => {
        x = null;
        document.getElementById('pagingLimitInput').value = x;
        document.getElementById('pagingLimitInput').placeholder = 'Default';
        changePaging(undefined);
        cookies.set('Paging Limit', '', { path: '/' });
    };

    handleChange = name => event => {
        this.setState({ [name]: event.target.checked });
        this.invert();
    };

    handleChangeRQL = name => event => {
        this.setState({ [name]: event.target.checked }, () => {
            this.advancedRqlMode(this.state.rql);
        });
    };

    invert() {
        if (this.state.theme === 'light') {
            this.setState({ theme: 'dark' });
            document.documentElement.style.webkitFilter = 'invert(90%)';
            document.getElementById('sealion').style.webkitFilter =
                'invert(90%)';
        } else {
            this.setState({ theme: 'light' });
            document.documentElement.style.webkitFilter = 'invert(0)';
            document.getElementById('sealion').style.webkitFilter = 'invert(0)';
        }
    }

    render() {
        const { vertical, horizontal, open } = this.state;
        return (
            <div>
                <div style={{ display: 'block' }}>
                    <h5>
                        Query API &nbsp;
                        <input
                            type="text"
                            id="queryApiInput"
                            size="35"
                            style={{
                                borderRadius: '3px',
                                border: 'solid 1px grey',
                            }}
                            defaultValue={returnChangeQuery('Query API', '')}
                        />
                        <input
                            type="button"
                            id="myButton5"
                            value="Save"
                            onClick={this.handleClickQuery({
                                vertical: 'top',
                                horizontal: 'center',
                            })}
                        />
                        <input
                            type="button"
                            id="myResetButton"
                            value="Reset"
                            onClick={this.handeClickResetQuery()}
                        />
                    </h5>
                </div>

                <div style={{ display: 'block' }}>
                    <h5>
                        Logging API &nbsp;
                        <input
                            type="text"
                            id="loggingApiInput"
                            size="35"
                            style={{
                                borderRadius: '3px',
                                border: 'solid 1px grey',
                            }}
                            defaultValue={returnChangeQuery('Logging API', '')}
                        />
                        <input
                            type="button"
                            id="myButton3"
                            value="Save"
                            onClick={this.handleClickEvents({
                                vertical: 'top',
                                horizontal: 'center',
                            })}
                        />
                        <input
                            type="button"
                            id="myButton4"
                            value="Reset"
                            onClick={this.handleClickResetEvents()}
                        />
                    </h5>
                </div>

                <div style={{ display: 'block' }}>
                    <h5>
                        DNS-SD API &nbsp;
                        <input
                            type="text"
                            id="dnsApiInput"
                            size="35"
                            style={{
                                borderRadius: '3px',
                                border: 'solid 1px grey',
                            }}
                            defaultValue={returnChangeQuery('DNS-SD API', '')}
                        />
                        <input
                            type="button"
                            id="myButton7"
                            value="Save"
                            onClick={this.handleClickDns({
                                vertical: 'top',
                                horizontal: 'center',
                            })}
                        />
                        <input
                            type="button"
                            id="myButton8"
                            value="Reset"
                            onClick={this.handleClickResetDns()}
                        />
                    </h5>
                </div>

                <div style={{ display: 'block' }}>
                    <h5>
                        Paging Limit &nbsp;
                        <input
                            type="number"
                            id="pagingLimitInput"
                            size="35"
                            style={{
                                borderRadius: '3px',
                                border: 'solid 1px grey',
                            }}
                            placeholder={changePaging('valueRequest')}
                        />
                        <input
                            type="button"
                            id="myButton9"
                            value="Save"
                            onClick={this.handleClickPaging({
                                vertical: 'top',
                                horizontal: 'center',
                            })}
                        />
                        <input
                            type="button"
                            id="myButton10"
                            value="Reset"
                            onClick={this.handleClickResetPaging()}
                        />
                    </h5>
                </div>

                <FormControlLabel
                    control={
                        <Switch
                            checked={this.state.rql}
                            onClick={this.advancedRqlMode(
                                this.state.rql.toString()
                            )}
                        />
                    }
                    label="RQL"
                />
                <Snackbar
                    anchorOrigin={{ vertical, horizontal }}
                    open={open}
                    autoHideDuration={1600}
                    onClose={this.handleClose}
                    ContentProps={{ 'aria-describedby': 'myText' }}
                    message={<span id="text">{x}</span>}
                />
            </div>
        );
    }
}

export default Settings;
