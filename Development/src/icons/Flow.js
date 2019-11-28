import React from 'react';
import { SvgIcon } from '@material-ui/core';

const SvgFlow = props => (
    <SvgIcon viewBox="0 0 480 480" {...props}>
        <defs>
            <path
                d="M300 300V180h60v120h-60zm80 0V180h60v120h-60zm-160 0V180h60v120h-60zm-80 0V180h60v120h-60zm-40-60l-20-20h40v20h-20zm-40-40l-20-20h80v20H60z"
                id="flow_svg__a"
            />
        </defs>
        <use xlinkHref="#flow_svg__a" />
    </SvgIcon>
);

export default SvgFlow;
