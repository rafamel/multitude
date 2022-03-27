import { NullaryFn } from 'type-core';
import { Push } from '@definitions';
import { Util } from '@helpers';
import { transform } from '../../utils/transform';

/**
 * Returns the last synchronous value of an Observable.
 * When an error is emitted, `extract` will synchronously throw.
 */
export function extract<T, U>(
  fallback: NullaryFn<U>
): Push.Transformation<T, T | U> {
  return transform((observable) => {
    let value: null | [T] = null;

    const subscription = observable.subscribe({
      next(val) {
        value = [val];
      },
      error(reason) {
        Util.throws(reason);
      }
    });

    subscription.unsubscribe();

    return value ? value[0] : fallback();
  });
}
