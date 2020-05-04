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

const LOGGING_API = 'Logging API';
const QUERY_API = 'Query API';
const DNS_API = 'DNS-SD API';

const cookies = new Cookies();

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
        case DNS_API:
            return baseUrl + '/x-dns-sd/v1.0';
        default:
            //not expected to be used
            return '';
    }
};

export const resourceUrl = (resource, subresourceQuery = '') => {
    let url;
    let api;
    let res;
    switch (resource) {
        case 'logs':
            api = LOGGING_API;
            res = 'events';
            break;
        case 'queryapis':
            api = DNS_API;
            res = '_nmos-query._tcp';
            break;
        default:
            //all pages other than logs/queryapis
            api = QUERY_API;
            res = resource;
            break;
    }
    url = cookies.get(api);
    if (url === undefined) {
        url = defaultUrl(api);
    }

    return concatUrl(url, `/${res}${subresourceQuery}`);
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

// see https://github.com/persvr/rql/blob/v0.3.3/specification/draft-zyp-rql-00.xml#L355-L357
const encodeRQLNameChars = str => {
    return encodeURIComponent(str).replace(/[!'()]/g, c => {
        return '%' + c.charCodeAt(0).toString(16);
    });
};

const isNumber = v => {
    return !isNaN(v) && !isNaN(parseFloat(v));
};

const convertDataProviderRequestToHTTP = (
    type,
    resource,
    params,
    pagingLimit
) => {
    //fetchJson won't add the Accept header itself if we specify any headers in options
    const headers = new Headers({ Accept: 'application/json' });
    if (resource === 'queryapis') {
        headers.set('Request-Timeout', 4);
    }

    switch (type) {
        case GET_ONE: {
            return {
                url: resourceUrl(resource, `/${params.id}`),
                options: { headers },
            };
        }

        case GET_LIST: {
            const referenceFilter = {};
            // reference filters have special keys like '$<resourceType>.<param>'
            // where <resourceType> is e.g. 'flow', implying a 'flow_id' property that refers to a Flow (in /flows) by its 'id'
            // and <param> is a filter key for that resource, e.g. 'format' or possibly even '$source.channels.symbol'
            const isReferenceFilter = key => key.startsWith('$');
            const addReferenceFilter = (key, value) => {
                const dot = key.indexOf('.');
                if (dot > 1) {
                    const ref = key.substring(1, dot);
                    const refKey = key.substring(dot + 1);
                    if (!referenceFilter.hasOwnProperty(ref))
                        set(referenceFilter, ref, {});
                    referenceFilter[ref][refKey] = value;
                }
            };
            if (params.paginationURL) {
                for (const [key, value] of Object.entries(params.filter)) {
                    if (isReferenceFilter(key)) {
                        addReferenceFilter(key, value);
                    }
                }
                return {
                    url: params.paginationURL,
                    options: { headers },
                    referenceFilter,
                };
            }

            const pagingLimit = cookies.get('Paging Limit');
            const queryParams = [];

            if (resource === 'queryapis' || cookies.get('RQL') === 'false') {
                for (const [key, value] of Object.entries(params.filter)) {
                    if (isReferenceFilter(key)) {
                        addReferenceFilter(key, value);
                        continue;
                    }
                    if (Array.isArray(value)) {
                        //hmm, in basic query syntax, multiple values are not supported
                    } else if (typeof value == 'string' && value.length > 0) {
                        //ignore empty strings
                        queryParams.push(key + '=' + encodeURIComponent(value));
                    } else if (typeof value === 'boolean') {
                        queryParams.push(key + '=' + encodeURIComponent(value));
                    } else if (typeof value === 'number' && !isNaN(value)) {
                        queryParams.push(key + '=' + encodeURIComponent(value));
                    }
                }
            } else {
                const matchParams = [];
                for (const [key, value] of Object.entries(params.filter)) {
                    if (key.startsWith('$')) {
                        addReferenceFilter(key, value);
                        continue;
                    }
                    const keyMatchParams = [];
                    const values = Array.isArray(value) ? value : [value];
                    for (const value of values) {
                        if (typeof value === 'string') {
                            //most properties are strings for which partial matches are useful
                            //hmm, event_type wildcards like 'number/temperature/*' are working by chance
                            let encodedValue = encodeRQLNameChars(value);
                            encodedValue = encodedValue.split('%2C'); //splits comma separated values
                            for (const matchValue of encodedValue) {
                                if (value.length > 0) {
	                                keyMatchParams.push(
	                                    'matches(' +
	                                        key +
	                                        ',string:' +
	                                        matchValue +
	                                        ',i)'
	                                );
	                            }
                            }
                        } else if (typeof value === 'boolean') {
                            //a few properties are Boolean
                            keyMatchParams.push(
                                'eq(' +
                                    key +
                                    ',' +
                                    encodeRQLNameChars(value) +
                                    ')'
                            );
                        } else if (typeof value === 'number') {
                            //a few are integers
                            if (!isNaN(value)) {
                                keyMatchParams.push(
                                    'eq(' +
                                        key +
                                        ',' +
                                        encodeRQLNameChars(value) +
                                        ')'
                                );
                            }
                        }
                    }
                    if (keyMatchParams.length > 1) {
                        matchParams.push(
                            'or(' + keyMatchParams.join(',') + ')'
                        );
                    } else if (keyMatchParams.length === 1) {
                        matchParams.push(keyMatchParams[0]);
                    }
                }
                const rqlFilter = matchParams.join(',');
                if (rqlFilter) {
                    queryParams.push('query.rql=and(' + rqlFilter + ')');
                }
            }

            if (resource !== 'queryapis' && pagingLimit) {
                if (resource !== 'logs')
                    queryParams.push('paging.order=update');
                queryParams.push('paging.limit=' + pagingLimit);
            }

            const query = queryParams.join('&');

            if (query !== '') {
                return {
                    url: resourceUrl(resource, `?${query}`),
                    options: { headers },
                    referenceFilter,
                };
            } else {
                return {
                    url: resourceUrl(resource),
                    options: { headers },
                    referenceFilter,
                };
            }
        }
        case GET_MANY: {
            let total_query;
            if (cookies.get('RQL') !== 'false') {
                //!false is used as the initial no cookie state has the rql toggle in the enabled state
                total_query =
                    'query.rql=or(' +
                    params.ids.map(id => 'eq(id,' + id + ')').join(',') +
                    ')';
                total_query += '&paging.limit=1000';
                return {
                    url: resourceUrl(resource, `?${total_query}`),
                    options: { headers },
                };
            } else {
                total_query = 'id=' + params.ids[0];
                //hmm, need to make multiple requests if we have to match one at a time with basic query syntax
                //as the fetch component must make a valid connection we'll make the first request here
                return {
                    url: resourceUrl(resource, `?${total_query}`),
                    options: { headers },
                };
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
                return {
                    url: resourceUrl(resource, `?${total_query}`),
                    options: { headers },
                };
            } else {
                return {
                    url: resourceUrl(resource),
                    options: { headers },
                };
            }
        }
        case UPDATE: {
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

            return {
                url: concatUrl(params.data.$connectionAPI, '/staged'),
                options: {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify(patchData),
                },
            };
        }
        case CREATE: {
            return {
                url: resourceUrl(resource),
                options: {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(params.data),
                },
            };
        }
        case DELETE: {
            return {
                url: resourceUrl(resource, `/${params.id}`),
                options: {
                    method: 'DELETE',
                    headers,
                },
            };
        }
        default: {
            //not expected to be used
            return '';
        }
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
                    fetch(concatUrl(address, `/single/${resource}/${id}`), {
                        signal,
                    })
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
                        fetch(concatUrl(connectionAPI, `/${endpoint}`), {
                            signal,
                        })
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

const filterAsync = async (data, predicate) => {
    let result = await Promise.all(
        data.map((element, index) => predicate(element, index, data))
    );
    return data.filter((element, index) => {
        return result[index];
    });
};

const filterResult = async (json, referenceFilter) => {
    return filterAsync(json, async object => {
        //hm, this could be parallelized too?
        for (const ref in referenceFilter) {
            const id = object[ref + '_id'];
            const data = (await dataProvider(GET_LIST, ref + 's', {
                filter: { ...referenceFilter[ref], id: id },
            })).data;
            if (data.length === 0) return false;
        }
        return true;
    });
};

const convertHTTPResponseToDataProvider = async (
    url,
    response,
    type,
    resource,
    params,
    referenceFilter
) => {
    const { headers, json } = response;

    switch (type) {
        case GET_ONE:
            if (resource === 'queryapis') {
                json.id = json.name;
            }
            if (resource === 'receivers' || resource === 'senders') {
                let resourceJSONData = await fetch(
                    resourceUrl(resource, `/${params.id}`)
                ).then(result => result.json());

                let deviceJSONData;
                if (resourceJSONData.hasOwnProperty('device_id')) {
                    deviceJSONData = await fetch(
                        resourceUrl('devices', `/${resourceJSONData.device_id}`)
                    ).then(result => result.json());
                } else {
                    return { url, data: json };
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
                    return { url, data: json };
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
                    return { url, data: json };
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
            return { url, data: json };

        case GET_LIST:
            if (resource === 'queryapis') {
                json.map(_ => (_.id = _.name));
                return {
                    url,
                    data: json,
                    total: json ? json.length : 0,
                };
            }

            let pagination = null;
            const linkHeader = headers.get('Link');
            if (linkHeader) {
                pagination = {};
                for (let cursor of ['first', 'last', 'next', 'prev']) {
                    const match = linkHeader.match(
                        new RegExp(`<([^>]+)>;[ \\t]*rel="${cursor}"`)
                    );
                    if (match) {
                        pagination[cursor] = match[1];
                    }
                }
            }
            if (referenceFilter && referenceFilter.length !== 0) {
                let filtered = await filterResult(json, referenceFilter);
                return {
                    url,
                    pagination,
                    data: filtered,
                    total: filtered ? filtered.length : 0,
                    unfilteredTotal: json ? json.length : 0,
                };
            }

            return {
                url,
                pagination,
                data: json,
                total: json ? json.length : 0,
            };
        case GET_MANY:
            if (cookies.get('RQL') === 'false') {
                return await Promise.all(
                    params.ids.map(
                        id =>
                            new Promise(resolve =>
                                fetch(resourceUrl(resource, `?id=${id}`))
                                    .then(response => response.json())
                                    .then(json => resolve(json[0]))
                            )
                    )
                ).then(response => {
                    return { url, data: response };
                });
            }
            return {
                url,
                data: json,
            };
        case GET_MANY_REFERENCE:
            return {
                url,
                data: json,
                total: null,
            };
        case UPDATE:
            return { data: { ...json, id: json.id } };
        case CREATE:
            return { data: { ...params.data, id: json.id } };
        case DELETE:
            return { data: { id: params.id } };
        default:
            //used for prev, next, first, last
            if (resource === 'queryapis') {
                json.map(_ => (_.id = _.name));
            }
            return { url, data: json };
    }
};

const dataProvider = async (type, resource, params) => {
    const { fetchJson } = fetchUtils;
    const pagingLimit = parseInt(cookies.get('Paging Limit'), 10);
    const pagingLimitRegex = /paging.limit=\d*/;
    let recordsToGet = pagingLimit ? pagingLimit : null;
    let result = null;
    while (recordsToGet === null || recordsToGet !== 0) {
        const {
            url,
            options,
            referenceFilter,
        } = convertDataProviderRequestToHTTP(
            type,
            resource,
            params,
            recordsToGet
        );
        try {
            let response = await fetchJson(url, options);
            let data = await convertHTTPResponseToDataProvider(
                url,
                response,
                type,
                resource,
                params,
                referenceFilter
            );
            let pageForward =
                params.paginationURL &&
                params.paginationURL.includes('paging.since');
            if (
                recordsToGet !== null &&
                data.unfilteredTotal &&
                data.unfilteredTotal === recordsToGet &&
                data.unfilteredTotal !== data.total
            ) {
                // unfiltered data returned a whole page of data so more results are potentially available
                recordsToGet -= data.total;
                params.paginationURL = (pageForward
                    ? data.pagination.next
                    : data.pagination.prev
                ).replace(pagingLimitRegex, 'paging.limit=' + recordsToGet);
            } else {
                recordsToGet = 0;
            }
            if (!result) {
                result = data;
            } else {
                if (pageForward) {
                    result.total = result.data.unshift(...data.data);
                    result.pagination.next = data.pagination.next.replace(
                        pagingLimitRegex,
                        'paging.limit=' + pagingLimit
                    );
                } else {
                    result.total = result.data.push(...data.data);
                    result.pagination.prev = data.pagination.prev.replace(
                        pagingLimitRegex,
                        'paging.limit=' + pagingLimit
                    );
                }
            }
        } catch (error) {
            if (error && has(error, 'body.debug')) {
                throw new Error(
                    get(error.body, 'error') +
                        ' - ' +
                        get(error.body, 'code') +
                        ' - ' +
                        get(error.body, 'debug')
                );
            }
            throw error;
        }
    }
    delete result.unfilteredTotal;
    return result;
};

export default dataProvider;
