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
