import { forwardRef } from 'react';
import { Typography, withStyles } from '@material-ui/core';

export const InlineTypography = forwardRef(({ style, ...props }, ref) => (
    <Typography style={{ display: 'inline', ...style }} {...props} ref={ref} />
));

export const hintStyle = theme => ({
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: theme.palette.type === 'dark' ? '#696969' : '#c8c8c8',
});

const HintTypography = withStyles(theme => ({
    root: hintStyle(theme),
}))(InlineTypography);

export default HintTypography;
