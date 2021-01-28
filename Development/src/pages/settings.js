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
    QUERY_API,
    apiPagingLimit,
    apiUrl,
    apiUseRql,
    getJSONSetting,
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
        queryAPI: apiUrl(QUERY_API),
        loggingAPI: apiUrl(LOGGING_API),
        dnssdAPI: apiUrl(DNSSD_API),
        pagingLimit: apiPagingLimit(QUERY_API),
        rql: apiUseRql(QUERY_API),
        friendlyParams: getJSONSetting(FRIENDLY_PARAMETERS, false),
    });

    const handleTextChange = name => event => {
        setValues({ ...values, [name]: event.target.value });
    };

    const handleBooleanChange = name => event => {
        setValues({ ...values, [name]: event.target.checked });
    };

    useEffect(() => {
        setApiUrl(QUERY_API, values.queryAPI);
        setApiUrl(LOGGING_API, values.loggingAPI);
        setApiUrl(DNSSD_API, values.dnssdAPI);
        setApiPagingLimit(QUERY_API, values.pagingLimit);
        setApiUseRql(QUERY_API, values.rql);
        setJSONSetting(FRIENDLY_PARAMETERS, values.friendlyParams);
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
                        <ListItem className={classes.listItem}>
                            <TextField
                                label="Query API"
                                variant="filled"
                                value={values.queryAPI}
                                onChange={handleTextChange('queryAPI')}
                                onFocus={selectOnFocus}
                                className={classes.textField}
                            />
                        </ListItem>
                        <ListItem className={classes.listItem}>
                            <TextField
                                label="Logging API"
                                variant="filled"
                                value={values.loggingAPI}
                                onChange={handleTextChange('loggingAPI')}
                                onFocus={selectOnFocus}
                                className={classes.textField}
                            />
                        </ListItem>
                        <ListItem className={classes.listItem}>
                            <TextField
                                label="DNS-SD API"
                                variant="filled"
                                value={values.dnssdAPI}
                                onChange={handleTextChange('dnssdAPI')}
                                onFocus={selectOnFocus}
                                className={classes.textField}
                            />
                        </ListItem>
                        <ListItem className={classes.listItem}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={values.rql}
                                        onChange={handleBooleanChange('rql')}
                                        color="primary"
                                    />
                                }
                                label="RQL"
                            />
                        </ListItem>
                        <ListItem className={classes.listItem}>
                            <TextField
                                select
                                label="Paging Limit"
                                variant="filled"
                                className={classes.textField}
                                value={values.pagingLimit}
                                onChange={handleTextChange('pagingLimit')}
                                margin="normal"
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
                        <ListItem className={classes.listItem}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={values.friendlyParams}
                                        onChange={handleBooleanChange(
                                            'friendlyParams'
                                        )}
                                        color="primary"
                                    />
                                }
                                label="Friendly Names"
                            />
                        </ListItem>
                    </List>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
