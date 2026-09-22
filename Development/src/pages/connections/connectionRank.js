// Walk order, lowest first. Higher is a better bet that IS-05 will succeed.
// IncompatibleConstraintSets / CompatibleConstraintSets stay reserved: v1
// does not evaluate caps.constraint_sets.
export const ConnectionRank = {
    IncompatibleDirection: 1,
    IncompatibleTransport: 2,
    IncompatibleFormat: 3,
    IncompatibleMediaType: 4,
    IncompatibleConstraintSets: 5,
    Compatible: 6,
    CompatibleConstraintSets: 7,
};

const CONNECTION_RANK_MESSAGE = {
    [ConnectionRank.IncompatibleDirection]: 'Incompatible direction.',
    [ConnectionRank.IncompatibleTransport]: 'Incompatible transport.',
    [ConnectionRank.IncompatibleFormat]: 'Incompatible format.',
    [ConnectionRank.IncompatibleMediaType]: 'Incompatible media type.',
    [ConnectionRank.IncompatibleConstraintSets]:
        'Incompatible constraint sets.',
};

export const connectionRankMessage = rank => CONNECTION_RANK_MESSAGE[rank];

// <URN-base>[.<subclassification>][/<version>]
export const parseTransportUrn = urn => {
    if (!urn) return null;
    const slash = urn.indexOf('/');
    const head = slash === -1 ? urn : urn.slice(0, slash);
    const colon = head.lastIndexOf(':');
    if (colon === -1) return { base: head, subclass: null };
    const name = head.slice(colon + 1);
    const dot = name.indexOf('.');
    if (dot === -1) return { base: head, subclass: null };
    return {
        base: head.slice(0, colon + 1) + name.slice(0, dot),
        subclass: name.slice(dot + 1),
    };
};

export const transportsCompatible = (senderTransport, receiverTransport) => {
    const sender = parseTransportUrn(senderTransport);
    const receiver = parseTransportUrn(receiverTransport);
    if (!sender || !receiver) return false;
    if (sender.base !== receiver.base) return false;
    return (
        sender.subclass === null ||
        receiver.subclass === null ||
        sender.subclass === receiver.subclass
    );
};

const mediaTypesInclude = (mediaTypes, mediaType) => {
    if (mediaTypes == null) return true;
    if (!mediaType) return false;
    if (Array.isArray(mediaTypes)) {
        return mediaTypes.length === 0 ? false : mediaTypes.includes(mediaType);
    }
    return mediaTypes === mediaType;
};

// flow is the IS-04 Flow for sender.flow_id, or null when that lookup has
// finished and found nothing. Until the batch returns, the caller should not
// treat a format-unchecked pair as Compatible.
export const rankConnection = (sender, receiver, flow) => {
    if (!transportsCompatible(sender.transport, receiver.transport)) {
        return ConnectionRank.IncompatibleTransport;
    }
    const format = flow && flow.format;
    if (!format || format !== receiver.format) {
        return ConnectionRank.IncompatibleFormat;
    }
    if (
        !mediaTypesInclude(
            receiver.caps && receiver.caps.media_types,
            flow.media_type
        )
    ) {
        return ConnectionRank.IncompatibleMediaType;
    }
    return ConnectionRank.Compatible;
};
