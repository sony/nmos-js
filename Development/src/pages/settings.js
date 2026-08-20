import { useState } from 'react';
import {
    Card,
    CardContent,
    Divider,
    FormControl,
    FormControlLabel,
    FormHelperText,
    List,
    ListItem,
    MenuItem,
    Paper,
    Switch,
    Tab,
    Tabs,
    TextField,
    withStyles,
} from '@material-ui/core';
import { useTheme } from '@material-ui/styles';
import { Title } from 'react-admin';
import {
    AUTH_API,
    BRIDGE_API,
    BRIDGE_AUTO,
    BRIDGE_DISABLED,
    BRIDGE_FORCED,
    BRIDGE_MODE,
    CLIENT_ID,
    DNSSD_API,
    FRIENDLY_PARAMETERS,
    IS12_BROWSER,
    LOGGING_API,
    PAGING_LIMIT,
    QUERY_API,
    USE_AUTH,
    USE_RQL,
    disabledSetting,
    hiddenSetting,
    useAuthContext,
    useSettingsContext,
} from '../settings';

const StyledListItem = withStyles(theme => ({
    root: {
        justifyContent: 'center',
    },
}))(ListItem);

const StyledTextField = withStyles(theme => ({
    root: {
        width: 450,
    },
}))(TextField);

const StyledFormControl = withStyles(theme => ({
    root: {
        width: 450,
        textAlign: 'left',
    },
}))(FormControl);

const StyledDivider = withStyles(theme => ({
    root: {
        width: 450,
        margin: theme.spacing(1, 'auto'),
    },
}))(Divider);

const bridgeModes = [
    {
        value: BRIDGE_DISABLED,
        label: 'No Bridge',
    },
    {
        value: BRIDGE_AUTO,
        label: 'Auto Bridge',
    },
    {
        value: BRIDGE_FORCED,
        label: 'Forced Bridge',
    },
];

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

const BASIC = 'basic';
const ADVANCED = 'advanced';

// Survive remount when Authorization toggles authProvider on <Admin>
let selectedTab = BASIC;

