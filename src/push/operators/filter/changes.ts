import { Push } from '@definitions';
import { operate } from '../../utils/operate';
import { BinaryFn, TypeGuard } from 'type-core';
import { compare as strategy } from 'equal-strategies';

export type ChangesStrategy = 'strict' | 'shallow' | 'deep';

const $empty = Symbol('empty');

export function changes<T>(
  compare?: ChangesStrategy | BinaryFn<[T, T], boolean>
): Push.Operation<T> {
  const fn =
    !compare || TypeGuard.isString(compare)
      ? strategy.bind(null, compare || 'strict')
      : compare;

  return operate<T>((obs) => {
    let last: any = $empty;
    return {
      next(value: T): void {
        if (last === $empty || !fn(value, last)) {
          last = value;
          return obs.next(value);
        }
      }
    };
  });
}
