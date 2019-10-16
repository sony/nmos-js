import React from 'react';
import {
    Button,
    FormControlLabel,
    List,
    ListItem,
    MenuItem,
    Snackbar,
    Switch,
    TextField,
} from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Cookies from 'universal-cookie';

import { changePaging, returnChangeQuery } from './dataProvider';

const cookies = new Cookies();

const styles = theme => ({
    container: {
        justifyContent: 'center',
        display: 'flex',
        flexWrap: 'wrap',
    },
    listItem: {
        justifyContent: 'center',
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        width: 350,
    },
});

const paging = [
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

function getBool(cookie) {
    return cookie !== 'false';
}

const Settings = props => {
    const { classes } = props;
    const [values, setValues] = React.useState({
        queryAPI: returnChangeQuery('Query API', ''),
        loggingAPI: returnChangeQuery('Logging API', ''),
        dnssdAPI: returnChangeQuery('DNS-SD API', ''),
        paging: parseInt(changePaging('valueRequest'), 10),
        rql: getBool(cookies.get('RQL')),
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
        returnChangeQuery('Query API', values.queryAPI);
        returnChangeQuery('Logging API', values.loggingAPI);
        returnChangeQuery('DNS-SD API', values.dnssdAPI);
        if (values.paging) {
            changePaging(values.paging);
        }
        cookies.set('RQL', values.rql, { path: '/' });
        setOpen(true);
    };

    return (
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
                        value={values.queryAPI}
                        onChange={handleInputChange('queryAPI')}
                        className={classes.textField}
                    />
                </ListItem>
                <ListItem>
                    <TextField
                        id="standard-loggingAPI"
                        label="Logging API"
                        value={values.loggingAPI}
                        onChange={handleInputChange('loggingAPI')}
                        className={classes.textField}
                    />
                </ListItem>
                <ListItem>
                    <TextField
                        id="standard-dnssdAPI"
                        label="DNS-SD API"
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
                        placeholder=""
                        className={classes.textField}
                        value={values.paging}
                        onChange={handleInputChange('paging')}
                        margin="normal"
                    >
                        {paging.map(option => (
                            <MenuItem key={option.value} value={option.value}>
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
    );
};

export default withStyles(styles)(Settings);
