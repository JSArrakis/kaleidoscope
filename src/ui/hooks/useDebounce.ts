import { useMemo, useRef, useEffect } from 'react';
import debounce from 'lodash.debounce';

export default function useDebounce<T>(
  callback: (arg: T) => void,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const debouncedFunction = useMemo(
    () => debounce(callbackRef.current, delay),
    [delay],
  );

  useEffect(() => {
    return () => {
      debouncedFunction.cancel();
    };
  }, [debouncedFunction]);

  return debouncedFunction;
}