const Settings = () => {
    const [values, setValues] = useSettingsContext();
    const [useAuth, setUseAuth] = useAuthContext();
    const [tab, setTab] = useState(selectedTab);

    const theme = useTheme();
    const tabBackgroundColor =
        theme.palette.type === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900];

    const handleTextChange = name => event => {
        setValues({ ...values, [name]: event.target.value });
    };

    const handleBooleanChange = name => event => {
        setValues({ ...values, [name]: event.target.checked });
    };

    const handleUseAuthChange = name => event => {
        setUseAuth(event.target.checked);
    };

    return (
        <div style={{ paddingTop: '24px' }}>
            <Title title={'Settings'} />
            <div style={{ display: 'flex' }}>
                <Paper
                    style={{
                        alignSelf: 'flex-end',
                        background: tabBackgroundColor,
                    }}
                >
                    <Tabs
                        value={tab}
                        onChange={(event, value) => {
                            selectedTab = value;
                            setTab(value);
                        }}
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab label="Basic" value={BASIC} />
                        <Tab label="Advanced" value={ADVANCED} />
                    </Tabs>
                </Paper>
                <span style={{ flexGrow: 1 }} />
            </div>
            <div style={{ display: 'flex' }}>
                <Card style={{ flex: '1 1 auto' }}>
                    <CardContent align="center">
                        <List
                            style={{ display: tab === BASIC ? null : 'none' }}
                        >
                            {!hiddenSetting(QUERY_API) && (
                                <StyledListItem>
                                    <StyledTextField
                                        label="Query API"
                                        variant="filled"
                                        value={values[QUERY_API]}
                                        onChange={handleTextChange(QUERY_API)}
                                        onFocus={selectOnFocus}
                                        disabled={disabledSetting(QUERY_API)}
                                        helperText="Used to show the registered Nodes and their sub-resources"
                                        name="queryapi"
                                    />
                                </StyledListItem>
                            )}
                            {!hiddenSetting(LOGGING_API) && (
                                <StyledListItem>
                                    <StyledTextField
                                        label="Logging API"
                                        variant="filled"
                                        value={values[LOGGING_API]}
                                        onChange={handleTextChange(LOGGING_API)}
                                        onFocus={selectOnFocus}
                                        disabled={disabledSetting(LOGGING_API)}
                                        helperText="Used to show registry Logs"
                                    />
                                </StyledListItem>
                            )}
                            {!hiddenSetting(DNSSD_API) && (
                                <StyledListItem>
                                    <StyledTextField
                                        label="DNS-SD API"
                                        variant="filled"
                                        value={values[DNSSD_API]}
                                        onChange={handleTextChange(DNSSD_API)}
                                        onFocus={selectOnFocus}
                                        disabled={disabledSetting(DNSSD_API)}
                                        helperText="Used to show alternative Query APIs"
                                    />
                                </StyledListItem>
                            )}
                            {!hiddenSetting(USE_RQL) && (
                                <StyledListItem>
                                    <StyledFormControl
                                        variant="filled"
                                        disabled={disabledSetting(USE_RQL)}
                                    >
                                        <FormControlLabel
                                            label="RQL"
                                            name="userql"
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
                                            Use Resource Query Language rather
                                            than basic query syntax
                                        </FormHelperText>
                                    </StyledFormControl>
                                </StyledListItem>
                            )}
                            {!hiddenSetting(PAGING_LIMIT) && (
                                <StyledListItem>
                                    <StyledTextField
                                        select
                                        label="Paging Limit"
                                        variant="filled"
                                        value={values[PAGING_LIMIT]}
                                        onChange={handleTextChange(
                                            PAGING_LIMIT
                                        )}
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
                                    </StyledTextField>
                                </StyledListItem>
                            )}
                            {!hiddenSetting(FRIENDLY_PARAMETERS) && (
                                <StyledListItem>
                                    <StyledFormControl
                                        variant="filled"
                                        disabled={disabledSetting(
                                            FRIENDLY_PARAMETERS
                                        )}
                                    >
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={
                                                        values[
                                                            FRIENDLY_PARAMETERS
                                                        ]
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
                                    </StyledFormControl>
                                </StyledListItem>
                            )}
                        </List>
                        <List
                            style={{
                                display: tab === ADVANCED ? null : 'none',
                            }}
                        >
                            {!hiddenSetting(USE_AUTH) && (
                                <StyledListItem>
                                    <StyledFormControl
                                        variant="filled"
                                        disabled={disabledSetting(USE_AUTH)}
                                    >
                                        <FormControlLabel
                                            label="Authorization"
                                            control={
                                                <Switch
                                                    checked={useAuth}
                                                    onChange={handleUseAuthChange()}
                                                    color="primary"
                                                />
                                            }
                                        />
                                        <FormHelperText variant="filled">
                                            Use IS-10 authenticated API calls
                                        </FormHelperText>
                                    </StyledFormControl>
                                </StyledListItem>
                            )}
                            {!hiddenSetting(CLIENT_ID) && (
                                <StyledListItem>
                                    <StyledTextField
                                        label="Client ID"
                                        variant="filled"
                                        value={values[CLIENT_ID]}
                                        onChange={handleTextChange(CLIENT_ID)}
                                        onFocus={selectOnFocus}
                                        disabled={
                                            !useAuth ||
                                            disabledSetting(CLIENT_ID)
                                        }
                                        helperText="Used by the Authentication Server to uniquely identify this client"
                                    />
                                </StyledListItem>
                            )}
                            {!hiddenSetting(AUTH_API) && (
                                <StyledListItem>
                                    <StyledTextField
                                        label="Authorization API"
                                        variant="filled"
                                        value={values[AUTH_API]}
                                        onChange={handleTextChange(AUTH_API)}
                                        onFocus={selectOnFocus}
                                        disabled={
                                            !useAuth ||
                                            disabledSetting(AUTH_API)
                                        }
                                        helperText="Authentication Server's well known endpoint"
                                    />
                                </StyledListItem>
                            )}
                            <StyledDivider />
                            {!hiddenSetting(BRIDGE_MODE) && (
                                <StyledListItem>
                                    <StyledTextField
                                        select
                                        label="NMOS Bridge Mode"
                                        variant="filled"
                                        value={values[BRIDGE_MODE]}
                                        onChange={handleTextChange(BRIDGE_MODE)}
                                        disabled={disabledSetting(BRIDGE_MODE)}
                                        helperText="Proxy Device Control API requests when Device endpoints are unreachable (Auto) or always (Forced)"
                                    >
                                        {bridgeModes.map(option => (
                                            <MenuItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </StyledTextField>
                                </StyledListItem>
                            )}
                            {!hiddenSetting(BRIDGE_API) && (
                                <StyledListItem>
                                    <StyledTextField
                                        label="NMOS Bridge API"
                                        variant="filled"
                                        value={values[BRIDGE_API]}
                                        onChange={handleTextChange(BRIDGE_API)}
                                        onFocus={selectOnFocus}
                                        disabled={disabledSetting(BRIDGE_API)}
                                        helperText="Base URL for proxied Device Control API requests"
                                    />
                                </StyledListItem>
                            )}
                            <StyledDivider />
                            {!hiddenSetting(IS12_BROWSER) && (
                                <StyledListItem>
                                    <StyledTextField
                                        label="IS-12 Browser"
                                        variant="filled"
                                        value={values[IS12_BROWSER]}
                                        onChange={handleTextChange(
                                            IS12_BROWSER
                                        )}
                                        onFocus={selectOnFocus}
                                        disabled={disabledSetting(IS12_BROWSER)}
                                        helperText="Base URL of the IS-12 Device Model Browser application"
                                    />
                                </StyledListItem>
                            )}
                        </List>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Settings;
