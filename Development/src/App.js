import React from 'react';
import { Admin, Layout, Resource } from 'react-admin';
import { useTheme } from '@material-ui/styles';
import { get } from 'lodash';
import CONFIG from './config.json';
import {
    AuthContextProvider,
    SettingsContextProvider,
    useAuthContext,
} from './settings';
import AdminMenu from './pages/menu';
import AppBar from './pages/appbar';
import About from './pages/about';
import { NodesList, NodesShow } from './pages/nodes';
import { DevicesList, DevicesShow } from './pages/devices';
import { SourcesList, SourcesShow } from './pages/sources';
import { FlowsList, FlowsShow } from './pages/flows';
import { ReceiversEdit, ReceiversList, ReceiversShow } from './pages/receivers';
import { SendersEdit, SendersList, SendersShow } from './pages/senders';
import { LogsList, LogsShow } from './pages/logs';
import {
    SubscriptionsCreate,
    SubscriptionsList,
    SubscriptionsShow,
} from './pages/subscriptions';
import { QueryAPIsList, QueryAPIsShow } from './pages/queryapis';
import Settings from './pages/settings';
import dataProvider from './dataProvider';
import authProvider from './authProvider';

const AdminAppBar = props => {
    const [useAuth] = useAuthContext();
    return <AppBar {...props} userMenu={useAuth} />;
};

const AdminLayout = props => (
    <Layout {...props} menu={AdminMenu} appBar={AdminAppBar} />
);

const AppAdmin = () => {
    const [useAuth] = useAuthContext();

    //if Authentication switch 'off' ensure user is logged out
    if (!useAuth) {
        authProvider.getIdentity().then(identity => {
            if (identity && identity.id) {
                authProvider.logout();
            }
        });
    }
    return (
        <Admin
            title={get(CONFIG, 'title', 'nmos-js')}
            dashboard={About}
            layout={AdminLayout}
            dataProvider={dataProvider}
            theme={useTheme()}
            authProvider={useAuth ? authProvider : null}
        >
            <Resource name="Settings" list={Settings} />
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
                create={SubscriptionsCreate}
            />
            <Resource name="logs" list={LogsList} show={LogsShow} />
            <Resource
                name="queryapis"
                options={{ label: 'Query APIs' }}
                list={QueryAPIsList}
                show={QueryAPIsShow}
            />
        </Admin>
    );
};

export const App = () => (
    <SettingsContextProvider>
        <AuthContextProvider>
            <AppAdmin />
        </AuthContextProvider>
    </SettingsContextProvider>
);

export default App;
