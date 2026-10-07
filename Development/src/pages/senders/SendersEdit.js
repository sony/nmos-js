import React, { Fragment } from 'react';
import { Link, Route } from 'react-router-dom';
import { Paper, Tab, Tabs } from '@material-ui/core';
import {
    BooleanInput,
    Edit,
    FormDataConsumer,
    SimpleForm,
    TextInput,
} from 'react-admin';
import get from 'lodash/get';
import set from 'lodash/set';
import { useTheme } from '@material-ui/styles';
import ConnectionEditActions from '../../components/ConnectionEditActions';
import ConnectionEditToolbar from '../../components/ConnectionEditToolbar';
import ResourceTitle from '../../components/ResourceTitle';
import emphasizedPaper from '../../theme/emphasizedPaper';
import { ActivationModeInput } from '../../components/ActivationMode';
import TransportParamInput from '../../components/TransportParamInput';
import SenderTransportParamsCardsGrid from './SenderTransportParams';

const SendersEdit = props => {
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
                            label="Transportfile"
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/transportfile`}
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
            redirect={`/senders/${props.id}/show/staged`}
        >
            {/* TransportParamInput only so null is indicated the same way as on the transport cards. */}
            <TransportParamInput
                label="Receiver ID"
                source="$staged.receiver_id"
                nullable
            />
            <BooleanInput
                label="Master Enable"
                source="$staged.master_enable"
                helperText={false}
            />
            <ActivationModeInput
                label="Activation Mode"
                source="$staged.activation.mode"
                helperText={false}
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
            <SenderTransportParamsCardsGrid />
        </SimpleForm>
    </Edit>
);

export default SendersEdit;
