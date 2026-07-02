import PropTypes from 'prop-types';
import { useContext, useMemo, useState } from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Typography,
} from '@mui/material';
import { DataProviderContext } from '../NCAController';
import { NcMethodStatus } from '../../global/Types';
import CollapsibleMonitorSection from './CollapsibleMonitorSection';
import {
    formatMethodLabel,
    getStatusMonitorMethods,
    parseCounterMethodResult,
} from './statusMonitorUtils';

function CounterResults({ counters }) {
    if (!counters || counters.length === 0) {
        return (
            <Typography variant="caption" color="grey.500">
                No counters reported
            </Typography>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {counters.map((counter) => (
                <Box key={counter.name} sx={{ minWidth: 80 }}>
                    <Typography variant="caption" color="grey.400" sx={{ display: 'block' }}>
                        {counter.name}
                    </Typography>
                    <Typography variant="body2" color="white">
                        {counter.value}
                    </Typography>
                    {counter.description ? (
                        <Typography variant="caption" color="grey.500" sx={{ display: 'block' }}>
                            {counter.description}
                        </Typography>
                    ) : null}
                </Box>
            ))}
        </Box>
    );
}

CounterResults.propTypes = {
    counters: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        description: PropTypes.string,
    })).isRequired,
};

function MethodResultDisplay({ methodName, result }) {
    if (!result) {
        return null;
    }

    if (!result.success) {
        return (
            <Typography variant="caption" color="error.light" sx={{ display: 'block' }}>
                {NcMethodStatus[result.status] || 'Error'}: {String(result.errorMessage ?? 'Method failed')}
            </Typography>
        );
    }

    if (methodName === 'ResetCountersAndMessages') {
        return (
            <Typography variant="caption" color="success.light" sx={{ display: 'block' }}>
                Counters and status messages reset
            </Typography>
        );
    }

    return <CounterResults counters={parseCounterMethodResult(result.value)} />;
}

MethodResultDisplay.propTypes = {
    methodName: PropTypes.string.isRequired,
    result: PropTypes.shape({
        success: PropTypes.bool.isRequired,
        status: PropTypes.number,
        value: PropTypes.any,
        errorMessage: PropTypes.any,
    }),
};

export default function StatusMonitorMethodsPanel({ row }) {
    const DataProvider = useContext(DataProviderContext);
    const [methodResults, setMethodResults] = useState({});
    const [loadingMethodName, setLoadingMethodName] = useState(null);
    const availableMethods = useMemo(() => getStatusMonitorMethods(row), [row]);

    if (availableMethods.length === 0) {
        return null;
    }

    const invokeStatusMonitorMethod = async (methodName, methodId) => {
        setLoadingMethodName(methodName);

        try {
            const result = await DataProvider.invokeMethod(row.oid, methodId, { displayAlert: false });

            setMethodResults((previousResults) => (
                methodName === 'ResetCountersAndMessages' && result?.success
                    ? { ResetCountersAndMessages: result }
                    : { ...previousResults, [methodName]: result }
            ));
        } finally {
            setLoadingMethodName(null);
        }
    };

    return (
        <CollapsibleMonitorSection title="Methods" ariaLabel="expand methods">
            <Box sx={{ pt: 1, pb: 0.5 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {availableMethods.map(({ methodKey, descriptor, methodId }) => (
                        <Button
                            key={methodKey}
                            variant="outlined"
                            size="small"
                            disabled={loadingMethodName !== null}
                            onClick={() => invokeStatusMonitorMethod(descriptor.name, methodId)}
                            sx={{ textTransform: 'none' }}
                        >
                            {loadingMethodName === descriptor.name ? (
                                <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />
                            ) : null}
                            {formatMethodLabel(descriptor.name, descriptor.description)}
                        </Button>
                    ))}
                </Box>

                {availableMethods.map(({ descriptor }) => {
                    const result = methodResults[descriptor.name];
                    if (!result) {
                        return null;
                    }

                    return (
                        <Box
                            key={descriptor.name}
                            sx={{
                                mt: 1,
                                px: 1,
                                py: 0.75,
                                borderRadius: 1,
                                bgcolor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                        >
                            <Typography variant="caption" color="grey.400" sx={{ display: 'block', mb: 0.5 }}>
                                {formatMethodLabel(descriptor.name, descriptor.description)}
                            </Typography>
                            <MethodResultDisplay methodName={descriptor.name} result={result} />
                        </Box>
                    );
                })}
            </Box>
        </CollapsibleMonitorSection>
    );
}

StatusMonitorMethodsPanel.propTypes = {
    row: PropTypes.object.isRequired,
};
