import {render, screen} from '@testing-library/react';
import NCAController from './NCAController';
import {MSGTYPES} from '../global/IS12CommandTemplates';
import {NcDatatypeType, NcMethodStatus} from '../global/Types';

// Minimal IS-12 device: a root block with a ClassManager and a DeviceManager
const memberDescriptors = [
    {oid: 3, classId: [1, 3, 2], role: 'ClassManager', description: 'Class manager', userLabel: '', owner: 1},
    {oid: 4, classId: [1, 3, 1], role: 'DeviceManager', description: 'Device manager', userLabel: 'Test device', owner: 1},
];

const classDescriptor = {
    description: 'Manager',
    events: [],
    methods: [],
    properties: [
        {id: {level: 1, index: 6}, name: 'userLabel', typeName: 'NcString', isReadOnly: false, isSequence: false, description: 'User label'},
    ],
};

const datatypeDescriptors = [{name: 'NcString', type: NcDatatypeType.NcPrimitive, description: '', constraints: null}];

// property values by '<oid>.<level>.<index>'
const propertyValues = {'3.3.2': datatypeDescriptors, '4.1.6': 'Test device'};

// Answers each command from the client straight away, as a device would
class FakeDeviceSocket {
    constructor() {
        setTimeout(() => this.onopen());
    }

    send(data) {
        const message = JSON.parse(data);
        const reply = message.messageType === MSGTYPES.Subscription
            ? {messageType: MSGTYPES.SubscriptionResponse, subscriptions: message.subscriptions}
            : {
                messageType: MSGTYPES.CommandResponse,
                responses: message.commands.map(({handle, oid, methodId, arguments: methodArguments}) => {
                    const method = `${methodId.level}.${methodId.index}`;
                    const value = {
                        '1.1': propertyValues[`${oid}.${methodArguments?.id?.level}.${methodArguments?.id?.index}`],
                        '2.1': memberDescriptors,
                        '3.1': classDescriptor,
                    }[method];
                    return {handle, result: {status: NcMethodStatus.OK, value}};
                }),
            };
        setTimeout(() => this.onmessage({data: JSON.stringify(reply)}));
    }

    close() {}
}

window.WebSocket = FakeDeviceSocket;

test('renders the device model fetched from the device', async () => {
    render(<NCAController devices={['ws://127.0.0.1:7002/x-nmos/ncp/v1.0']} />);
    await screen.findByText('DeviceManager');
});
