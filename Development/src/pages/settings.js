import React from 'react';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    FormControlLabel,
    List,
    ListItem,
    MenuItem,
    Snackbar,
    Switch,
    TextField,
    makeStyles,
} from '@material-ui/core';
import SaveIcon from '@material-ui/icons/Save';

import sealion from '../assets/sea-lion.png';
import {
    DNSSD_API,
    LOGGING_API,
    QUERY_API,
    apiPagingLimit,
    apiUrl,
    apiUseRql,
    setApiPagingLimit,
    setApiUrl,
    setApiUseRql,
} from '../settings';

const useStyles = makeStyles(theme => ({
    container: {
        justifyContent: 'center',
        display: 'flex',
        flexWrap: 'wrap',
    },
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

const Settings = () => {
    const classes = useStyles();
    const [values, setValues] = React.useState({
        queryAPI: apiUrl(QUERY_API),
        loggingAPI: apiUrl(LOGGING_API),
        dnssdAPI: apiUrl(DNSSD_API),
        pagingLimit: apiPagingLimit(QUERY_API),
        rql: apiUseRql(QUERY_API),
    });

    const handleInputChange = name => event => {
        setValues({ ...values, [name]: event.target.value });
    };
    const handleSwitchChange = name => () => {
        setValues({ ...values, [name]: !values[name] });
    };

    const [open, setOpen] = React.useState(false);
    const handleClose = () => {
        setOpen(false);
    };

    const handleSave = () => {
        setApiUrl(QUERY_API, values.queryAPI);
        setApiUrl(LOGGING_API, values.loggingAPI);
        setApiUrl(DNSSD_API, values.dnssdAPI);
        if (values.pagingLimit) {
            setApiPagingLimit(QUERY_API, values.pagingLimit);
        }
        setApiUseRql(QUERY_API, values.rql);
        setOpen(true);
    };

    return (
        <div style={{ paddingTop: '24px' }}>
            <Card>
                <CardHeader
                    title="Welcome to the nmos&#8209;js Client"
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
                </CardContent>
            </Card>
            <Card align="center" title="Change Query">
                <CardHeader title="Settings" />
                <CardContent>
                    <form
                        className={classes.container}
                        noValidate
                        autoComplete="off"
                        title=""
                    >
                        <List>
                            <ListItem>
                                <TextField
                                    id="standard-queryAPI"
                                    label="Query API"
                                    variant="filled"
                                    value={values.queryAPI}
                                    onChange={handleInputChange('queryAPI')}
                                    className={classes.textField}
                                />
                            </ListItem>
                            <ListItem>
                                <TextField
                                    id="standard-loggingAPI"
                                    label="Logging API"
                                    variant="filled"
                                    value={values.loggingAPI}
                                    onChange={handleInputChange('loggingAPI')}
                                    className={classes.textField}
                                />
                            </ListItem>
                            <ListItem>
                                <TextField
                                    id="standard-dnssdAPI"
                                    label="DNS-SD API"
                                    variant="filled"
                                    value={values.dnssdAPI}
                                    onChange={handleInputChange('dnssdAPI')}
                                    className={classes.textField}
                                />
                            </ListItem>
                            <ListItem className={classes.listItem}>
                                <TextField
                                    id="standard-paging"
                                    select
                                    label="Paging Limit"
                                    variant="filled"
                                    placeholder=""
                                    className={classes.textField}
                                    value={values.pagingLimit}
                                    onChange={handleInputChange('pagingLimit')}
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
                                            checked={values.rql}
                                            onChange={handleSwitchChange('rql')}
                                            color="primary"
                                        />
                                    }
                                    label="RQL"
                                />
                            </ListItem>
                            <ListItem className={classes.listItem}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSave}
                                    startIcon={<SaveIcon />}
                                >
                                    Save
                                </Button>
                            </ListItem>
                        </List>
                        <Snackbar
                            open={open}
                            onClose={handleClose}
                            autoHideDuration={3000}
                            message={<span>Saved</span>}
                        />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
