import { NullaryFn } from 'type-core';
import { Push } from '@definitions';
import { transform } from '../../utils/transform';

/**
 * Returns a *Promise* that resolves after an
 * Observable completes with its last emitted value.
 */
export function resolve<T, U>(
  fallback: NullaryFn<PromiseLike<U> | U>
): Push.Transformation<T, Promise<T | U>> {
  return transform((observable) => {
    let value: null | [T] = null;

    return new Promise<T | U>((resolve, reject) => {
      observable.subscribe({
        next(val) {
          value = [val];
        },
        error(reason) {
          reject(reason);
        },
        complete() {
          if (value) {
            resolve(value[0]);
          } else {
            const fn = async (): Promise<U> => fallback();
            fn().then(resolve, reject);
          }
        }
      });
    });
  });
}
