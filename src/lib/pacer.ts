import { useDebouncedValue as useDebouncedValueBase } from '@tanstack/react-pacer/debouncer';
import { useThrottledCallback as useThrottledCallbackBase } from '@tanstack/react-pacer/throttler';

type AnyFunction = (...args: never[]) => unknown;

export function useDebouncedValue<T>(value: T, wait = 300): T {
  const [debounced] = useDebouncedValueBase(value, { wait });
  return debounced;
}

export function useThrottledCallback<TFn extends AnyFunction>(
  fn: TFn,
  wait = 100,
): (...args: Parameters<TFn>) => void {
  return useThrottledCallbackBase(fn, { wait });
}
