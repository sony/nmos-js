import React, { useEffect, useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    FormControlLabel,
    List,
    ListItem,
    MenuItem,
    Switch,
    TextField,
    makeStyles,
} from '@material-ui/core';

import sealion from '../assets/sea-lion.png';
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
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        width: 350,
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
                <CardHeader
                    title="nmos&#8209;js Settings"
                    titleTypographyProps={{ variant: 'h2', align: 'center' }}
                />
                <CardContent align="center">
                    <img
                        id="sealion"
                        src={sealion}
                        style={{
                            border: '1px solid lightgray',
                            borderRadius: '50%',
                            padding: '4px',
                            width: '20%',
                        }}
                        alt="sea-lion logo"
                    />
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
                                />
                            </ListItem>
                        )}
                        {!hiddenSetting(USE_RQL) && (
                            <ListItem className={classes.listItem}>
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
                                    disabled={disabledSetting(USE_RQL)}
                                />
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
                                            disabled={disabledSetting(
                                                FRIENDLY_PARAMETERS
                                            )}
                                        />
                                    }
                                    label="Friendly Names"
                                />
                            </ListItem>
                        )}
                    </List>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
