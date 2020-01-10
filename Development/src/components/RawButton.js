import React from 'react';
import { Button } from 'react-admin';
import JsonIcon from '../icons/JsonIcon';
import { resourceUrl } from '../dataProvider';

const RawButton = ({ record, resource }) => {
    return (
        <Button
            label={'Raw'}
            onClick={() =>
                window.open(resourceUrl(resource, `/${record.id}`), '_blank')
            }
            rel="noopener noreferrer"
            title={'View raw'}
        >
            <JsonIcon />
        </Button>
    );
};

export default RawButton;
