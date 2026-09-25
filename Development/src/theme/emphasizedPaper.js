import { emphasize } from '@material-ui/core/styles/colorManipulator';

// the card one hover-step from paper, the way Material-UI emphasizes a
// surface either way round, so a heading or a tab strip reads as the paper
// behind it
const emphasizedPaper = theme =>
    emphasize(
        theme.palette.background.paper,
        theme.palette.action.hoverOpacity
    );

export default emphasizedPaper;
