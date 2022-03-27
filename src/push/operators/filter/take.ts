import { TypeGuard } from 'type-core';

import { Push } from '@definitions';
import { operate } from '../../utils/operate';

export type TakeWhile<T> = (value: T, index: number) => boolean;

export function take<T>(limit: number | TakeWhile<T>): Push.Operation<T> {
  return operate<T>((obs) => {
    let index = -1;
    return TypeGuard.isNumber(limit)
      ? {
          next(value: T): void {
            index++;
            if (index < limit) obs.next(value);
            return index + 1 >= limit ? obs.complete() : undefined;
          }
        }
      : {
          next(value: T): void {
            index++;
            return limit(value, index) ? obs.next(value) : obs.complete();
          }
        };
  });
}
