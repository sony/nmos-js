import React from 'react';
import {
    BooleanField,
    FunctionField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    TextField,
    Toolbar,
    useRecordContext,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import ItemArrayField from '../../components/ItemArrayField';
import ResourceShowActions from '../../components/ResourceShowActions';
import ResourceTitle from '../../components/ResourceTitle';
import ConnectButton from './ConnectButton';

export const QueryAPIsShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <QueryAPIsShowView {...props} />
        </ShowContextProvider>
    );
};

const QueryAPIsShowView = props => {
    const { record } = useRecordContext();
    return (
        <>
            <ShowView
                {...props}
                title={<ResourceTitle resourceName="Query API" />}
                actions={<ResourceShowActions />}
            >
                <SimpleShowLayout>
                    <TextField source="name" />
                    <hr />
                    <TextField label="Host Target" source="host_target" />
                    <ItemArrayField source="addresses" />
                    <TextField source="port" />
                    <hr />
                    <TextField label="API Protocol" source="txt.api_proto" />
                    <TextField label="API Versions" source="txt.api_ver" />
                    <FunctionField
                        label="API Authorization"
                        source="txt.api_auth"
                        render={(record, source) => (
                            <BooleanField
                                record={{ _: get(record, source) === 'true' }}
                                source="_"
                            />
                        )}
                    />
                    <TextField label="Priority" source="txt.pri" />
                </SimpleShowLayout>
            </ShowView>
            <Toolbar style={{ marginTop: 0 }}>
                <>
                    <ConnectButton record={record} />
                </>
            </Toolbar>
        </>
    );
};

export default QueryAPIsShow;
