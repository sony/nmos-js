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
import isEmpty from 'lodash/isEmpty';
import { JsonPointer } from 'json-ptr';
import assign from 'lodash/assign';
import diff from 'deep-diff';
import {
    DNSSD_API,
    LOGGING_API,
    QUERY_API,
    apiPagingLimit,
    apiUrl,
    apiUseRql,
    concatUrl,
} from './settings';

const apiResource = resource => {
    let api;
    let res;
    switch (resource) {
        case 'logs':
            api = LOGGING_API;
            res = 'events';
            break;
        case 'queryapis':
            api = DNSSD_API;
            res = '_nmos-query._tcp';
            break;
        default:
            // all pages other than logs/queryapis
            api = QUERY_API;
            res = resource;
            break;
    }
    return { api, res };
};

export const resourceUrl = (resource, subresourceQuery = '') => {
    const { api, res } = apiResource(resource);
    return concatUrl(apiUrl(api), `/${res}${subresourceQuery}`);
};

const isNumber = value => {
    return !isNaN(value) && !isNaN(parseFloat(value));
};

const isRational = value => {
    return has(value, 'numerator');
};

const isRationalNaN = value => {
    const n = get(value, 'numerator');
    const d = get(value, 'denominator');
    return isNaN(n) && isNaN(d);
};

const encodeBasicKeyValueFilter = (key, value) => {
    if (Array.isArray(value)) {
        // hmm, in basic query syntax, multiple values are not supported
        console.warn('Basic query - unsupported filter type:', 'Array');
    } else if (typeof value == 'string') {
        // ignore empty strings
        if (value.length > 0) {
            return key + '=' + encodeURIComponent(value);
        }
    } else if (typeof value === 'boolean') {
        return key + '=' + encodeURIComponent(value);
    } else if (typeof value === 'number') {
        // ignore NaN
        if (!isNaN(value)) {
            return key + '=' + encodeURIComponent(value);
        }
    } else if (isRational(value)) {
        // in basic query syntax, the rational's numerator and denominator are passed independently
        const n = get(value, 'numerator');
        const d = get(value, 'denominator');
        const r = [];
        if (!isNaN(n)) {
            r.push(key + '.numerator=' + encodeURIComponent(n));
        }
        if (!isNaN(d)) {
            r.push(key + '.denominator=' + encodeURIComponent(d));
        }
        return r.join('&');
    } else if (value != null) {
        console.warn('Basic query - unsupported filter type:', typeof value);
    }
    return null;
};

// see https://github.com/persvr/rql/blob/v0.3.3/specification/draft-zyp-rql-00.xml#L355-L357
const encodeRQLNameChars = str => {
    return encodeURIComponent(str).replace(/[!'()]/g, c => {
        return '%' + c.charCodeAt(0).toString(16);
    });
};

const encodeRQLRational = value => {
    const n = get(value, 'numerator');
    const d = get(value, 'denominator');
    return (
        'rational:' +
        encodeRQLNameChars((!isNaN(n) ? n : 0) + '/' + (!isNaN(d) ? d : 1))
    );
};

const encodeRQLSampling = value => 'sampling:' + encodeRQLNameChars(value);

const encodeRQLKeyValueFilter = (key, value) => {
    const values = Array.isArray(value) ? value : [value];
    const terms = [];
    for (const value of values) {
        if (typeof value === 'string') {
            // most properties are strings for which partial matches are useful
            // hmm, event_type wildcards like 'number/temperature/*' are working by chance
            let encodedValue = encodeRQLNameChars(value);
            encodedValue = encodedValue.split('%2C'); // splits comma separated values
            for (const matchValue of encodedValue) {
                // ignore empty strings
                if (value.length > 0) {
                    terms.push(
                        'matches(' + key + ',string:' + matchValue + ',i)'
                    );
                }
            }
        } else if (typeof value === 'boolean') {
            terms.push('eq(' + key + ',' + encodeRQLNameChars(value) + ')');
        } else if (typeof value === 'number') {
            // ignore NaN
            if (!isNaN(value)) {
                terms.push('eq(' + key + ',' + encodeRQLNameChars(value) + ')');
            }
        } else if (isRational(value)) {
            if (!isRationalNaN(value)) {
                terms.push('eq(' + key + ',' + encodeRQLRational(value) + ')');
            }
        } else if (value != null) {
            console.warn('RQL query - unsupported filter type:', typeof value);
        }
    }
    if (terms.length > 1) {
        return 'or(' + terms.join(',') + ')';
    } else if (terms.length === 1) {
        return terms[0];
    } else {
        return null;
    }
};

