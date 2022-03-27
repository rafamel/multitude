import { NullaryFn, TypeGuard, UnaryFn } from 'type-core';

import { Push } from '@definitions';
import { Observable } from '../../classes/Observable';
import { transform } from '../../utils/transform';
import { merge } from '../../create/merge';

export interface StartWithOptions {
  policy?: 'always' | 'no-emit';
}

export function startWith<T, U>(
  values: Iterable<U> | NullaryFn<Iterable<U>>,
  options?: StartWithOptions
): Push.Operation<T, T | U> {
  const opts = { policy: options?.policy || 'always' };

  const next = TypeGuard.isIterable(values)
    ? (fn: UnaryFn<U>) => {
        for (const value of Array.from(values)) fn(value);
      }
    : (fn: UnaryFn<U>) => {
        for (const value of Array.from(values())) fn(value);
      };

  return transform((observable) => {
    return opts.policy === 'always'
      ? merge(
          new Observable((obs) => {
            next(obs.next.bind(obs));
            obs.complete();
          }),
          observable
        )
      : new Observable((obs) => {
          let didEmit = false;
          const subscription = observable.subscribe({
            next(value) {
              didEmit = true;
              obs.next(value);
            },
            error(err) {
              didEmit = true;
              next(obs.next.bind(obs));
              obs.error(err);
            },
            complete() {
              didEmit = true;
              next(obs.next.bind(obs));
              obs.complete();
            }
          });

          if (!didEmit) next(obs.next.bind(obs));

          return () => subscription;
        });
  });
}
