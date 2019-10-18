import {
    CREATE,
    DELETE,
    GET_LIST,
    GET_MANY,
    GET_MANY_REFERENCE,
    GET_ONE,
    UPDATE,
    fetchUtils,
} from 'react-admin';
import get from 'lodash/get';
import set from 'lodash/set';
import { set as setJSON } from 'json-ptr';
import assign from 'lodash/assign';
import diff from 'deep-diff';
import Cookies from 'universal-cookie';

let API_URL = '';

let LINK_HEADER = '';
const LOGGING_API = 'Logging API';
const QUERY_API = 'Query API';
const DNS_API = 'DNS-SD API';

const cookies = new Cookies();

function defaultUrl(api) {
    let path = window.location.protocol + '//' + window.location.host;
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
    let url;
    let api;
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
    let paging_limit = cookies.get('Paging Limit');
    if (newLimit === 'valueRequest') {
        if (paging_limit) {
            return paging_limit;
        }
        return 'Default';
    }
    paging_limit = newLimit;
    cookies.set('Paging Limit', paging_limit, {
        path: '/',
    });
    return paging_limit;
};

function isNumber(v) {
    return !isNaN(v) && !isNaN(parseFloat(v));
}

const convertDataProviderRequestToHTTP = (type, resource, params) => {
    switch (type) {
        case 'FIRST': {
            let m = LINK_HEADER.match(/<([^>]+)>;[ \t]*rel="first"/);
            return { url: m ? m[1] : null };
        }

        case 'LAST': {
            let m = LINK_HEADER.match(/<([^>]+)>;[ \t]*rel="last"/);
            return { url: m ? m[1] : null };
        }

        case 'NEXT': {
            let m = LINK_HEADER.match(/<([^>]+)>;[ \t]*rel="next"/);
            return { url: m ? m[1] : null };
        }

        case 'PREV': {
            let m = LINK_HEADER.match(/<([^>]+)>;[ \t]*rel="prev"/);
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
            const pagingLimit = cookies.get('Paging Limit');
            const queryParams = [];

            API_URL = returnUrl(resource);

            if (resource === 'queryapis') {
                return { url: `${API_URL}/_nmos-query._tcp/` };
            }

            if (cookies.get('RQL') === 'false') {
                for (const [key, value] of Object.entries(params.filter)) {
                    queryParams.push(key + '=' + value);
                }
            } else {
                const matchParams = [];
                for (const [key, value] of Object.entries(params.filter)) {
                    let parsedValue = encodeURIComponent(value);
                    parsedValue = parsedValue.split('%2C'); //splits comma separated values
                    for (let i = 0; i < parsedValue.length; i++) {
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
                const rqlFilter = matchParams.join(',');
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

            const query = queryParams.join('&');
            return {
                url: `${API_URL}/${resource}?${query}`,
            };
        }
        case GET_MANY: {
            let total_query;
            if (cookies.get('RQL') !== 'false') {
                //!false is used as the initial no cookie state has the rql toggle in the enabled state
                total_query =
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
            let total_query;
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
            let differences = [];
            let allDifferences = diff(
                get(params, 'previousData.$staged'),
                get(params, 'data.$staged')
            );
            if (allDifferences !== undefined) {
                for (const d of allDifferences) {
                    if (d.rhs === '') {
                        if (d.lhs !== null) {
                            differences.push({
                                kind: d.kind,
                                lhs: d.lhs,
                                path: d.path,
                                rhs: null,
                            });
                        }
                    } else if (isNumber(d.rhs)) {
                        differences.push({
                            kind: d.kind,
                            lhs: d.lhs,
                            path: d.path,
                            rhs: Number(d.rhs),
                        });
                    } else {
                        differences.push(d);
                    }
                }
            }

            let patchData = { transport_params: [] };
            const legs = get(params, 'data.$staged.transport_params').length;
            for (let i = 0; i < legs; i++) {
                patchData.transport_params.push({});
            }

            for (const d of differences) {
                setJSON(patchData, `/${d.path.join('/')}`, d.rhs, true);
            }

            if (patchData.hasOwnProperty('transport_file')) {
                if (get(patchData, 'transport_file.data') === null) {
                    set(patchData, 'transport_file.type', null);
                } else {
                    set(patchData, 'transport_file.type', 'application/sdp');
                }
            }

            const options = {
                method: 'PATCH',
                body: JSON.stringify(patchData),
            };
            return {
                url: `${params.data.$connectionAPI}/staged`,
                options: options,
            };
        case CREATE:
            return '';
        case DELETE:
            return '';
        default:
            //not expected to be used
            return '';
    }
};

function timeout(ms, promise) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            reject(new Error('Timeout'));
        }, ms);
        promise.then(resolve, reject);
    });
}