const encodeRQLConstraint = (
    constraint,
    name,
    defaultValue = null,
    encodeValue = encodeRQLNameChars
) => {
    const terms = [];

    if (has(constraint, 'minimum')) {
        terms.push(
            'ge(' + name + ',' + encodeValue(get(constraint, 'minimum')) + ')'
        );
    }

    if (has(constraint, 'maximum')) {
        terms.push(
            'le(' + name + ',' + encodeValue(get(constraint, 'maximum')) + ')'
        );
    }

    if (has(constraint, 'enum')) {
        const enumConstraint = get(constraint, 'enum').map(encodeValue);

        // if the constraint is the parameter default then sender support may be implicit
        // (i.e. may not be explicitly stated)
        if (enumConstraint.includes(defaultValue)) {
            enumConstraint.push('null');
        }
        terms.push('in(' + name + ',(' + enumConstraint.join(',') + '))');
    }

    if (terms.length > 1) {
        return 'and(' + terms.join(',') + ')';
    } else if (terms.length === 1) {
        return terms[0];
    } else {
        // if there is neither minimum, maximum, nor enum then the parameter is explicitly
        // unconstrained and null is returned
        return null;
    }
};

const paramConstraintMap = {
    // General Constraints

    'urn:x-nmos:cap:format:media_type': constraint =>
        encodeRQLConstraint(constraint, 'media_type'),
    // if grain_rate is not expressed in the flow, fall back to querying the source
    'urn:x-nmos:cap:format:grain_rate': constraint => {
        const filter = encodeRQLConstraint(
            constraint,
            'grain_rate',
            null,
            encodeRQLRational
        );
        return (
            'or(' +
            filter +
            ',and(eq(grain_rate,null),rel(source_id,' +
            filter +
            ')))'
        );
    },

    // Video Constraints

    'urn:x-nmos:cap:format:frame_height': constraint =>
        encodeRQLConstraint(constraint, 'frame_height'),
    'urn:x-nmos:cap:format:frame_width': constraint =>
        encodeRQLConstraint(constraint, 'frame_width'),
    'urn:x-nmos:cap:format:color_sampling': constraint =>
        encodeRQLConstraint(constraint, 'components', null, encodeRQLSampling),
    'urn:x-nmos:cap:format:interlace_mode': constraint =>
        encodeRQLConstraint(constraint, 'interlace_mode', 'progressive'),
    'urn:x-nmos:cap:format:colorspace': constraint =>
        encodeRQLConstraint(constraint, 'colorspace'),
    'urn:x-nmos:cap:format:transfer_characteristic': constraint =>
        encodeRQLConstraint(constraint, 'transfer_characteristic', 'SDR'),
    // check bit depths of *all* components satisfy the constraint
    // using the experimental 'sub' call-operator and a double negation
    // i.e. constraint is *not* satisfied when *any* component's bit depth is *not* acceptable
    'urn:x-nmos:cap:format:component_depth': constraint => {
        const filter = encodeRQLConstraint(constraint, 'bit_depth');
        return 'not(sub(components,not(' + filter + ')))';
    },

    // Audio Constraints

    // channel count is not expressed in the flow, but is implicitly expressed in the source
    'urn:x-nmos:cap:format:channel_count': constraint =>
        'rel(source_id,' +
        encodeRQLConstraint(constraint, 'count(channels)') +
        ')',
    'urn:x-nmos:cap:format:sample_rate': constraint =>
        encodeRQLConstraint(constraint, 'sample_rate', null, encodeRQLRational),
    'urn:x-nmos:cap:format:sample_depth': constraint =>
        encodeRQLConstraint(constraint, 'bit_depth'),

    // Event Constraints

    // hmm, IS-04 has event_type as optional in the flow, so we could fall back to querying
    // the source, like for grain_rate, but IS-07 seems to mandate it so not doing so for now
    'urn:x-nmos:cap:format:event_type': constraint =>
        encodeRQLConstraint(constraint, 'event_type'),

    // Transport Constraints

    //TODO: urn:x-nmos:cap:transport:packet_time
    //TODO: urn:x-nmos:cap:transport:max_packet_time
    //TODO: urn:x-nmos:cap:transport:st2110_21_sender_type
};

