import React from 'react';
import {
    BooleanField,
    FunctionField,
    ListButton,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    TextField,
    Toolbar,
    TopToolbar,
    useRecordContext,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import ConnectButton from './ConnectButton';
import ItemArrayField from '../../components/ItemArrayField';
import RawButton from '../../components/RawButton';

const QueryAPIsTitle = ({ record }) => {
    return <span>Query API{record ? `: ${record.name}` : ''}</span>;
};

const QueryAPIsShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<QueryAPIsTitle />}>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

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
                title={<QueryAPIsTitle />}
                actions={<QueryAPIsShowActions />}
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
