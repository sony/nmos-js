import { useEffect, useState } from 'react';
import { isEqual } from 'lodash';

export const LOGGING_API = 'Logging API';
export const QUERY_API = 'Query API';
export const DNSSD_API = 'DNS-SD API';

const USE_RQL = 'RQL';
const PAGING_LIMIT = 'Paging Limit';

export const FRIENDLY_PARAMETERS = 'Friendly Parameters';

export const concatUrl = (url, path) => {
    return (
        url + (url.endsWith('/') && path.startsWith('/') ? path.slice(1) : path)
    );
};

const defaultUrl = api => {
    let baseUrl = window.location.protocol + '//' + window.location.host;
    switch (api) {
        case LOGGING_API:
            return baseUrl + '/log/v1.0';
        case QUERY_API:
            return baseUrl + '/x-nmos/query/v1.3';
        case DNSSD_API:
            return baseUrl + '/x-dns-sd/v1.1';
        default:
            // not expected to be used
            return '';
    }
};

export const apiUrl = api =>
    window.localStorage.getItem(api) || defaultUrl(api);
export const setApiUrl = (api, url) => {
    if (url) {
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
export const setApiPagingLimit = (api, pagingLimit) => {
    if (typeof pagingLimit === 'number') {
        setJSONSetting(PAGING_LIMIT, pagingLimit);
    } else {
        unsetJSONSetting(PAGING_LIMIT);
    }
};

// single value, not per-API, right now
export const apiUseRql = api => getJSONSetting(USE_RQL, true);
export const setApiUseRql = (api, rql) => {
    if (typeof rql === 'boolean') {
        setJSONSetting(USE_RQL, rql);
    } else {
        unsetJSONSetting(USE_RQL);
    }
};

export const getJSONSetting = (name, defaultValue = {}) => {
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
        if (!isEqual(setting, defaultValue)) {
            setJSONSetting(name, setting);
        } else {
            unsetJSONSetting(name);
        }
    }, [name, setting, defaultValue]);

    return [setting, setSetting];
};
