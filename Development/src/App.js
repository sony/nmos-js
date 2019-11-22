import React from 'react';
import { Admin, Resource } from 'react-admin';
import { useTheme } from '@material-ui/styles';

import Dashboard from './pages/settings';
import { ReceiversEdit, ReceiversList, ReceiversShow } from './pages/receivers';
import { SendersEdit, SendersList, SendersShow } from './pages/senders';
import { NodesList, NodesShow } from './pages/nodes';
import { DevicesList, DevicesShow } from './pages/devices';
import { SourcesList, SourcesShow } from './pages/sources';
import { FlowsList, FlowsShow } from './pages/flows';
import { EventsList, EventsShow } from './pages/logs';
import { SubscriptionsList, SubscriptionsShow } from './pages/subscriptions';
import { QueryAPIsList, QueryAPIsShow } from './pages/queryapis';
import dataProvider from './dataProvider';
import Layout from './LayoutComponent';

const App = () => (
    <Admin layout={Layout} dataProvider={dataProvider} theme={useTheme()}>
        <Resource name="Settings" list={Dashboard} />
        <Resource
            name="queryapis"
            label="Query APIs"
            options={{ label: 'Query APIs' }}
            list={QueryAPIsList}
            show={QueryAPIsShow}
        />
        <Resource name="nodes" list={NodesList} show={NodesShow} />
        <Resource name="devices" list={DevicesList} show={DevicesShow} />
        <Resource name="sources" list={SourcesList} show={SourcesShow} />
        <Resource name="flows" list={FlowsList} show={FlowsShow} />
        <Resource
            name="senders"
            list={SendersList}
            show={SendersShow}
            edit={SendersEdit}
        />
        <Resource
            name="receivers"
            list={ReceiversList}
            show={ReceiversShow}
            edit={ReceiversEdit}
        />
        <Resource
            name="subscriptions"
            list={SubscriptionsList}
            show={SubscriptionsShow}
        />
        <Resource name="events" list={EventsList} show={EventsShow} />
    </Admin>
);

export default App;
