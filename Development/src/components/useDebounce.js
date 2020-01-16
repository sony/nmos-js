import { useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash/debounce';

export function useDebouncedCallback(callback, delay) {
    return useCallback(debounce(callback, delay), [callback, delay]);
}

function useDebounce(value, delay) {
    const previousValue = useRef(value);
    const [currentValue, setCurrentValue] = useState(value);
    const debouncedCallback = useDebouncedCallback(
        value => setCurrentValue(value),
        delay
    );
    useEffect(() => {
        if (value !== previousValue.current) {
            debouncedCallback(value);
            previousValue.current = value;
            return debouncedCallback.cancel;
        }
    }, [debouncedCallback, value]);
    return currentValue;
}

export default useDebounce;
