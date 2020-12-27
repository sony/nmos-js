import { useEffect, useState } from 'react';

export const LOGGING_API = 'Logging API';
export const QUERY_API = 'Query API';
export const DNSSD_API = 'DNS-SD API';

const USE_RQL = 'RQL';
const PAGING_LIMIT = 'Paging Limit';

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
export const apiPagingLimit = api =>
    parseInt(window.localStorage.getItem(PAGING_LIMIT), 10) || 10;
export const setApiPagingLimit = (api, pagingLimit) => {
    if (typeof pagingLimit === 'number') {
        window.localStorage.setItem(PAGING_LIMIT, pagingLimit);
    } else {
        window.localStorage.removeItem(PAGING_LIMIT);
    }
};

// single value, not per-API, right now
export const apiUseRql = api =>
    window.localStorage.getItem(USE_RQL) !== 'false';
export const setApiUseRql = (api, rql) => {
    if (typeof rql === 'boolean') {
        window.localStorage.setItem(USE_RQL, rql);
    } else {
        window.localStorage.removeItem(USE_RQL);
    }
};

export const useJSONSetting = (name, defaultValue = {}) => {
    const [setting, setSetting] = useState(() => {
        try {
            const stored = window.localStorage.getItem(name);
            return JSON.parse(stored) || defaultValue;
        } catch (e) {
            return defaultValue;
        }
    });
    useEffect(() => {
        // note that e.g. NaN becomes null
        const stored = JSON.stringify(setting);
        if (stored !== JSON.stringify(defaultValue)) {
            window.localStorage.setItem(name, stored);
        } else {
            window.localStorage.removeItem(name);
        }
    }, [name, setting, defaultValue]);

    return [setting, setSetting];
};
