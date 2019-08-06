import {
    GET_LIST,
    GET_ONE,
    GET_MANY,
    GET_MANY_REFERENCE,
    CREATE,
    UPDATE,
    DELETE,
    fetchUtils,
} from 'react-admin';
import Cookies from 'universal-cookie';

var API_URL = '';

var LINK_HEADER = '';
const LOGGING_API = 'Logging API';
const QUERY_API = 'Query API';
const DNS_API = 'DNS-SD API';

const cookies = new Cookies();

function defaultUrl(api) {
    var path = window.location.protocol + '//' + window.location.host;
    switch (api) {
        case LOGGING_API:
            path += '/log/v1.0';
            return path;
        case QUERY_API:
            path += '/x-nmos/query/v1.2';
            return path;
        case DNS_API:
            path += '/x-dns-sd/v1.0';
            return path;
        default:
            //not expected to be used
            return '';
    }
}

function returnUrl(resource) {
    var url;
    var api;
    switch (resource) {
        case 'events':
            api = LOGGING_API;
            break;
        case 'queryapis':
            api = DNS_API;
            break;
        default:
            //all pages other than logs/queryapis
            api = QUERY_API;
            break;
    }
    if (cookies.get(api) === undefined) {
        url = defaultUrl(api);
    } else {
        url = cookies.get(api);
    }
    return url;
}

export const returnChangeQuery = (API, cookieQuery) => {
    if (cookieQuery === '' || cookieQuery === 'reset') {
        if (cookies.get(API) === undefined || cookieQuery === 'reset') {
            let local = defaultUrl(API);
            cookies.set(API, local, { path: '/' });
            return cookies.get(API);
        } else {
            return cookies.get(API);
        }
    } else {
        cookies.set(API, cookieQuery, { path: '/' });
        return cookies.get(API);
    }
};

export const queryRqlMode = whatMode => {
    cookies.set('RQL', whatMode, { path: '/' });
};

export const changePaging = newLimit => {
    var paging_limit = cookies.get('Paging Limit');
    if (newLimit === 'valueRequest') {
        if (paging_limit) {
            return paging_limit;
        }
        return 'Default';
    }
    paging_limit = newLimit;
    return paging_limit;
};

const convertDataProviderRequestToHTTP = (type, resource, params) => {
    switch (type) {
        case 'FIRST': {
            let m = LINK_HEADER.match(/<([^>]+)>; rel="first"/);
            return { url: m ? m[1] : null };
        }

        case 'LAST': {
            let m = LINK_HEADER.match(/<([^>]+)>; rel="last"/);
            return { url: m ? m[1] : null };
        }

        case 'NEXT': {
            let m = LINK_HEADER.match(/<([^>]+)>; rel="next"/);
            return { url: m ? m[1] : null };
        }

        case 'PREV': {
            let m = LINK_HEADER.match(/<([^>]+)>; rel="prev"/);
            return { url: m ? m[1] : null };
        }

        case GET_ONE: {
            API_URL = returnUrl(resource);
            if (resource === 'queryapis') {
                return { url: `${API_URL}/_nmos-query._tcp/${params.id}` };
            }
            return { url: `${API_URL}/${resource}/${params.id}` };
        }

        case GET_LIST: {
            var pagingLimit = cookies.get('Paging Limit');
            var queryParams = [];

            API_URL = returnUrl(resource);

            if (resource === 'queryapis') {
                return { url: `${API_URL}/_nmos-query._tcp/` };
            }

            if (cookies.get('RQL') === 'false') {
                for (const [key, value] of Object.entries(params.filter)) {
                    queryParams.push(key + '=' + value);
                }
            } else {
                var matchParams = [];
                for (const [key, value] of Object.entries(params.filter)) {
                    var parsedValue = encodeURIComponent(value);
                    parsedValue = parsedValue.split('%2C'); //splits comma separated values
                    for (var i = 0; i < parsedValue.length; i++) {
                        if (key === 'level') {
                            matchParams.push(
                                'eq(' + key + ',' + parsedValue[i] + ')'
                            );
                        } else {
                            //almost everything else is a string for which partial matches are useful
                            matchParams.push(
                                'matches(' +
                                    key +
                                    ',string:' +
                                    parsedValue[i] +
                                    ',i)'
                            );
                        }
                    }
                }
                var rqlFilter = matchParams.join(',');
                if (rqlFilter) {
                    queryParams.push('query.rql=and(' + rqlFilter + ')');
                }
            }

            if (pagingLimit && resource !== 'events') {
                queryParams.push(
                    'paging.order=update',
                    'paging.limit=' + pagingLimit
                );
            }

            var query = queryParams.join('&');
            return {
                url: `${API_URL}/${resource}?${query}`,
            };
        }
        case GET_MANY: {
            if (cookies.get('RQL') !== 'false') {
                //!false is used as the initial no cookie state has the rql toggle in the enabled state
                var total_query =
                    'query.rql=or(' +
                    params.ids.map(id => 'eq(id,' + id + ')').join(',') +
                    ')';
                return { url: `${API_URL}/${resource}?${total_query}` };
            } else {
                total_query = 'id=' + params.ids[0];
                //hmm, need to make multiple requests if we have to match one at a time with basic query syntax
                return { url: `${API_URL}/${resource}?${total_query}` };
            }
        }
        case GET_MANY_REFERENCE: {
            if (params.target !== '' && params[params.source] !== '') {
                if (cookies.get('RQL') !== 'false') {
                    total_query =
                        'query.rql=matches(' +
                        params.target +
                        ',string:' +
                        params[params.source] +
                        ',i)';
                } else {
                    total_query = params.target + '=' + params[params.source];
                }
                total_query += '&paging.limit=1000';
                return { url: `${API_URL}/${resource}?${total_query}` };
            } else {
                return { url: `${API_URL}/${resource}` };
            }
        }
        case UPDATE:
            return '';
        case CREATE:
            return '';
        case DELETE:
            return '';
        default:
            //not expected to be used
            return '';
    }
};

const convertHTTPResponseToDataProvider = (
    url,
    response,
    type,
    resource,
    params
) => {
    const { headers, json } = response;
    LINK_HEADER = headers.get('Link');
    if (LINK_HEADER !== null && LINK_HEADER.match(/<([^>]+)>; rel="next"/)) {
        if (LINK_HEADER.match(/<([^>]+)>; rel="first"/)) {
            cookies.set('Pagination', 'enabled', { path: '/' });
        } else {
            cookies.set('Pagination', 'partial', { path: '/' });
        }
    } else {
        cookies.set('Pagination', 'disabled', { path: '/' });
    }
    switch (type) {
        case GET_ONE:
            if (resource === 'queryapis') {
                json.id = json.name;
            }
            return { url: url, data: json };

        case GET_LIST:
            if (resource === 'queryapis') {
                json.map(_ => (_.id = _.name));
            }
            return {
                url: url,
                data: json,
                total: json ? json.length : 0,
            };
        case GET_MANY_REFERENCE:
            return {
                url: url,
                data: json,
                total: 'unknown',
            };
        default:
            //used for prev, next, first, last
            if (resource === 'queryapis') {
                json.map(_ => (_.id = _.name));
            }
            return { url: url, data: json };
    }
};

export default (type, resource, params) => {
    const { fetchJson } = fetchUtils;
    const { url, options } = convertDataProviderRequestToHTTP(
        type,
        resource,
        params
    );
    return fetchJson(url, options).then(response =>
        convertHTTPResponseToDataProvider(url, response, type, resource, params)
    );
};
