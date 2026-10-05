import React from 'react';
import { useTheme } from '@material-ui/core/styles';
import {
    BooleanInput,
    Create,
    ListButton,
    NumberInput,
    SaveButton,
    SelectInput,
    SimpleForm,
    Toolbar,
    TopToolbar,
} from 'react-admin';
import { useFormState } from 'react-final-form';
import PublishIcon from '@material-ui/icons/Publish';
import ObjectInput from '../../components/ObjectInput';
import RawButton from '../../components/RawButton';

// 13px is the small button, the same size as the empty word.
const menuWordStyle = (selected, color) => ({
    fontSize: 13,
    fontWeight: selected ? 600 : 400,
    color: selected ? color : undefined,
});

const EmptyResourcePath = () => {
    const theme = useTheme();
    const value = useFormState().values.resource_path;
    const selected = value == null || value === '';
    return (
        <span style={menuWordStyle(selected, theme.palette.primary.main)}>
            empty
        </span>
    );
};

const SubscriptionsCreateActions = ({ basePath, data, resource }) => (
    <TopToolbar>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton basePath={basePath} />
    </TopToolbar>
);

const SubscriptionsCreate = props => (
    <Create actions={<SubscriptionsCreateActions />} {...props}>
        <SimpleForm
            toolbar={
                <Toolbar alwaysEnableSaveButton>
                    <SaveButton icon={<PublishIcon />} />
                </Toolbar>
            }
            redirect="show"
        >
            <SelectInput
                source="resource_path"
                label="Resource Path"
                choices={[
                    { id: '/nodes', name: '/nodes' },
                    { id: '/devices', name: '/devices' },
                    { id: '/sources', name: '/sources' },
                    { id: '/flows', name: '/flows' },
                    { id: '/senders', name: '/senders' },
                    { id: '/receivers', name: '/receivers' },
                ]}
                allowEmpty
                emptyText={<EmptyResourcePath />}
                initialValue=""
                parse={value => value}
                // A select shows nothing for "" unless displayEmpty, so the
                // empty row would not appear in the closed field. The label
                // then stays up.
                SelectProps={{ displayEmpty: true }}
                InputLabelProps={{ shrink: true }}
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
