import React from 'react';
import {
    BooleanInput,
    Create,
    ListButton,
    NumberInput,
    SelectInput,
    SimpleForm,
    Toolbar,
    TopToolbar,
} from 'react-admin';
import ObjectInput from '../../components/ObjectInput';
import RawButton from '../../components/RawButton';

const SubscriptionsCreateActions = ({ basePath, data, resource }) => (
    <TopToolbar>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton basePath={basePath} />
    </TopToolbar>
);

const SubscriptionsCreate = props => (
    <Create actions={<SubscriptionsCreateActions />} {...props}>
        <SimpleForm
            toolbar={<Toolbar alwaysEnableSaveButton />}
            redirect="show"
        >
            <SelectInput
                source="resource_path"
                label="Resource Path"
                choices={[
                    { id: '', name: '(none)' },
                    { id: '/nodes', name: '/nodes' },
                    { id: '/devices', name: '/devices' },
                    { id: '/sources', name: '/sources' },
                    { id: '/flows', name: '/flows' },
                    { id: '/senders', name: '/senders' },
                    { id: '/receivers', name: '/receivers' },
                ]}
                initialValue=""
                parse={value => value}
            />
            <NumberInput
                source="max_update_rate_ms"
                label="Max Update Rate (ms)"
                initialValue={100}
            />
            <ObjectInput source="params" initialValue={{}} />
            <BooleanInput source="persist" initialValue={true} />
        </SimpleForm>
    </Create>
);

export default SubscriptionsCreate;
