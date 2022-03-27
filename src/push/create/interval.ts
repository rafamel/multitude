import { Push } from '@definitions';
import { Observable } from '../classes/Observable';

export interface IntervalOptions {
  cancel?: AbortSignal;
}

export function interval(
  every: number,
  options?: IntervalOptions
): Push.Observable<number> {
  return new Observable((obs) => {
    let index = -1;

    const interval = setInterval(() => {
      index++;
      obs.next(index);
    }, Math.max(0, every || 0));

    function cancel(): void {
      clearInterval(interval);
      obs.complete();
    }

    if (options?.cancel) {
      if (options.cancel.aborted) cancel();
      else options.cancel.addEventListener('abort', cancel);
    }
    return () => {
      clearInterval(interval);
      if (options?.cancel) options.cancel.removeEventListener('abort', cancel);
    };
  });
}
