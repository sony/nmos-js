import React from 'react';
import { SvgIcon } from '@material-ui/core';

const SvgDevice = props => (
    <SvgIcon viewBox="0 0 480 480" {...props}>
        <defs>
            <path
                d="M400 320V180h60v140h-60zm-360 0V180h340v140H40zm100-20h60v-20h-60v20zm-80 0h60v-20H60v20z"
                id="Device_svg__a"
            />
        </defs>
        <use xlinkHref="#Device_svg__a" />
    </SvgIcon>
);

export default SvgDevice;