const convertDataProviderRequestToHTTP = (
    type,
    resource,
    params,
    pagingLimit
) => {
    const { api } = apiResource(resource);
    const useRql = resource !== 'queryapis' && apiUseRql(api);

    // fetchJson won't add the Accept header itself if we specify any headers in options
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
                    if (!has(referenceFilter, ref))
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

            const queryParams = [];

            if (!useRql) {
                for (const [key, value] of Object.entries(params.filter)) {
                    if (isReferenceFilter(key)) {
                        addReferenceFilter(key, value);
                        continue;
                    }
                    const keyValueParam = encodeBasicKeyValueFilter(key, value);
                    if (keyValueParam) {
                        queryParams.push(keyValueParam);
                    }
                }
            } else {
                const matchParams = [];
                for (const [key, value] of Object.entries(params.filter)) {
                    if (isReferenceFilter(key)) {
                        addReferenceFilter(key, value);
                        continue;
                    }
                    const keyValueParam = encodeRQLKeyValueFilter(key, value);
                    if (keyValueParam) {
                        matchParams.push(keyValueParam);
                    }
                }
                // turn some '$flow' reference filters back into RQL 'rel' call-operators
                const flowFilters = [];
                const flow = get(referenceFilter, 'flow');
                if (flow) {
                    for (const key of [
                        'format',
                        'media_type',
                        'event_type',
                        'grain_rate',
                        'sample_rate',
                    ]) {
                        const value = get(flow, key);
                        if (value) {
                            const keyValueParam = encodeRQLKeyValueFilter(
                                key,
                                value
                            );
                            if (keyValueParam) {
                                flowFilters.push(keyValueParam);
                            }
                        }
                        delete flow[key];
                    }
                    if (isEmpty(flow)) {
                        delete referenceFilter['flow'];
                    }
                }
                // do the same for '$constraint_sets'
                const constraintSets = get(params.filter, '$constraint_sets');
                const constraintSetsActive = get(
                    params.filter,
                    '$constraint_sets_active'
                );

                if (constraintSets && constraintSetsActive !== undefined) {
                    const constraintSetsFilters = [];
                    for (const constraintSet of constraintSets) {
                        // ignore a contraint_set if the enabled flag is set to false
                        // note that constraintSet['urn:x-nmos:cap:meta:enabled'] being undefined is considered as enabled=true
                        if (
                            constraintSet['urn:x-nmos:cap:meta:enabled'] ===
                            false
                        ) {
                            continue;
                        }
                        const paramFilters = [];
                        for (const paramConstraint in constraintSet) {
                            if (paramConstraint in paramConstraintMap) {
                                const filter = paramConstraintMap[
                                    paramConstraint
                                ](constraintSet[paramConstraint]);
                                // check for unconstrained parameters
                                if (filter) {
                                    paramFilters.push(filter);
                                }
                            }
                        }
                        if (paramFilters.length > 1) {
                            constraintSetsFilters.push(
                                'and(' + paramFilters.join(',') + ')'
                            );
                        } else if (paramFilters.length === 1) {
                            constraintSetsFilters.push(paramFilters[0]);
                        }
                    }
                    if (constraintSetsFilters.length > 1) {
                        flowFilters.push(
                            'or(' + constraintSetsFilters.join(',') + ')'
                        );
                    } else if (constraintSetsFilters.length === 1) {
                        flowFilters.push(constraintSetsFilters[0]);
                    }
                }
                if (flowFilters.length > 1) {
                    matchParams.push(
                        'rel(flow_id,and(' + flowFilters.join(',') + '))'
                    );
                } else if (flowFilters.length === 1) {
                    matchParams.push('rel(flow_id,' + flowFilters[0] + ')');
                }
                if (matchParams.length > 1) {
                    queryParams.push(
                        'query.rql=and(' + matchParams.join(',') + ')'
                    );
                } else if (matchParams.length === 1) {
                    queryParams.push('query.rql=' + matchParams[0]);
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
            if (useRql) {
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
                // hmm, need to make multiple requests if we have to match one at a time with basic query syntax
                // as the fetch component must make a valid connection we'll make the first request here
                return {
                    url: resourceUrl(resource, `?${total_query}`),
                    options: { headers },
                };
            }
        }
        case GET_MANY_REFERENCE: {
            let total_query;
            if (params.target !== '' && params.id !== '') {
                if (useRql) {
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
                JsonPointer.set(patchData, `/${d.path.join('/')}`, d.rhs, true);
            }

            if (has(patchData, 'transport_file')) {
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
            // not expected to be used
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
        // hm, this could be parallelized too?
        for (const ref in referenceFilter) {
            const id = object[ref + '_id'];
            const data = (
                await dataProvider(GET_LIST, ref + 's', {
                    filter: { ...referenceFilter[ref], id: id },
                })
            ).data;
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

    const { api } = apiResource(resource);
    const useRql = resource !== 'queryapis' && apiUseRql(api);

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
                if (has(resourceJSONData, 'device_id')) {
                    deviceJSONData = await fetch(
                        resourceUrl('devices', `/${resourceJSONData.device_id}`)
                    ).then(result => result.json());
                } else {
                    return { url, data: json };
                }

                let connectionAddresses = {};
                // Device.controls was added in v1.1
                if (has(deviceJSONData, 'controls')) {
                    deviceJSONData.controls.forEach(control => {
                        const type = control.type.replace('.', '_');
                        if (type.startsWith('urn:x-nmos:control:sr-ctrl')) {
                            if (!has(connectionAddresses, type)) {
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
                if (!has(json, '$transporttype')) {
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
            if (!useRql) {
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
            // used for prev, next, first, last
            if (resource === 'queryapis') {
                json.map(_ => (_.id = _.name));
            }
            return { url, data: json };
    }
};

const dataProvider = async (type, resource, params) => {
    const { fetchJson } = fetchUtils;
    const { api } = apiResource(resource);
    const pagingLimit = apiPagingLimit(api);
    const pagingLimitRegex = /paging.limit=\d*/;
    let recordsToGet = pagingLimit;
    let result = null;
    while (recordsToGet > 0) {
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
    if (result) {
        delete result.unfilteredTotal;
    }
    return result;
};

export default dataProvider;
