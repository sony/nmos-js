import React from 'react';
import { ListButton, TopToolbar } from 'react-admin';
import RawButton from './RawButton';

const ResourceShowActions = ({ basePath, data, resource }) => (
    <TopToolbar>
        {data ? <RawButton record={data} resource={resource} /> : null}
        <ListButton title={'Return to ' + basePath} basePath={basePath} />
    </TopToolbar>
);

export default ResourceShowActions;
