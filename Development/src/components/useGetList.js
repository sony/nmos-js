import { shallowEqual, useSelector } from 'react-redux';

import {
    CRUD_GET_LIST,
    useCheckMinimumRequiredProps,
    useNotify,
    useQueryWithStore,
    useVersion,
} from 'react-admin';

const useGetList = props => {
    useCheckMinimumRequiredProps(
        'List',
        [
            'basePath',
            'filter',
            'location',
            'paginationCursor',
            'resource',
            'seed',
        ],
        props
    );
    const {
        basePath,
        resource,
        hasCreate,
        paginationCursor,
        filter,
        seed,
    } = props;

    const notify = useNotify();
    const version = useVersion();

    const { total, loading, loaded, error } = useQueryWithStore(
        {
            type: 'getList',
            resource,
            payload: {
                seed,
                paginationCursor,
                filter,
            },
        },
        {
            action: CRUD_GET_LIST,
            version,
            onFailure: error =>
                notify(
                    typeof error === 'string'
                        ? error
                        : error.message || 'ra.notification.http_error',
                    'warning'
                ),
        },
        state =>
            state.admin.resources[resource]
                ? state.admin.resources[resource].list.ids
                : null,
        state =>
            state.admin.resources[resource]
                ? state.admin.resources[resource].list.total
                : null
    );
    const data = useSelector(
        state =>
            state.admin.resources[resource]
                ? state.admin.resources[resource].data
                : null,
        shallowEqual
    );
    const ids = useSelector(
        state =>
            state.admin.resources[resource]
                ? state.admin.resources[resource].list.ids
                : null,
        shallowEqual
    );

    const listDataObject = {};
    ids.forEach(key => (listDataObject[key] = data[key]));

    const listDataArray = Object.keys(listDataObject).map(key => {
        return listDataObject[key];
    });

    return {
        basePath,
        data: listDataArray,
        error,
        hasCreate,
        ids,
        loading,
        loaded,
        resource,
        total,
        version,
    };
};

export default useGetList;
