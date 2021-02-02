import React from 'react';
import { Card, CardContent, Typography } from '@material-ui/core';
import { get } from 'lodash';
import { Title } from 'react-admin';
import CONFIG from '../config.json';
import AppLogo from '../components/AppLogo';

export const About = () => (
    <div style={{ paddingTop: '24px' }}>
        <Card>
            <Title title={get(CONFIG, 'title', 'nmos-js')} />
            <CardContent align="center">
                <Typography variant="h2">
                    {get(CONFIG, 'about', 'An NMOS Client')}
                </Typography>
                <AppLogo />
                <RepoLinks />
            </CardContent>
        </Card>
    </div>
);

export const RepoLinks = () => (
    <div>
        <Typography color="textSecondary" variant="body1" component="span">
            Built on open-source projects
        </Typography>{' '}
        <Link to="https://github.com/sony/nmos-js">
            <Typography color="textSecondary" variant="body1" component="span">
                nmos-js
            </Typography>
        </Link>{' '}
        <Typography color="textSecondary" variant="body1" component="span">
            and
        </Typography>{' '}
        <Link to="https://github.com/sony/nmos-cpp">
            <Typography color="textSecondary" variant="body1" component="span">
                nmos-cpp
            </Typography>
        </Link>
    </div>
);

const Link = ({ to, children }) => (
    // eslint-disable-next-line react/jsx-no-target-blank
    <a
        href={to}
        target="_blank"
        rel="noopener referrer"
        style={{ textDecoration: 'none' }}
    >
        {React.cloneElement(children, {
            style: { textDecoration: 'underline' },
        })}
    </a>
);

export default About;
