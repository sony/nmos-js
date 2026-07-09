/**
 * Known BCP-008 status monitor class identifiers and domain ordering.
 */

export const STATUS_MONITOR_REGISTRY = {
    '1.2.2.1': {
        kind: 'receiver',
        domainOrder: ['link', 'connection', 'externalSynchronization', 'stream'],
    },
    '1.2.2.2': {
        kind: 'sender',
        domainOrder: ['link', 'transmission', 'externalSynchronization', 'essence'],
    },
};

export const STATUS_MONITOR_METHOD_NAMES = [
    'GetLostPacketCounters',
    'GetLatePacketCounters',
    'ResetCountersAndMessages',
];

export const STATUS_MONITOR_METHOD_LABELS = {
    GetLostPacketCounters: 'Lost packet counters',
    GetLatePacketCounters: 'Late packet counters',
    ResetCountersAndMessages: 'Reset counters & messages',
};

export const STATUS_MONITOR_SETTINGS = {
    userLabel: 'User label',
    statusReportingDelay: 'Status reporting delay (s)',
    autoResetCountersAndMessages: 'Auto reset counters & messages',
    synchronizationSourceId: 'Synchronization source ID',
};

export const STATUS_MONITOR_SETTINGS_ORDER = [
    'userLabel',
    'statusReportingDelay',
    'autoResetCountersAndMessages',
    'synchronizationSourceId',
];
