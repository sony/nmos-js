import { NcDatatypeType } from '../../global/Types';
import { STATUS_MONITOR_REGISTRY, STATUS_MONITOR_METHOD_NAMES, STATUS_MONITOR_METHOD_LABELS, STATUS_MONITOR_SETTINGS, STATUS_MONITOR_SETTINGS_ORDER } from './statusMonitorRegistry';

const NC_STATUS_MONITOR_CLASS_PREFIX = [1, 2, 2];

export function isStatusMonitor(classId) {
    if (!classId || classId.length < NC_STATUS_MONITOR_CLASS_PREFIX.length) {
        return false;
    }

    return NC_STATUS_MONITOR_CLASS_PREFIX.every(
        (segment, index) => classId[index] === segment
    );
}

export function subtreeContainsStatusMonitor(row) {
    if (isStatusMonitor(row.classId)) {
        return true;
    }

    return row.childNodes.some((child) => subtreeContainsStatusMonitor(child));
}

export function elementIdFromKey(propKey) {
    const [level, index] = propKey.split('.');
    return {
        level: Number(level),
        index: Number(index),
    };
}

export function getMonitorDisplayName(row) {
    return row.userLabel && row.userLabel !== 'none' ? row.userLabel : row.name;
}

export function getOverallStatusPresentation(viewModel) {
    const label = viewModel.overallStatus ? getEnumLabel(viewModel.overallStatus) : 'Unknown';

    return {
        label,
        color: getTrafficLightColor(label),
        message: formatStatusMessage(viewModel.overallStatusMessage),
    };
}

export function formatMethodLabel(methodName, description) {
    return STATUS_MONITOR_METHOD_LABELS[methodName] || description || methodName;
}

export function getTransitionCounterValue(counterHolder) {
    if (counterHolder?.value === null || counterHolder?.value === undefined) {
        return null;
    }

    return Number(counterHolder.value);
}

export function getStatusMonitorNodes(row) {
    if (isStatusMonitor(row.classId)) {
        return [row];
    }

    const monitors = [];

    row.childNodes.forEach((child) => {
        monitors.push(...getStatusMonitorNodes(child));
    });

    return monitors;
}

function blockOnlyContainsStatusMonitors(row) {
    if (isStatusMonitor(row.classId) || !subtreeContainsStatusMonitor(row)) {
        return false;
    }

    const hasProperties = row.valueHolderMap && Object.keys(row.valueHolderMap).length > 0;
    const hasMethods = row.methods && Object.keys(row.methods).length > 0;
    const hasOtherChildren = row.childNodes.some((child) => {
        return !isStatusMonitor(child.classId) && !blockOnlyContainsStatusMonitors(child);
    });

    return !hasProperties && !hasMethods && !hasOtherChildren;
}

export function getNonStatusMonitorChildNodes(row) {
    return row.childNodes.filter((child) => {
        return !isStatusMonitor(child.classId) && !blockOnlyContainsStatusMonitors(child);
    });
}

export function getEnumLabel(valueHolder) {
    if (!valueHolder || valueHolder.value === null || valueHolder.value === undefined) {
        return 'Unknown';
    }

    const { value, datatype } = valueHolder;

    if (!datatype || datatype.type !== NcDatatypeType.NcEnum || !datatype.enum) {
        return String(value);
    }

    const match = datatype.enum.find((enumItem) => enumItem.value === value);
    return match ? match.name : String(value);
}

export function getTrafficLightColor(enumLabel) {
    switch (enumLabel) {
        case 'Healthy':
        case 'AllUp':
            return 'green';
        case 'PartiallyHealthy':
        case 'SomeDown':
            return 'amber';
        case 'Unhealthy':
        case 'AllDown':
            return 'red';
        case 'Inactive':
        case 'NotUsed':
            return 'neutral';
        default:
            return 'unknown';
    }
}

