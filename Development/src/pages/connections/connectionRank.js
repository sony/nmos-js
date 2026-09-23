import { parseTransportUrn } from '../../transportUrn';

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
    if (Array.isArray(mediaTypes)) {
        return mediaTypes.length === 0 ? false : mediaTypes.includes(mediaType);
    }
    return mediaTypes === mediaType;
};

// flow is the IS-04 Flow for sender.flow_id, or null while that lookup is
// outstanding or if it found nothing. Only the records themselves make a pair
// Incompatible; what is missing from them is not evidence of a mismatch.
export const rankConnection = (sender, receiver, flow) => {
    if (
        sender.transport &&
        receiver.transport &&
        !transportsCompatible(sender.transport, receiver.transport)
    ) {
        return ConnectionRank.IncompatibleTransport;
    }
    const format = flow && flow.format;
    if (format && receiver.format && format !== receiver.format) {
        return ConnectionRank.IncompatibleFormat;
    }
    const mediaType = flow && flow.media_type;
    if (
        mediaType &&
        !mediaTypesInclude(
            receiver.caps && receiver.caps.media_types,
            mediaType
        )
    ) {
        return ConnectionRank.IncompatibleMediaType;
    }
    return ConnectionRank.Compatible;
};
