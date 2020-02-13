import React from 'react';
import { Button } from 'react-admin';
import JsonIcon from '../icons/JsonIcon';
import { resourceUrl } from '../dataProvider';

const RawButton = ({ record, resource }) => {
    const url = resourceUrl(resource, `/${record.id}`);
    return (
        <Button
            label={'Raw'}
            onClick={() => window.open(url, '_blank')}
            rel="noopener noreferrer"
            title={`View raw\n${url}`}
        >
            <JsonIcon />
        </Button>
    );
};

export default RawButton;
