import React, { useEffect } from 'react';
import { Switch, Tooltip } from '@material-ui/core';
import { useNotify, useRefresh } from 'react-admin';
import get from 'lodash/get';
import dataProvider from '../dataProvider';
import sanitizeRestProps from './sanitizeRestProps';
import { CONNECTION_API_NOT_AVAILABLE } from './controlApiMessages';

const toggleMasterEnable = (record, resource) => {
    const patch = data => {
        if (!data.hasOwnProperty('$staged')) {
            throw new Error(CONNECTION_API_NOT_AVAILABLE);
        }
        const params = {
            id: get(data, 'id'),
            data: {
                ...data,
                $staged: {
                    ...get(data, '$staged'),
                    master_enable: !get(data, '$active.master_enable'),
                    activation: { mode: 'activate_immediate' },
                },
            },
            previousData: data,
        };
        return dataProvider('UPDATE', resource, params);
    };
    // the Sender and Receiver Show pages already GET_ONE'd every endpoint;
    // the Connections page headings and the list page rows are IS-04 only,
    // so they still need a fetch
    if (record.hasOwnProperty('$staged') && record.hasOwnProperty('$active')) {
        return patch(record);
    }
    return dataProvider('GET_ONE', resource, {
        id: record.id,
    }).then(({ data }) => patch(data));
};

const ActiveField = ({ className, source, record = {}, resource, ...rest }) => {
    const notify = useNotify();
    const refresh = useRefresh();
    const [checked, setChecked] = React.useState(
        get(record, 'subscription.active')
    );
    const unavailable = get(record, '$connectionAPI') === null;

    const handleChange = (record, resource) => {
        toggleMasterEnable(record, resource)
            .then(({ data }) => {
                setChecked(get(data, 'master_enable'));
                // the IS-04 record and any IS-05 data on show alongside it,
                // such as the Active and Staged tabs, are now out of date
                refresh();
            })
            .catch(error => notify(error.toString(), 'warning'));
    };

    // When the page refresh button is pressed, the ActiveField will receive a
    // new record prop. When this happens we should update the state of the
    // switch to reflect the newest IS-04 data
    useEffect(() => {
        setChecked(get(record, 'subscription.active'));
    }, [record]);

    const control = (
        <Switch
            color="primary"
            checked={checked}
            onChange={() => handleChange(record, resource)}
            className={className}
            value={checked}
            {...sanitizeRestProps(rest)}
        />
    );
    // where the record says there is no Connection API, say so on hover;
    // trying it anyway still explains itself in the notification
    return unavailable ? (
        <Tooltip arrow title={CONNECTION_API_NOT_AVAILABLE}>
            <span>{control}</span>
        </Tooltip>
    ) : (
        control
    );
};

ActiveField.defaultProps = {
    addLabel: true,
};

export default ActiveField;
