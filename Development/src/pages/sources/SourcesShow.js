import React from 'react';
import {
    ArrayField,
    ListButton,
    ReferenceArrayField,
    ReferenceField,
    ReferenceManyField,
    ShowContextProvider,
    ShowView,
    SimpleShowLayout,
    SingleFieldList,
    TextField,
    TopToolbar,
    useRecordContext,
    useShowController,
} from 'react-admin';
import get from 'lodash/get';
import LinkChipField from '../../components/LinkChipField';
import ObjectField from '../../components/ObjectField';
import { FORMATS, ParameterField } from '../../components/ParameterRegisters';
import RateField from '../../components/RateField';
import RawButton from '../../components/RawButton';
import ResourceTitle from '../../components/ResourceTitle';
import SanitizedDivider from '../../components/SanitizedDivider';
import TAIField from '../../components/TAIField';
import UnsortableDatagrid from '../../components/UnsortableDatagrid';
import { queryVersion } from '../../settings';

const SourcesShowActions = ({ basePath, data, resource }) => (
    <TopToolbar title={<ResourceTitle />}>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

export const SourcesShow = props => {
    const controllerProps = useShowController(props);
    return (
        <ShowContextProvider value={controllerProps}>
            <SourcesShowView {...props} />
        </ShowContextProvider>
    );
};

const SourcesShowView = props => {
    const { record } = useRecordContext();
    return (
        <ShowView
            {...props}
            title={<ResourceTitle />}
            actions={<SourcesShowActions />}
        >
            <SimpleShowLayout>
                <TextField label="ID" source="id" />
                <TAIField source="version" />
                <TextField source="label" />
                <TextField source="description" />
                <ObjectField source="tags" />
                <SanitizedDivider />
                {queryVersion() >= 'v1.1' && (
                    <RateField label="Grain Rate" source="grain_rate" />
                )}
                {queryVersion() >= 'v1.1' && (
                    <TextField label="Clock Name" source="clock_name" />
                )}
                <ParameterField source="format" register={FORMATS} />
                {queryVersion() >= 'v1.1' &&
                    get(record, 'format') === 'urn:x-nmos:format:audio' && (
                        <ArrayField source="channels">
                            <UnsortableDatagrid>
                                <TextField source="label" />
                                <TextField source="symbol" />
                            </UnsortableDatagrid>
                        </ArrayField>
                    )}
                {queryVersion() >= 'v1.3' &&
                    get(record, 'format') === 'urn:x-nmos:format:data' && (
                        <TextField label="Event Type" source="event_type" />
                    )}
                <SanitizedDivider />
                <ReferenceArrayField
                    allowEmpty={true}
                    clickable="true"
                    label="Parents"
                    source="parents"
                    reference="sources"
                    link="show"
                >
                    <SingleFieldList linkType="show">
                        <LinkChipField />
                    </SingleFieldList>
                </ReferenceArrayField>
                <ReferenceField
                    label="Device"
                    source="device_id"
                    reference="devices"
                    link="show"
                >
                    <LinkChipField />
                </ReferenceField>
                <SanitizedDivider />
                <ReferenceManyField
                    label="Flows"
                    reference="flows"
                    target="source_id"
                >
                    <SingleFieldList linkType="show">
                        <LinkChipField />
                    </SingleFieldList>
                </ReferenceManyField>
            </SimpleShowLayout>
        </ShowView>
    );
};

export default SourcesShow;
