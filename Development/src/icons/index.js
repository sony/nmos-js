import ActivateImmediateIcon from './ActivateImmediate';
import ActivateScheduledIcon from './ActivateScheduled';
import CancelScheduledActivationIcon from './CancelScheduledActivation';
import ConnectRegistryIcon from './ConnectRegistry';
import ContentCopyIcon from './ContentCopy';
import DeviceIcon from './Device';
import FlowIcon from './Flow';
import JsonIcon from './JsonIcon';
import NodeIcon from './Node';
import ReceiverIcon from './Receiver';
import RegistryIcon from './Registry';
import RegistryLogsIcon from './RegistryLogs';
import SenderIcon from './Sender';
import SourceIcon from './Source';
import StageIcon from './Stage';
import SubscriptionIcon from './Subscription';

// To optimise the SVG files and convert to the correct syntax:
// svgo --enable=removeDimensions --disable=removeViewBox --pretty -f .\src\ -o .\optimised\
// npx @svgr/cli -d ./out/ --template ./svgr-template.js ./optimised/

export {
    ActivateImmediateIcon,
    ActivateScheduledIcon,
    CancelScheduledActivationIcon,
    ConnectRegistryIcon,
    ContentCopyIcon,
    DeviceIcon,
    FlowIcon,
    JsonIcon,
    NodeIcon,
    ReceiverIcon,
    RegistryIcon,
    RegistryLogsIcon,
    SenderIcon,
    SourceIcon,
    StageIcon,
    SubscriptionIcon,
};
