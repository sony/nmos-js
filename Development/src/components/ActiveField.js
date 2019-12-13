import React, { useEffect } from 'react';
import { Switch } from '@material-ui/core';
import { useNotify } from 'react-admin';
import get from 'lodash/get';
import omit from 'lodash/omit';
import dataProvider from '../dataProvider';

const sanitizeRestProps = props =>
    omit(props, [
        'addLabel',
        'allowEmpty',
        'basePath',
        'cellClassName',
        'className',
        'formClassName',
        'headerClassName',
        'label',
        'linkType',
        'link',
        'locale',
        'record',
        'resource',
        'sortable',
        'sortBy',
        'source',
        'textAlign',
        'translateChoice',
    ]);

const toggleMasterEnable = (record, resource) => {
    return new Promise((resolve, reject) =>
        dataProvider('GET_ONE', resource, {
            id: record.id,
        })
            .then(({ data }) => {
                const params = {
                    id: get(data, 'id'),
                    data: {
                        ...data,
                        $staged: {
                            ...get(data, '$staged'),
                            master_enable: !get(data, '$staged.master_enable'),
                            activation: { mode: 'activate_immediate' },
                        },
                    },
                    previousData: data,
                };
                return dataProvider('UPDATE', resource, params);
            })
            .then(() => resolve())
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
            .then(() => setChecked(!checked))
            .catch(error => notify(error.toString(), 'warning'));
    };

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
