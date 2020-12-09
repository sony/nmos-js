import Cookies from 'universal-cookie';

// consider using local storage
const cookies = new Cookies();

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
            return baseUrl + '/x-dns-sd/v1.0';
        default:
            // not expected to be used
            return '';
    }
};

const cookieOptions = { path: '/', maxAge: 60 * 60 * 12 };

export const apiUrl = api => cookies.get(api) || defaultUrl(api);
export const setApiUrl = (api, url) => {
    if (url) {
        cookies.set(api, url, cookieOptions);
    } else {
        cookies.remove(api, cookieOptions);
    }
};

// version, e.g. 'v1.3', is always the last path component
export const apiVersion = api => apiUrl(api).match(/([^/]+)\/?$/g)[0];

export const queryVersion = () => apiVersion(QUERY_API);

// single value, not per-API, right now
// default to 10 rather than leaving undefined and letting the API use its default,
// in order to simplify pagination with client-side filtered results
export const apiPagingLimit = api =>
    parseInt(cookies.get(PAGING_LIMIT), 10) || 10;
export const setApiPagingLimit = (api, pagingLimit) => {
    if (typeof pagingLimit === 'number') {
        cookies.set(PAGING_LIMIT, pagingLimit, cookieOptions);
    } else {
        cookies.remove(PAGING_LIMIT, cookieOptions);
    }
};

// single value, not per-API, right now
export const apiUseRql = api => cookies.get(USE_RQL) !== 'false';
export const setApiUseRql = (api, rql) => {
    if (typeof rql === 'boolean') {
        cookies.set(USE_RQL, rql, cookieOptions);
    } else {
        cookies.remove(USE_RQL, cookieOptions);
    }
};
