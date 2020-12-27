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
import get from 'lodash/get';
import set from 'lodash/set';
import ClearIcon from '@material-ui/icons/Clear';
import { useTheme } from '@material-ui/styles';
import ConnectionEditActions from '../../components/ConnectionEditActions';
import ConnectionEditToolbar from '../../components/ConnectionEditToolbar';
import ResourceTitle from '../../components/ResourceTitle';
import ReceiverTransportParamsCardsGrid from './ReceiverTransportParams';

const ReceiversEdit = props => {
    const theme = useTheme();
    const tabBackgroundColor =
        theme.palette.type === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[900];
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
            <TextInput
                label="Transport File"
                source="$staged.transport_file.data"
                fullWidth
                multiline
                resettable
            />
        </SimpleForm>
    </Edit>
);

export default ReceiversEdit;
