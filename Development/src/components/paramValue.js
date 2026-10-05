// Text in the input. auto and null are blank; the words beside the field
// say which. A draft replaces that until blur. "" is blank too.
export const shownParamText = (value, auto, draft = null) => {
    if (draft !== null) return draft;
    if ((auto && value === 'auto') || value === null || value === undefined) {
        return '';
    }
    return String(value);
};

// A finite JSON number. "1.0" and "1.0e4" are integers. "0x2a", "05",
// Infinity, and any JSON value that is not a number are not.
const jsonNumber = text => {
    try {
        const parsed = JSON.parse(text);
        return typeof parsed === 'number' && Number.isFinite(parsed)
            ? parsed
            : undefined;
    } catch (e) {
        return undefined;
    }
};

// What a parameter field submits for text the user typed.
// A blank string field is "". Null comes from the null word, or from
// clearing a number. Typing auto sets auto only when the field allows it.
export const commitParamText = (kind, nullable, auto, text, previous) => {
    const trimmed = text.trim();
    if (trimmed === '') {
        if (kind === 'string') return '';
        if (nullable) return null;
        return previous;
    }
    if (auto && trimmed === 'auto') return 'auto';
    if (kind === 'string') return text;
    if (kind !== 'integer' && kind !== 'number') return previous;
    const parsed = jsonNumber(trimmed);
    if (parsed === undefined) return previous;
    if (kind === 'integer' && !Number.isInteger(parsed)) return previous;
    return parsed;
};

export const convertParam = (value, to) => {
    if (value === 'auto' || value === null || value === '') return value;
    if (to === 'string') {
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return String(value);
    }
    if (to === 'boolean') {
        if (value === true || value === false) return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return null;
    }
    if (to === 'integer' || to === 'number') {
        const parsed =
            typeof value === 'number' && Number.isFinite(value)
                ? value
                : typeof value === 'string'
                  ? jsonNumber(value)
                  : undefined;
        if (parsed === undefined) return null;
        if (to === 'integer' && !Number.isInteger(parsed)) return null;
        return parsed;
    }
    return null;
};
