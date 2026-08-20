import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Button, Paper, Tab, Tabs } from '@material-ui/core';
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
import { ActivateImmediateIcon } from '../../icons';
import dataProvider from '../../dataProvider';
import ChannelMappingMatrix from './ChannelMappingMatrix';

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
    const [activating, setActivating] = useState(false);
    const history = useHistory();
    const notify = useNotify();
    const refresh = useRefresh();
    const theme = useTheme();

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
                data: { ...record, $active: { map: draftMap } },
                previousData: record,
            });
            notify('Channel Mapping activated', 'info');
            refresh();
            // returning to Show unmounts this view, so leave `activating` set
            history.push(`${props.basePath}/${props.id}/show/active_map`);
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
                    <div style={{ display: 'flex' }}>
                        <Button
                            color="primary"
                            disabled={!changed || activating}
                            onClick={activate}
                            startIcon={<ActivateImmediateIcon />}
                            variant="contained"
                        >
                            Activate
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
