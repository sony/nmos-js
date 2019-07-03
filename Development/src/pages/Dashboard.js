import React from 'react';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import sealion from '../sea-lion.png';
import Typography from '@material-ui/core/Typography';
import CardHeader from '@material-ui/core/CardHeader';

import Settings from '../settings';

export default () => (
    <div>
        <Card>
            <Typography variant="display3" component="h2" align="center">
                Welcome to the nmos-js Client
            </Typography>
            <CardContent align="center">
                <img
                    id="sealion"
                    src={sealion}
                    style={{
                        border: '1px solid lightgray',
                        borderRadius: '50%',
                        padding: '4px',
                    }}
                    alt="sea-lion logo"
                />
            </CardContent>
        </Card>
        <Card align="center" title="Change Query">
            <CardHeader title="Settings" />
            <CardContent>
                <Settings />
            </CardContent>
        </Card>
    </div>
);
