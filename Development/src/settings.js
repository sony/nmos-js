import { createContext, useContext, useEffect, useState } from 'react';
import { get, isEqual } from 'lodash';
import CONFIG from './config.json';

export const LOGGING_API = 'Logging API';
export const QUERY_API = 'Query API';
export const DNSSD_API = 'DNS-SD API';
export const AUTH_API = 'Authorization API';
export const USE_AUTH = 'Auth Enable';

export const USE_RQL = 'RQL';
export const PAGING_LIMIT = 'Paging Limit';

export const FRIENDLY_PARAMETERS = 'Friendly Parameters';

export const CLIENT_ID = 'Client ID';

export const disabledSetting = name => get(CONFIG, `${name}.disabled`);
export const hiddenSetting = name => get(CONFIG, `${name}.hidden`);

export const concatUrl = (url, path) => {
    return (
        url + (url.endsWith('/') && path.startsWith('/') ? path.slice(1) : path)
    );
};

const defaultUrl = api => {
    const configUrl = get(CONFIG, `${api}.value`);
    if (configUrl) {
        return configUrl;
    }
    let baseUrl = window.location.protocol + '//' + window.location.host;
    switch (api) {
        case LOGGING_API:
            return baseUrl + '/log/v1.0';
        case QUERY_API:
            return baseUrl + '/x-nmos/query/v1.3';
        case DNSSD_API:
            return baseUrl + '/x-dns-sd/v1.1';
        case AUTH_API:
            return baseUrl + '/.well-known/oauth-authorization-server';
        default:
            // not expected to be used
            return '';
    }
};

export const apiUrl = api => {
    if (disabledSetting(api)) {
        return defaultUrl(api);
    }
    return window.localStorage.getItem(api) || defaultUrl(api);
};
// deprecated, see useSettingsContext()
export const setApiUrl = (api, url) => {
    if (disabledSetting(api)) {
        console.error(`Configuration does not allow ${api} to be changed`);
        return;
    }
    if (url && url !== defaultUrl(api)) {
        window.localStorage.setItem(api, url);
    } else {
        window.localStorage.removeItem(api);
    }
};

// version, e.g. 'v1.3', is always the last path component
export const apiVersion = api => apiUrl(api).match(/([^/]+)\/?$/g)[0];

export const queryVersion = () => apiVersion(QUERY_API);

// single value, not per-API, right now
// default to 10 rather than leaving undefined and letting the API use its default,
// in order to simplify pagination with client-side filtered results
export const apiPagingLimit = api => getJSONSetting(PAGING_LIMIT, 10);
// deprecated, see useSettingsContext()
export const setApiPagingLimit = (api, pagingLimit) => {
    if (typeof pagingLimit === 'number') {
        setJSONSetting(PAGING_LIMIT, pagingLimit);
    } else {
        unsetJSONSetting(PAGING_LIMIT);
    }
};

// single value, not per-API, right now
export const apiUsingRql = api => getJSONSetting(USE_RQL, true);
// deprecated, see useSettingsContext()
export const setApiUsingRql = (api, rql) => {
    if (typeof rql === 'boolean') {
        setJSONSetting(USE_RQL, rql);
    } else {
        unsetJSONSetting(USE_RQL);
    }
};

export const usingAuth = () => getJSONSetting(USE_AUTH, true);
export const setUsingAuth = auth => {
    if (typeof auth === 'boolean') {
        setJSONSetting(USE_AUTH, auth);
    } else {
        unsetJSONSetting(USE_AUTH);
    }
};

export const authClientId = () => window.localStorage.getItem(CLIENT_ID) || '';
export const setAuthClientId = clientId =>
    window.localStorage.setItem(CLIENT_ID, clientId);

export const getJSONSetting = (name, defaultValue = {}) => {
    const configValue = get(CONFIG, `${name}.value`);
    if (configValue !== undefined) {
        defaultValue = configValue;
    }
    if (disabledSetting(name)) {
        return defaultValue;
    }
    try {
        const stored = window.localStorage.getItem(name);
        // treat empty string same as null (not found)
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        // treat parse error same as not found
        return defaultValue;
    }
};

export const setJSONSetting = (name, value) => {
    if (disabledSetting(name)) {
        console.error(`Configuration does not allow ${name} to be changed`);
        return;
    }
    // note that e.g. NaN becomes null
    const stored = JSON.stringify(value);
    window.localStorage.setItem(name, stored);
};

export const unsetJSONSetting = name => {
    window.localStorage.removeItem(name);
};

export const useJSONSetting = (name, defaultValue = {}) => {
    const [setting, setSetting] = useState(getJSONSetting(name, defaultValue));
    useEffect(() => {
        const configValue = get(CONFIG, `${name}.value`);
        const hasConfigValue = configValue !== undefined;
        if (!isEqual(setting, hasConfigValue ? configValue : defaultValue)) {
            setJSONSetting(name, setting);
        } else {
            unsetJSONSetting(name);
        }
    }, [name, setting, defaultValue]);

    return [setting, setSetting];
};

const useSettings = () => {
    const [values, setValues] = useState({
        [QUERY_API]: apiUrl(QUERY_API),
        [LOGGING_API]: apiUrl(LOGGING_API),
        [DNSSD_API]: apiUrl(DNSSD_API),
        [PAGING_LIMIT]: apiPagingLimit(QUERY_API),
        [USE_RQL]: apiUsingRql(QUERY_API),
        [FRIENDLY_PARAMETERS]: getJSONSetting(FRIENDLY_PARAMETERS, false),
        [CLIENT_ID]: authClientId(),
        [AUTH_API]: apiUrl(AUTH_API),
    });

    const isEffective = name => !hiddenSetting(name) && !disabledSetting(name);
    useEffect(() => {
        if (isEffective(QUERY_API)) setApiUrl(QUERY_API, values[QUERY_API]);
        if (isEffective(LOGGING_API))
            setApiUrl(LOGGING_API, values[LOGGING_API]);
        if (isEffective(DNSSD_API)) setApiUrl(DNSSD_API, values[DNSSD_API]);
        if (isEffective(PAGING_LIMIT))
            setApiPagingLimit(QUERY_API, values[PAGING_LIMIT]);
        if (isEffective(USE_RQL)) setApiUsingRql(QUERY_API, values[USE_RQL]);
        if (isEffective(FRIENDLY_PARAMETERS))
            setJSONSetting(FRIENDLY_PARAMETERS, values[FRIENDLY_PARAMETERS]);
        if (isEffective(CLIENT_ID)) setAuthClientId(values[CLIENT_ID]);
        if (isEffective(AUTH_API)) setApiUrl(AUTH_API, values[AUTH_API]);
    }, [values]);

    return [values, setValues];
};

const SettingsContext = createContext();

export const SettingsContextProvider = props => {
    const [values, setValues] = useSettings();
    return <SettingsContext.Provider value={[values, setValues]} {...props} />;
};

export const useSettingsContext = () => useContext(SettingsContext);

// Authorization context for updating web interface when the "Use Auth" switch is toggled
const useAuthSettings = () => {
    const [useAuth, setUseAuth] = useState(usingAuth());

    const isEffective = name => !hiddenSetting(name) && !disabledSetting(name);
    useEffect(() => {
        if (isEffective(USE_AUTH)) setUsingAuth(useAuth);
    }, [useAuth]);

    return [useAuth, setUseAuth];
};

const AuthContext = createContext();

export const AuthContextProvider = props => {
    const [useAuth, setUseAuth] = useAuthSettings();
    return <AuthContext.Provider value={[useAuth, setUseAuth]} {...props} />;
};

export const useAuthContext = () => useContext(AuthContext);
