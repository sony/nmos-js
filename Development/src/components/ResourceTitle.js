import React from 'react';
import { useResourceContext } from 'react-admin';
import inflection from 'inflection';

const ResourceTitle = ({ resourceName, recordLabel, record }) => {
    const resource = useResourceContext();
    if (!resourceName) {
        resourceName = inflection.transform(resource, [
            'singularize',
            'titleize',
        ]);
    }
    if (!recordLabel) {
        recordLabel = record.label || record.name || record.id;
    }
    return (
        <span>
            {resourceName}
            {recordLabel ? ': ' + recordLabel : ''}
        </span>
    );
};

export default ResourceTitle;
