import React from 'react';
import { SvgIcon } from '@material-ui/core';

const SvgStage = props => (
    <SvgIcon viewBox="0 0 480 480" {...props}>
        <defs>
            <path
                d="M300 280v100H180V280h-60l120-120v70-70l120 120h-60zm80-59.98h-59.98L240 140l-40 40h-60v20h40l-20.01 20.01L40 220l.01-140 340 .02-.01 140zm80-.02h-60l.01-140h60L460 220zm-340-20v-20H60v20h60z"
                id="Stage_svg__a"
            />
        </defs>
        <use xlinkHref="#Stage_svg__a" />
    </SvgIcon>
);

export default SvgStage;
