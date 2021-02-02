import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    FormControl,
    FormControlLabel,
    FormHelperText,
    List,
    ListItem,
    MenuItem,
    Switch,
    TextField,
    makeStyles,
} from '@material-ui/core';
import { Title } from 'react-admin';
import {
    DNSSD_API,
    FRIENDLY_PARAMETERS,
    LOGGING_API,
    PAGING_LIMIT,
    QUERY_API,
    USE_RQL,
    apiPagingLimit,
    apiUrl,
    apiUseRql,
    disabledSetting,
    getJSONSetting,
    hiddenSetting,
    setApiPagingLimit,
    setApiUrl,
    setApiUseRql,
    setJSONSetting,
} from '../settings';

const useStyles = makeStyles(theme => ({
    listItem: {
        justifyContent: 'center',
    },
    textField: {
        width: 450,
    },
}));

const pagingLimits = [
    {
        value: 5,
        label: '5',
    },
    {
        value: 10,
        label: '10',
    },
    {
        value: 20,
        label: '20',
    },
    {
        value: 50,
        label: '50',
    },
    {
        value: 100,
        label: '100',
    },
];

const selectOnFocus = event => event.target.select();

const Settings = () => {
    const classes = useStyles();
    const [values, setValues] = useState({
        [QUERY_API]: apiUrl(QUERY_API),
        [LOGGING_API]: apiUrl(LOGGING_API),
        [DNSSD_API]: apiUrl(DNSSD_API),
        [PAGING_LIMIT]: apiPagingLimit(QUERY_API),
        [USE_RQL]: apiUseRql(QUERY_API),
        [FRIENDLY_PARAMETERS]: getJSONSetting(FRIENDLY_PARAMETERS, false),
    });

    const handleTextChange = name => event => {
        setValues({ ...values, [name]: event.target.value });
    };

    const handleBooleanChange = name => event => {
        setValues({ ...values, [name]: event.target.checked });
    };

    const isEffective = name => !hiddenSetting(name) && !disabledSetting(name);
    useEffect(() => {
        if (isEffective(QUERY_API)) setApiUrl(QUERY_API, values[QUERY_API]);
        if (isEffective(LOGGING_API))
            setApiUrl(LOGGING_API, values[LOGGING_API]);
        if (isEffective(DNSSD_API)) setApiUrl(DNSSD_API, values[DNSSD_API]);
        if (isEffective(PAGING_LIMIT))
            setApiPagingLimit(QUERY_API, values[PAGING_LIMIT]);
        if (isEffective(USE_RQL)) setApiUseRql(QUERY_API, values[USE_RQL]);
        if (isEffective(FRIENDLY_PARAMETERS))
            setJSONSetting(FRIENDLY_PARAMETERS, values[FRIENDLY_PARAMETERS]);
    }, [values]);

    return (
        <div style={{ paddingTop: '24px' }}>
            <Card>
                <Title title={'Settings'} />
                <CardContent align="center">
                    <List>
                        {!hiddenSetting(QUERY_API) && (
                            <ListItem className={classes.listItem}>
                                <TextField
                                    label="Query API"
                                    variant="filled"
                                    value={values[QUERY_API]}
                                    onChange={handleTextChange(QUERY_API)}
                                    onFocus={selectOnFocus}
                                    className={classes.textField}
                                    disabled={disabledSetting(QUERY_API)}
                                    helperText="Used to show the registered Nodes and their sub-resources"
                                />
                            </ListItem>
                        )}
                        {!hiddenSetting(LOGGING_API) && (
                            <ListItem className={classes.listItem}>
                                <TextField
                                    label="Logging API"
                                    variant="filled"
                                    value={values[LOGGING_API]}
                                    onChange={handleTextChange(LOGGING_API)}
                                    onFocus={selectOnFocus}
                                    className={classes.textField}
                                    disabled={disabledSetting(LOGGING_API)}
                                    helperText="Used to show registry Logs"
                                />
                            </ListItem>
                        )}
                        {!hiddenSetting(DNSSD_API) && (
                            <ListItem className={classes.listItem}>
                                <TextField
                                    label="DNS-SD API"
                                    variant="filled"
                                    value={values[DNSSD_API]}
                                    onChange={handleTextChange(DNSSD_API)}
                                    onFocus={selectOnFocus}
                                    className={classes.textField}
                                    disabled={disabledSetting(DNSSD_API)}
                                    helperText="Used to show alternative Query APIs"
                                />
                            </ListItem>
                        )}
                        {!hiddenSetting(USE_RQL) && (
                            <ListItem className={classes.listItem}>
                                <FormControl
                                    variant="filled"
                                    disabled={disabledSetting(USE_RQL)}
                                >
                                    <FormControlLabel
                                        label="RQL"
                                        control={
                                            <Switch
                                                checked={values[USE_RQL]}
                                                onChange={handleBooleanChange(
                                                    USE_RQL
                                                )}
                                                color="primary"
                                            />
                                        }
                                    />
                                    <FormHelperText variant="filled">
                                        Use Resource Query Language rather than
                                        basic query syntax
                                    </FormHelperText>
                                </FormControl>
                            </ListItem>
                        )}
                        {!hiddenSetting(PAGING_LIMIT) && (
                            <ListItem className={classes.listItem}>
                                <TextField
                                    select
                                    label="Paging Limit"
                                    variant="filled"
                                    className={classes.textField}
                                    value={values[PAGING_LIMIT]}
                                    onChange={handleTextChange(PAGING_LIMIT)}
                                    margin="normal"
                                    disabled={disabledSetting(PAGING_LIMIT)}
                                    helperText="Applied to paginated API requests for list views"
                                >
                                    {pagingLimits.map(option => (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                        >
                                            {option.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </ListItem>
                        )}
                        {!hiddenSetting(FRIENDLY_PARAMETERS) && (
                            <ListItem className={classes.listItem}>
                                <FormControl
                                    variant="filled"
                                    disabled={disabledSetting(
                                        FRIENDLY_PARAMETERS
                                    )}
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={
                                                    values[FRIENDLY_PARAMETERS]
                                                }
                                                onChange={handleBooleanChange(
                                                    FRIENDLY_PARAMETERS
                                                )}
                                                color="primary"
                                            />
                                        }
                                        label="Friendly Names"
                                    />
                                    <FormHelperText>
                                        Show friendly names rather than API
                                        parameter values
                                    </FormHelperText>
                                </FormControl>
                            </ListItem>
                        )}
                    </List>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
