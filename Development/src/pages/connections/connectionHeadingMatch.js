import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

// Essence fields heading match may write. Other chips (label, description,
// id, tags, device_id, active) stay on that panel.
export const SENDER_ESSENCE_KEYS = [
    'transport',
    '$flow.format',
    '$flow.media_type',
    '$flow.event_type',
    '$constraint_sets',
    '$constraint_sets_active',
];

export const RECEIVER_ESSENCE_KEYS = [
    'transport',
    'format',
    'caps.media_types',
    'caps.event_types',
];

// Same RQL alternative as the Receiver Connect tab: a classified transport
// also matches its URN-base with no subclass.
export const connectTabTransportQuery = (transport, usingRql) => {
    if (!transport) return transport;
    if (!usingRql) return transport;
    const dot = transport.indexOf('.');
    const slash = transport.indexOf('/');
    if (dot !== -1 && (slash === -1 || dot < slash)) {
        const base = transport.substring(0, dot);
        return transport + '|' + base + '$';
    }
    return transport;
};

const omitEmpty = essence => {
    const next = {};
    for (const [key, value] of Object.entries(essence)) {
        if (value !== undefined && value !== null && value !== '') {
            next[key] = value;
        }
    }
    return next;
};

// the essence comes from one of the functions below, which have already left
// out what the receiver or sender doesn't have, and null is a value here:
// it's what the Constraint Sets filter sets
export const applyHeadingMatch = (current = {}, essence, keys) => {
    const next = { ...current };
    for (const key of keys) {
        delete next[key];
    }
    return { ...next, ...essence };
};

// Sender heading → receiver panel. Needs the sender's Flow.
export const receiverEssenceFromSender = (
    sender,
    flow,
    { usingRql, version }
) => {
    if (!flow) return null;
    const essence = {
        format: flow.format,
        transport: connectTabTransportQuery(sender.transport, usingRql),
    };
    if (usingRql && version >= 'v1.1') {
        essence['caps.media_types'] = flow.media_type;
    }
    if (usingRql && version >= 'v1.3') {
        essence['caps.event_types'] = flow.event_type;
    }
    return omitEmpty(essence);
};

// Receiver heading → sender panel, the Connect tab's baseFilter.
export const senderEssenceFromReceiver = (receiver, { usingRql, version }) => {
    const essence = {
        transport: connectTabTransportQuery(receiver.transport, usingRql),
        '$flow.format': receiver.format,
    };
    if (usingRql && version >= 'v1.1') {
        essence['$flow.media_type'] = get(receiver, 'caps.media_types');
    }
    if (usingRql && version >= 'v1.3') {
        essence['$flow.event_type'] = get(receiver, 'caps.event_types');
    }
    const matched = omitEmpty(essence);
    // the receiver's own constraint sets, which only RQL can match; the flag
    // the Connect tab sets to apply them is the receiver id here, the same
    // sort of API value the other chips show
    const constraintSets = get(receiver, 'caps.constraint_sets');
    if (usingRql && !isEmpty(constraintSets)) {
        matched['$constraint_sets'] = constraintSets;
        matched['$constraint_sets_active'] = receiver.id;
    }
    return matched;
};
