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
import has from 'lodash/has';
import setJSON from 'json-ptr';
import assign from 'lodash/assign';
import diff from 'deep-diff';
import Cookies from 'universal-cookie';

let API_URL = '';

let LINK_HEADERS = {
    nodes: '',
    devices: '',
    sources: '',
    flows: '',
    senders: '',
    receivers: '',
    subscriptions: '',
    logs: '',
};
const LOGGING_API = 'Logging API';
const QUERY_API = 'Query API';
const DNS_API = 'DNS-SD API';

const cookies = new Cookies();

const defaultUrl = api => {
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
};

const returnUrl = resource => {
    let url;
    let api;
    switch (resource) {
        case 'logs':
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
};

export const changeAPIEndpoint = (API, cookieQuery) => {
    if (cookieQuery === '') {
        if (cookies.get(API) === undefined) {
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

const isNumber = v => {
    return !isNaN(v) && !isNaN(parseFloat(v));
};

const convertDataProviderRequestToHTTP = (type, resource, params) => {
    switch (type) {
        case GET_ONE: {
            API_URL = returnUrl(resource);
            if (resource === 'queryapis') {
                return { url: `${API_URL}/_nmos-query._tcp/${params.id}` };
            }
            if (resource === 'logs') {
                return { url: `${API_URL}/events/${params.id}` };
            }
            return { url: `${API_URL}/${resource}/${params.id}` };
        }

        case GET_LIST: {
            if (params.paginationURL) {
                return { url: params.paginationURL };
            }

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
                        if (key === 'level' || typeof value === 'boolean') {
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

            if (pagingLimit) {
                if (resource !== 'logs')
                    queryParams.push('paging.order=update');
                queryParams.push('paging.limit=' + pagingLimit);
            }

            const query = queryParams.join('&');

            if (resource === 'logs') {
                return {
                    url: `${API_URL}/events?${query}`,
                };
            }

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
                //as the fetch component must make a valid connection we'll make the first request here
                return { url: `${API_URL}/${resource}?${total_query}` };
            }
        }
        case GET_MANY_REFERENCE: {
            let total_query;
            if (params.target !== '' && params.id !== '') {
                if (cookies.get('RQL') !== 'false') {
                    total_query =
                        'query.rql=matches(' +
                        params.target +
                        ',string:' +
                        params.id +
                        ',i)';
                } else {
                    total_query = params.target + '=' + params.id;
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
                setJSON.set(patchData, `/${d.path.join('/')}`, d.rhs, true);
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

const timeout = (ms, promise) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('Timeout'));
        }, ms);
        promise.then(resolve, reject);
    });
};

const getEndpoints = (addresses, resource, id) => {
    // Looking for the first promise to succeed or all to fail
    const invertPromise = p => new Promise((res, rej) => p.then(rej, res));
    const firstOf = ps => invertPromise(Promise.all(ps.map(invertPromise)));
    const endpointData = [];
    let connectionAPI;
    const controller = new AbortController();
    const signal = controller.signal;

    return new Promise((resolve, reject) => {
        firstOf(
            addresses.map(address => {
                return timeout(
                    5000,
                    fetch(`${address}/single/${resource}/${id}`, { signal })
                );
            })
        )
            .then(response => {
                connectionAPI = response.url;
                return response.json();
            })
            .then(endpoints => {
                if (get(endpoints, 'code')) {
                    controller.abort();
                    reject(new Error(`${endpoints.error} - ${endpoints.code}`));
                    return;
                }
                Promise.all(
                    endpoints.map(endpoint =>
                        fetch(`${connectionAPI}/${endpoint}`, { signal })
                            .then(response => {
                                if (response.ok) {
                                    return response.text();
                                }
                            })
                            .then(text => {
                                try {
                                    return JSON.parse(text);
                                } catch (e) {
                                    return text;
                                }
                            })
                            .then(data => {
                                endpointData.push({
                                    [`$${endpoint.slice(0, -1)}`]: data,
                                });
                            })
                            .catch(error => {
                                throw error;
                            })
                    )
                ).then(() => {
                    endpointData.push({ $connectionAPI: connectionAPI });
                    controller.abort();
                    resolve(endpointData);
                });
            })
            .catch(errors => {
                controller.abort();
                reject(errors[0]);
            });
    });
};

const convertHTTPResponseToDataProvider = async (
    url,
    response,
    type,
    resource,
    params
) => {
    const { headers, json } = response;
    LINK_HEADERS[resource] = headers.get('Link');
    if (
        LINK_HEADERS[resource] !== null &&
        LINK_HEADERS[resource].match(/<([^>]+)>;[ \t]*rel="next"/)
    ) {
        if (LINK_HEADERS[resource].match(/<([^>]+)>;[ \t]*rel="first"/)) {
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
                // Device.controls was added in v1.1
                if (deviceJSONData.hasOwnProperty('controls')) {
                    deviceJSONData.controls.forEach(control => {
                        const type = control.type.replace('.', '_');
                        if (type.startsWith('urn:x-nmos:control:sr-ctrl')) {
                            if (!connectionAddresses.hasOwnProperty(type)) {
                                set(connectionAddresses, type, [control.href]);
                            } else {
                                connectionAddresses[type].push(control.href);
                            }
                        }
                    });
                }
                // Return IS-04 if no Connection API endpoints
                if (Object.keys(connectionAddresses).length === 0) {
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
                return {
                    data: json,
                    total: json ? json.length : 0,
                };
            }

            const pagination = headers.get('Link')
                ? ['first', 'last', 'next', 'prev']
                      .map(cursor => {
                          return {
                              cursor,
                              data: headers
                                  .get('Link')
                                  .match(
                                      new RegExp(
                                          `<([^>]+)>;[ \\t]*rel="${cursor}"`
                                      )
                                  )[1],
                          };
                      })
                      .reduce((object, item) => {
                          object[item.cursor] = item.data;
                          return object;
                      }, {})
                : null;

            return {
                url: url,
                pagination: pagination,
                data: json,
                total: json ? json.length : 0,
            };
        case GET_MANY:
            if (cookies.get('RQL') === 'false') {
                return await Promise.all(
                    params.ids.map(
                        id =>
                            new Promise(resolve =>
                                fetch(`${API_URL}/${resource}?id=${id}`)
                                    .then(response => response.json())
                                    .then(json => resolve(json[0]))
                            )
                    )
                ).then(response => {
                    return { url: url, data: response };
                });
            }
            return {
                url: url,
                data: json,
            };
        case GET_MANY_REFERENCE:
            return {
                url: url,
                data: json,
                total: null,
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
};

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
            if (error && has(error, 'body.debug'))
                throw new Error(
                    get(error.body, 'error') +
                        ' - ' +
                        get(error.body, 'code') +
                        ' - ' +
                        get(error.body, 'debug')
                );
            throw error;
        }
    );
};