export function formatDomainLabel(domainKey) {
    const withSpaces = domainKey.replace(/([A-Z])/g, ' $1').trim();
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

export function formatStatusMessage(messageHolder) {
    const messageValue = messageHolder?.value;

    if (messageValue === null || messageValue === undefined || messageValue === '') {
        return null;
    }

    return String(messageValue);
}

function indexByPropertyName(valueHolderMap) {
    const byName = {};

    Object.entries(valueHolderMap).forEach(([propKey, valueHolder]) => {
        if (valueHolder?.name) {
            byName[valueHolder.name] = { propKey, valueHolder };
        }
    });

    return byName;
}

function sortDomains(domains, classId) {
    const classKey = classId.join('.');
    const domainOrder = STATUS_MONITOR_REGISTRY[classKey]?.domainOrder;

    if (!domainOrder) {
        return [...domains].sort((left, right) => left.key.localeCompare(right.key));
    }

    return [...domains].sort((left, right) => {
        const leftIndex = domainOrder.indexOf(left.key);
        const rightIndex = domainOrder.indexOf(right.key);

        if (leftIndex === -1 && rightIndex === -1) {
            return left.key.localeCompare(right.key);
        }
        if (leftIndex === -1) {
            return 1;
        }
        if (rightIndex === -1) {
            return -1;
        }
        return leftIndex - rightIndex;
    });
}

export function buildStatusMonitorViewModel(row) {
    const valueHolderMap = row.valueHolderMap || {};
    const byName = indexByPropertyName(valueHolderMap);

    const overallStatus = byName.overallStatus?.valueHolder;
    const overallStatusMessage = byName.overallStatusMessage?.valueHolder;

    const domains = [];

    Object.values(byName).forEach(({ valueHolder }) => {
        const propertyName = valueHolder.name;

        if (!propertyName?.endsWith('Status') || propertyName === 'overallStatus') {
            return;
        }

        if (valueHolder.datatype?.type !== NcDatatypeType.NcEnum) {
            return;
        }

        const domainKey = propertyName.slice(0, -'Status'.length);
        const messageHolder = byName[`${domainKey}StatusMessage`]?.valueHolder;
        const counterHolder = byName[`${domainKey}StatusTransitionCounter`]?.valueHolder;

        domains.push({
            key: domainKey,
            label: formatDomainLabel(domainKey),
            statusHolder: valueHolder,
            messageHolder,
            counterHolder,
        });
    });

    return {
        overallStatus,
        overallStatusMessage,
        domains: sortDomains(domains, row.classId),
        settingsProperties: getSettingsProperties(valueHolderMap),
    };
}

export function getSettingsProperties(valueHolderMap) {
    const propertiesByName = {};

    Object.entries(valueHolderMap).forEach(([propKey, valueHolder]) => {
        if (valueHolder?.name && STATUS_MONITOR_SETTINGS[valueHolder.name]) {
            propertiesByName[valueHolder.name] = {
                propKey,
                valueHolder,
                label: STATUS_MONITOR_SETTINGS[valueHolder.name],
            };
        }
    });

    return STATUS_MONITOR_SETTINGS_ORDER
        .filter((propertyName) => propertiesByName[propertyName])
        .map((propertyName) => propertiesByName[propertyName]);
}

export function getStatusMonitorMethods(row) {
    if (!row.methods) {
        return [];
    }

    const allowedMethodNames = new Set(STATUS_MONITOR_METHOD_NAMES);

    return Object.entries(row.methods)
        .map(([methodKey, method]) => ({
            methodKey,
            descriptor: method.Descriptor,
            methodId: elementIdFromKey(methodKey),
        }))
        .filter(({ descriptor }) => allowedMethodNames.has(descriptor.name))
        .sort((left, right) => {
            const leftIndex = STATUS_MONITOR_METHOD_NAMES.indexOf(left.descriptor.name);
            const rightIndex = STATUS_MONITOR_METHOD_NAMES.indexOf(right.descriptor.name);
            return leftIndex - rightIndex;
        });
}

export function parseCounterMethodResult(value) {
    if (!value) {
        return [];
    }

    const counterList = Array.isArray(value) ? value : [value];

    return counterList.map((counter, index) => ({
        name: counter?.name ?? counter?.Name ?? `Counter ${index + 1}`,
        value: counter?.value ?? counter?.Value ?? 0,
        description: counter?.description ?? counter?.Description,
    }));
}