function getEndpoints(addresses, resource, id) {
    // Looking for the first promise to succeed or all to fail
    const invertPromise = p => new Promise((res, rej) => p.then(rej, res));
    const firstOf = ps => invertPromise(Promise.all(ps.map(invertPromise)));
    const endpointData = [];
    let connectionAPI;

    return new Promise((resolve, reject) => {
        firstOf(
            addresses.map(function(address) {
                return timeout(
                    5000,
                    fetch(`${address}/single/${resource}/${id}`)
                );
            })
        )
            .then(function(response) {
                connectionAPI = response.url;
                return response.json();
            })
            .then(function(endpoints) {
                if (get(endpoints, 'code')) {
                    reject(new Error(`${endpoints.error} - ${endpoints.code}`));
                    return;
                }
                Promise.all(
                    endpoints.map(endpoint =>
                        fetch(`${connectionAPI}/${endpoint}`)
                            .then(function(response) {
                                if (response.ok) {
                                    return response.text();
                                }
                            })
                            .then(function(text) {
                                try {
                                    return JSON.parse(text);
                                } catch (e) {
                                    return text;
                                }
                            })
                            .then(function(data) {
                                endpointData.push({
                                    [`$${endpoint.slice(0, -1)}`]: data,
                                });
                            })
                            .catch(function(error) {
                                console.log(error);
                            })
                    )
                ).then(function() {
                    endpointData.push({ $connectionAPI: connectionAPI });
                    resolve(endpointData);
                });
            })
            .catch(function(errors) {
                reject(errors[0]);
            });
    });
}

async function convertHTTPResponseToDataProvider(
    url,
    response,
    type,
    resource,
    params
) {
    const { headers, json } = response;
    LINK_HEADER = headers.get('Link');
    if (
        LINK_HEADER !== null &&
        LINK_HEADER.match(/<([^>]+)>;[ \t]*rel="next"/)
    ) {
        if (LINK_HEADER.match(/<([^>]+)>;[ \t]*rel="first"/)) {
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
            if (resource === 'receivers' || resource === 'senders') {
                API_URL = returnUrl(resource);
                let resourceJSONData = await fetch(
                    `${API_URL}/${resource}/${params.id}`
                ).then(result => result.json());

                let deviceJSONData;
                if (resourceJSONData.hasOwnProperty('device_id')) {
                    API_URL = returnUrl('devices');
                    deviceJSONData = await fetch(
                        `${API_URL}/devices/${resourceJSONData.device_id}`
                    ).then(result => result.json());
                } else {
                    return { url: url, data: json };
                }

                let connectionAddresses = {};
                deviceJSONData.controls.forEach(function(control) {
                    const type = control.type.replace('.', '_');
                    if (type.startsWith('urn:x-nmos:control:sr-ctrl')) {
                        if (!connectionAddresses.hasOwnProperty(type)) {
                            set(connectionAddresses, type, [control.href]);
                        } else {
                            connectionAddresses[type].push(control.href);
                        }
                    }
                });
                // Return IS-04 if no Connection API endpoints
                if (
                    Object.keys(connectionAddresses).length === 0 &&
                    connectionAddresses.constructor === Object
                ) {
                    return { url: url, data: json };
                }

                const versions = Object.keys(connectionAddresses)
                    .sort()
                    .reverse();

                let endpointData;
                for (let version of versions) {
                    try {
                        endpointData = await getEndpoints(
                            connectionAddresses[version],
                            resource,
                            params.id
                        );
                    } catch (e) {}
                    if (endpointData) break;
                }

                // Return IS-04 if no URL was able to connect
                if (endpointData === undefined) {
                    set(json, '$connectionAPI', null);
                    return { url: url, data: json };
                }

                for (let i of endpointData) {
                    assign(json, i);
                }
                // For Connection API v1.0
                if (!json.hasOwnProperty('$transporttype')) {
                    assign(json, {
                        $transporttype: 'urn:x-nmos:transport:rtp',
                    });
                }
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
        case UPDATE:
            return { data: { ...json, id: json.id } };
        default:
            //used for prev, next, first, last
            if (resource === 'queryapis') {
                json.map(_ => (_.id = _.name));
            }
            return { url: url, data: json };
    }
}

export default async (type, resource, params) => {
    const { fetchJson } = fetchUtils;
    const { url, options } = convertDataProviderRequestToHTTP(
        type,
        resource,
        params
    );
    return fetchJson(url, options).then(
        response =>
            convertHTTPResponseToDataProvider(
                url,
                response,
                type,
                resource,
                params
            ),
        error => {
            if (error.hasOwnProperty('body.debug')) {
                throw new Error(
                    `${error.body.error} - ${error.body.code} - (${error.body.debug})`
                );
            }
            throw error;
        }
    );
};
