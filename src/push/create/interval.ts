import { TypeGuard } from 'type-core';

import { Push } from '@definitions';
import { Observable } from '../classes/Observable';

export interface IntervalOptions {
  every: number;
  cancel?: AbortSignal;
}

export function interval(
  every: number | IntervalOptions
): Push.Observable<number> {
  const opts = TypeGuard.isNumber(every) ? { every } : every || {};

  return new Observable((obs) => {
    let index = -1;

    const interval = setInterval(() => {
      index++;
      obs.next(index);
    }, Math.max(0, opts.every || 0));

    function cancel(): void {
      clearInterval(interval);
      obs.complete();
    }

    if (opts.cancel) {
      if (opts.cancel.aborted) cancel();
      else opts.cancel.addEventListener('abort', cancel);
    }
    return () => {
      clearInterval(interval);
      if (opts.cancel) opts.cancel.removeEventListener('abort', cancel);
    };
  });
}
