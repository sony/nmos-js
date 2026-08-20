import React, { Fragment, useEffect, useMemo, useState } from 'react';
import {
    Button,
    MenuItem,
    Paper,
    Tab,
    Tabs,
    TextField,
} from '@material-ui/core';
import { useTheme } from '@material-ui/styles';
import { cloneDeep, get, isEqual, setWith } from 'lodash';
import {
    Loading,
    ShowButton,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    TopToolbar,
    useNotify,
    useRecordContext,
    useRefresh,
    useShowController,
} from 'react-admin';
import { Link, useHistory } from 'react-router-dom';
import ResourceTitle from '../../components/ResourceTitle';
import { ActivateImmediateIcon, ActivateScheduledIcon } from '../../icons';
import dataProvider from '../../dataProvider';
import ChannelMappingMatrix from './ChannelMappingMatrix';

const activationModes = [
    'activate_immediate',
    'activate_scheduled_relative',
    'activate_scheduled_absolute',
];

const DevicesEditActions = ({ basePath, id }) => {
    const theme = useTheme();
    return (
        <TopToolbar
            style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-start',
                paddingTop: theme.spacing(4),
                paddingBottom: 0,
                paddingRight: theme.spacing(2),
                minHeight: theme.spacing(5),
            }}
        >
            <ShowButton
                label="Show"
                component={Link}
                to={`${basePath}/${id}/show/active_map`}
            />
        </TopToolbar>
    );
};

const DevicesEditView = props => {
    const { record } = useRecordContext();
    const activeMap = get(record, '$active.map');
    const [draftMap, setDraftMap] = useState();
    const [activationMode, setActivationMode] = useState('activate_immediate');
    const [requestedTime, setRequestedTime] = useState('');
    const [activating, setActivating] = useState(false);
    const history = useHistory();
    const notify = useNotify();
    const refresh = useRefresh();
    const theme = useTheme();
    const scheduled = activationMode !== 'activate_immediate';

    // Seed the draft once, so that a refresh of the Device record while still
    // on Edit does not discard it. A later Edit visit remounts and seeds from
    // the map fetched after the last activation.
    useEffect(() => {
        if (activeMap && !draftMap) {
            setDraftMap(cloneDeep(activeMap));
        }
    }, [activeMap, draftMap]);

    useEffect(
        () => () => {
            window.localStorage.removeItem('Channel Mapping Expanded');
        },
        []
    );

    const changed = useMemo(
        () => !isEqual(activeMap, draftMap),
        [activeMap, draftMap]
    );

    if (!record || !draftMap) return <Loading />;

    const handleMap = (
        inputId,
        outputId,
        inputChannelIndex,
        outputChannelIndex
    ) => {
        setDraftMap(current => {
            const next = cloneDeep(current);
            setWith(
                next,
                [outputId, outputChannelIndex],
                inputId === null
                    ? { input: null, channel_index: null }
                    : {
                          input: inputId,
                          channel_index: Number(inputChannelIndex),
                      },
                Object
            );
            return next;
        });
    };

    const activate = async () => {
        setActivating(true);
        try {
            await dataProvider('UPDATE', props.resource, {
                id: props.id,
                data: {
                    ...record,
                    $active: { map: draftMap },
                    $activation: {
                        mode: activationMode,
                        requested_time: scheduled ? requestedTime : null,
                    },
                },
                previousData: record,
            });
            notify(
                scheduled
                    ? 'Channel Mapping activation scheduled'
                    : 'Channel Mapping activated',
                'info'
            );
            refresh();
            // returning to Show unmounts this view, so leave `activating` set
            history.push(
                scheduled
                    ? `${props.basePath}/${props.id}/show/activations`
                    : `${props.basePath}/${props.id}/show/active_map`
            );
        } catch (error) {
            notify(error.toString(), 'warning');
            setActivating(false);
        }
    };

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
                            label="Active Map"
                            value={props.match.url}
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/active_map`}
                        />
                        <Tab
                            label="Activations"
                            component={Link}
                            to={`${props.basePath}/${props.id}/show/activations`}
                        />
                    </Tabs>
                </Paper>
                <span style={{ flexGrow: 1 }} />
                <DevicesEditActions {...props} />
            </div>
            <ShowView
                {...props}
                title={<ResourceTitle />}
                actions={<Fragment />}
            >
                <SimpleShowLayout>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}
                    >
                        <TextField
                            label="Activation Mode"
                            margin="dense"
                            onChange={event => {
                                setActivationMode(event.target.value);
                                if (
                                    event.target.value === 'activate_immediate'
                                ) {
                                    setRequestedTime('');
                                }
                            }}
                            select
                            style={{
                                marginRight: theme.spacing(2),
                                minWidth: 240,
                            }}
                            value={activationMode}
                            variant="filled"
                        >
                            {activationModes.map(mode => (
                                <MenuItem key={mode} value={mode}>
                                    {mode}
                                </MenuItem>
                            ))}
                        </TextField>
                        {scheduled && (
                            <TextField
                                label="Requested Time"
                                margin="dense"
                                onChange={event =>
                                    setRequestedTime(event.target.value)
                                }
                                onFocus={event => event.target.select()}
                                style={{ marginRight: theme.spacing(2) }}
                                value={requestedTime}
                                variant="filled"
                            />
                        )}
                        <Button
                            color="primary"
                            disabled={
                                !changed ||
                                activating ||
                                (scheduled && !requestedTime)
                            }
                            onClick={activate}
                            startIcon={
                                scheduled ? (
                                    <ActivateScheduledIcon />
                                ) : (
                                    <ActivateImmediateIcon />
                                )
                            }
                            variant="contained"
                        >
                            {scheduled ? 'Activate Scheduled' : 'Activate'}
                        </Button>
                    </div>
                    <ChannelMappingMatrix
                        record={record}
                        isShow={false}
                        mapping={draftMap}
                        handleMap={handleMap}
                    />
                </SimpleShowLayout>
            </ShowView>
        </>
    );
};

const DevicesEdit = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <DevicesEditView {...props} />
        </ShowContextProvider>
    );
};

export default DevicesEdit;
