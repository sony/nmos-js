import React from 'react';
import { SvgIcon } from '@material-ui/core';

const SvgFlow = props => (
    <SvgIcon viewBox="0 0 480 480" {...props}>
        <defs>
            <path
                d="M140 280V180h100v100H140zm240 0V180h100v100H380zm-270 0l-20-20h30v20h-10zm150 0V180h100v100H260zM70 240l-20-20h70v20H70zm-40-40l-20-20h110v20H30z"
                id="Flow_svg__a"
            />
        </defs>
        <use xlinkHref="#Flow_svg__a" />
    </SvgIcon>
);

export default SvgFlow;
