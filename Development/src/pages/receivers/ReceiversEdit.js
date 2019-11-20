import React from 'react';
import { Link, Route } from 'react-router-dom';
import { AppBar, Tab, Tabs } from '@material-ui/core';
import {
    BooleanInput,
    Edit,
    FormDataConsumer,
    LongTextInput,
    SaveButton,
    SelectInput,
    SimpleForm,
    TextInput,
    Toolbar,
} from 'react-admin';
import get from 'lodash/get';
import set from 'lodash/set';
import ClearIcon from '@material-ui/icons/Clear';
import ConnectionEditActions from '../../components/ConnectionEditActions';
import ReceiverTransportParamsCardsGrid from './ReceiverTransportParams';

const ReceiversTitle = ({ record }) => (
    <span>
        Receiver:{' '}
        {record
            ? record.label
                ? `${record.label}`
                : `${record.id}`
            : 'Unknown'}
    </span>
);

const PostEditToolbar = props => (
    <Toolbar {...props}>
        <SaveButton label="Stage" />
    </Toolbar>
);

const ReceiversEdit = props => {
    return (
        <div>
            <AppBar position="static" color="default">
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
            </AppBar>
            <Route
                exact
                path={`${props.basePath}/${props.id}/`}
                render={() => <EditStagedTab {...props} />}
            />
        </div>
    );
};

const EditStagedTab = props => (
    <Edit
        {...props}
        undoable={false}
        title={<ReceiversTitle />}
        actions={<ConnectionEditActions id={props.id} />}
    >
        <SimpleForm
            toolbar={<PostEditToolbar />}
            redirect={`/receivers/${props.id}/show/staged`}
        >
            <TextInput label="Sender ID" source="$staged.sender_id" />
            <BooleanInput
                label="Master Enable"
                source="$staged.master_enable"
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
                                />
                            );
                        case 'activate_scheduled_absolute':
                            return (
                                <TextInput
                                    label="Requested Time"
                                    source="$staged.activation.requested_time"
                                    {...rest}
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
            <LongTextInput
                label="Transport File"
                source="$staged.transport_file.data"
                resettable
            />
        </SimpleForm>
    </Edit>
);

export default ReceiversEdit;
