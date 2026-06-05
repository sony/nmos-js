import { get } from 'lodash';

const mxlUuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isMxlTransport = transportType => {
    if (typeof transportType !== 'string') return false;
    return /^urn:x-nmos:transport:mxl([./]|$)/.test(
        transportType.split('/')[0]
    );
};

const isConcreteMxlId = value =>
    typeof value === 'string' && value !== 'auto' && mxlUuidPattern.test(value);

const isUnresolvedMxlValue = value =>
    value === null || value === undefined || value === '' || value === 'auto';

const getSingleConstraintUuid = (constraints, leg, param) => {
    const enumValues = get(constraints, [leg, param, 'enum']);
    if (!Array.isArray(enumValues)) return;
    const uuids = enumValues.filter(isConcreteMxlId);
    if (uuids.length === 1) return uuids[0];
};

const isAllowedByReceiverConstraints = (
    receiverConstraints,
    receiverLeg,
    param,
    value
) => {
    if (
        Array.isArray(receiverConstraints) &&
        receiverConstraints.length === 0
    ) {
        return false;
    }
    const enumValues = get(receiverConstraints, [receiverLeg, param, 'enum']);
    if (!Array.isArray(enumValues) || enumValues.length === 0) return true;
    return enumValues.includes(value);
};

export const resolveMxlDomainId = (
    senderValue,
    senderConstraints,
    receiverConstraints,
    senderLeg,
    receiverLeg
) => {
    if (isConcreteMxlId(senderValue)) return senderValue;
    if (isUnresolvedMxlValue(senderValue)) {
        const fromConstraints = getSingleConstraintUuid(
            senderConstraints,
            senderLeg,
            'mxl_domain_id'
        );
        if (
            fromConstraints &&
            isAllowedByReceiverConstraints(
                receiverConstraints,
                receiverLeg,
                'mxl_domain_id',
                fromConstraints
            )
        ) {
            return fromConstraints;
        }
        return 'auto';
    }
    return senderValue;
};

export const resolveMxlFlowId = (
    senderValue,
    senderConstraints,
    receiverConstraints,
    senderLeg,
    receiverLeg,
    isSender = false
) => {
    if (isConcreteMxlId(senderValue)) return senderValue;
    if (isUnresolvedMxlValue(senderValue)) {
        const fromConstraints = getSingleConstraintUuid(
            senderConstraints,
            senderLeg,
            'mxl_flow_id'
        );
        if (
            fromConstraints &&
            isAllowedByReceiverConstraints(
                receiverConstraints,
                receiverLeg,
                'mxl_flow_id',
                fromConstraints
            )
        ) {
            return fromConstraints;
        }
        // Receivers must not use "auto" for mxl_flow_id (BCP-007-03)
        return isSender ? 'auto' : null;
    }
    return senderValue;
};
