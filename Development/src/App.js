import React from 'react';
import { Admin, Resource } from 'react-admin';

import Dashboard from './pages/Dashboard';
import { NodesList, NodesShow } from './pages/nodes';
import { DevicesList, DevicesShow } from './pages/devices';
import { SourcesList, SourcesShow } from './pages/sources';
import { FlowsList, FlowsShow } from './pages/flows';
import { SendersList, SendersShow } from './pages/senders';
import { ReceiversEdit, ReceiversList, ReceiversShow } from './pages/receivers';
import { EventsList, EventsShow } from './pages/logs';
import { SubscriptionsList, SubscriptionsShow } from './pages/subscriptions';
import { SettingsList, SettingsShow } from './pages/queryapis';
import dataProvider from './dataProvider';

import AnnouncementIcon from '@material-ui/icons/Announcement';
import CallMadeIcon from '@material-ui/icons/CallMade';
import CallReceivedIcon from '@material-ui/icons/CallReceived';
import SettingsCellIcon from '@material-ui/icons/SettingsCell';
import SettingsInputAntennaIcon from '@material-ui/icons/SettingsInputAntenna';
import CompareArrowsIcon from '@material-ui/icons/CompareArrows';
import DvrIcon from '@material-ui/icons/Dvr';
import SwapVertIcon from '@material-ui/icons/SwapVert';
import SettingsIcon from '@material-ui/icons/Settings';
import SettingsAppIcon from '@material-ui/icons/SettingsApplications';

import MyLayout from './MyLayout';

const App = () => (
    <Admin
        appLayout={MyLayout}
        icon={SettingsIcon}
        dataProvider={dataProvider}
        nestedItems={[]}
    >
        <Resource name="Settings" list={Dashboard} icon={SettingsIcon} />
        <Resource
            name="queryapis"
            label="Query APIs"
            options={{ label: 'Query APIs' }}
            list={SettingsList}
            show={SettingsShow}
            icon={SettingsAppIcon}
        />
        <Resource
            name="nodes"
            list={NodesList}
            show={NodesShow}
            icon={DvrIcon}
        />
        <Resource
            name="devices"
            list={DevicesList}
            show={DevicesShow}
            icon={SettingsCellIcon}
        />
        <Resource
            name="sources"
            list={SourcesList}
            show={SourcesShow}
            icon={SettingsInputAntennaIcon}
        />
        <Resource
            name="flows"
            list={FlowsList}
            show={FlowsShow}
            icon={CompareArrowsIcon}
        />
        <Resource
            name="senders"
            list={SendersList}
            show={SendersShow}
            icon={CallMadeIcon}
        />
        <Resource
            name="receivers"
            list={ReceiversList}
            show={ReceiversShow}
            edit={ReceiversEdit}
            icon={CallReceivedIcon}
        />
        <Resource
            name="events"
            list={EventsList}
            show={EventsShow}
            icon={AnnouncementIcon}
            options={{ label: 'Logs' }}
        />
        <Resource
            name="subscriptions"
            list={SubscriptionsList}
            show={SubscriptionsShow}
            icon={SwapVertIcon}
        />
    </Admin>
);

export default App;
