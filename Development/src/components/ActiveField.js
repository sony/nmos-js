import React, { useEffect } from 'react';
import { Switch } from '@material-ui/core';
import { useNotify } from 'react-admin';
import get from 'lodash/get';
import dataProvider from '../dataProvider';
import sanitizeRestProps from './sanitizeRestProps';

const toggleMasterEnable = (record, resource) => {
    return new Promise((resolve, reject) =>
        dataProvider('GET_ONE', resource, {
            id: record.id,
        })
            .then(({ data }) => {
                if (!data.hasOwnProperty('$staged')) {
                    throw new Error('No Connection API found');
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
            })
            .then(response => resolve(response))
            .catch(error => reject(error))
    );
};

const ActiveField = ({ className, source, record = {}, resource, ...rest }) => {
    const notify = useNotify();
    const [checked, setChecked] = React.useState(
        get(record, 'subscription.active')
    );

    const handleChange = (record, resource) => {
        toggleMasterEnable(record, resource)
            .then(({ data }) => setChecked(get(data, 'master_enable')))
            .catch(error => notify(error.toString(), 'warning'));
    };

    // When the page refresh button is pressed, the ActiveField will receive a
    // new record prop. When this happens we should update the state of the
    // switch to reflect the newest IS-04 data
    useEffect(() => {
        setChecked(get(record, 'subscription.active'));
    }, [record]);

    return (
        <Switch
            checked={checked}
            onChange={() => handleChange(record, resource)}
            className={className}
            value={checked}
            {...sanitizeRestProps(rest)}
        />
    );
};

ActiveField.defaultProps = {
    addLabel: true,
};

export default ActiveField;
