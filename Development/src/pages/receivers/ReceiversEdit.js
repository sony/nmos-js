import React, { Fragment } from 'react';
import { Link, Route } from 'react-router-dom';
import { Paper, Tab, Tabs } from '@material-ui/core';
import {
    BooleanInput,
    Edit,
    FormDataConsumer,
    SelectInput,
    SimpleForm,
    TextInput,
} from 'react-admin';
import ClearIcon from '@material-ui/icons/Clear';
import get from 'lodash/get';
import set from 'lodash/set';
import { useField } from 'react-final-form';
import { useTheme } from '@material-ui/styles';
import ConnectionEditActions from '../../components/ConnectionEditActions';
import ConnectionEditToolbar from '../../components/ConnectionEditToolbar';
import TransportParamInput from '../../components/TransportParamInput';
import {
    transportFileType,
    transportOmitsTransportFile,
} from '../../components/ParameterRegisters';
import ResourceTitle from '../../components/ResourceTitle';
import emphasizedPaper from '../../theme/emphasizedPaper';
import ReceiverTransportParamsCardsGrid from './ReceiverTransportParams';

const typedValue = event =>
    event && event.target ? event.target.value : event;

const TransportFileInputs = ({ transport }) => {
    const {
        input: { value: dataValue },
    } = useField('$staged.transport_file.data', { allowNull: true });
    const {
        input: { value: typeValue, onChange: setType },
    } = useField('$staged.transport_file.type', { allowNull: true });

    // A file and its type are both set or both null. The default type
    // appears when data goes from empty to set and type is still empty.
    const onDataChange = event => {
        const next = typedValue(event);
        if (next == null || next === '') {
            setType(null);
            return;
        }
        if (
            (dataValue == null || dataValue === '') &&
            (typeValue == null || typeValue === '')
        ) {
            const fallback = transportFileType(transport);
            if (fallback) setType(fallback);
        }
    };

    return (
        <>
            <TextInput
                label="Transport File Type"
                source="$staged.transport_file.type"
                helperText={false}
                format={value => (value == null ? '' : value)}
                parse={value => (value === '' ? null : value)}
            />
            <TextInput
                label="Transport File Data"
                source="$staged.transport_file.data"
                fullWidth
                multiline
                resettable
                helperText={false}
                format={value => (value == null ? '' : value)}
                parse={value => (value === '' ? null : value)}
                onChange={onDataChange}
            />
        </>
    );
};

const ReceiversEdit = props => {
    const theme = useTheme();
    const tabBackgroundColor = emphasizedPaper(theme);
    return (
        <>
            <div style={{ display: 'flex' }}>
                <Paper
                    style={{
                        alignSelf: 'flex-end',
                        background: tabBackgroundColor,
                    }}
                >
                    <Tabs
                        value={props.location.pathname}
                        indicatorColor="primary"
                        textColor="primary"
                    >
                        <Tab
                            label="Summary"
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/`}
                        />
                        <Tab
                            label="Active"
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/active`}
                        />
                        <Tab
                            label="Staged"
                            value={`${props.match.url}`}
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/staged`}
                        />
                        <Tab
                            label="Connect"
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/connect`}
                        />
                    </Tabs>
                </Paper>
                <span style={{ flexGrow: 1 }} />
                <ConnectionEditActions {...props} />
            </div>
            <Route
                exact
                path={`${props.basePath}/${props.id}/`}
                render={() => <EditStagedTab {...props} />}
            />
        </>
    );
};

const EditStagedTab = props => (
    <Edit
        {...props}
        undoable={false}
        title={<ResourceTitle />}
        actions={<Fragment />}
    >
        <SimpleForm
            toolbar={<ConnectionEditToolbar />}
            redirect={`/receivers/${props.id}/show/staged`}
        >
            {/* TransportParamInput only so null is indicated the same way as on the transport cards. */}
            <TransportParamInput
                label="Sender ID"
                source="$staged.sender_id"
                nullable
            />
            <BooleanInput
                label="Master Enable"
                source="$staged.master_enable"
                helperText={false}
            />
            <SelectInput
                label="Activation Mode"
                source="$staged.activation.mode"
                choices={[
                    { id: null, name: <ClearIcon /> },
                    {
                        id: 'activate_immediate',
                        name: 'activate_immediate',
                    },
                    {
                        id: 'activate_scheduled_relative',
                        name: 'activate_scheduled_relative',
                    },
                    {
                        id: 'activate_scheduled_absolute',
                        name: 'activate_scheduled_absolute',
                    },
                ]}
                translateChoice={false}
            />
            <FormDataConsumer>
                {({ formData, ...rest }) => {
                    switch (get(formData, '$staged.activation.mode')) {
                        case 'activate_scheduled_relative':
                            return (
                                <TextInput
                                    label="Requested Time"
                                    source="$staged.activation.requested_time"
                                    {...rest}
                                    helperText={false}
                                />
                            );
                        case 'activate_scheduled_absolute':
                            return (
                                <TextInput
                                    label="Requested Time"
                                    source="$staged.activation.requested_time"
                                    {...rest}
                                    helperText={false}
                                />
                            );
                        default:
                            set(
                                formData,
                                '$staged.activation.requested_time',
                                null
                            );
                            return null;
                    }
                }}
            </FormDataConsumer>
            <ReceiverTransportParamsCardsGrid />
            <FormDataConsumer>
                {({ formData }) => {
                    const type = get(formData, '$transporttype');
                    return (
                        !transportOmitsTransportFile(type) && (
                            <TransportFileInputs transport={type} />
                        )
                    );
                }}
            </FormDataConsumer>
        </SimpleForm>
    </Edit>
);

export default ReceiversEdit;
