import { TypeGuard } from 'type-core';

import { Push } from '@definitions';
import { operate } from '../../utils/operate';

export type SkipWhile<T> = (value: T, index: number) => boolean;

export function skip<T>(limit: number | SkipWhile<T>): Push.Operation<T> {
  return operate<T>((obs) => {
    let index = -1;
    let stop = false;
    return TypeGuard.isNumber(limit)
      ? {
          next(value: T): void {
            index++;

            if (stop) return obs.next(value);
            if (index < limit) return;

            stop = true;
            return obs.next(value);
          }
        }
      : {
          next(value: T): void {
            index++;

            if (stop) return obs.next(value);
            if (limit(value, index)) return;

            stop = true;
            return obs.next(value);
          }
        };
  });
}
