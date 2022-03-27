import { TypeGuard } from 'type-core';
import { compare as isEqual } from 'equal-strategies';

import { Push } from '@definitions';
import { operate } from '../../utils/operate';

export type CompareComparator<T> = CompareStrategy | ComparePredicate<T>;
export type CompareStrategy = 'strict' | 'shallow' | 'deep';
export type ComparePredicate<T> = (a: T, b: T) => boolean;

export function compare<T>(
  comparator: CompareComparator<T>
): Push.Operation<T> {
  const fn = TypeGuard.isString(comparator)
    ? isEqual.bind(null, comparator)
    : comparator;

  const empty = Symbol('empty');
  return operate<T>((obs) => {
    let last: any = empty;
    return {
      next(value: T): void {
        if (last === empty || !fn(value, last)) {
          last = value;
          return obs.next(value);
        }
      }
    };
  });
}
