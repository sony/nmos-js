import { useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash/debounce';

export const useDebouncedCallback = (callback, delay) =>
    useMemo(() => debounce(callback, delay), [callback, delay]);

const useDebounce = (value, delay) => {
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
        }
    }, [debouncedCallback, value]);
    return currentValue;
};

export default useDebounce;
