import { Push } from '@definitions';
import { Observable } from '../../classes/Observable';
import { transform } from '../../utils/transform';
import { intercept } from '../../utils/intercept';
import { from } from '../../creators/from';
import { TypeGuard } from 'type-core';

export interface CatchesOptions<T, U> {
  /**
   * Errors will only be catched once by default,
   * but `selector` can be made to be called recursively
   * by setting a higher than 1 limit.
   */
  limit?: number;
  /**
   * See `CatchesSelector`.
   */
  selector?: CatchesSelector<T, U>;
}

/**
 * Should return an observable for `catches`
 * to continue the stream with.
 */
export type CatchesSelector<T, U> = (
  err: Error,
  observable: Push.Observable<T>
) => Push.Convertible<U>;

/**
 * Catches an error in the original observable
 * and continues the stream by asynchronously subscribing
 * to the Observable returned by `selector`.
 * When no `selector` is provided, the original observable
 * will be resubscribed.
 */
export function catches<T, U = T>(
  selector?: CatchesSelector<T, U> | CatchesOptions<T, U>
): Push.Operation<T, T | U> {
  const options = TypeGuard.isFunction(selector)
    ? { selector: selector }
    : selector || {};

  const fn = (
    limit: number,
    err: Error,
    observable: Push.Observable
  ): Push.Convertible => {
    const obs = options.selector
      ? options.selector(err, observable)
      : observable;
    return trunk(limit, fn)(obs);
  };

  const limit = TypeGuard.isNumber(options.limit) ? options.limit : 1;
  return trunk(limit < 0 ? Infinity : limit, fn);
}

function trunk<T, U = T>(
  limit: number,
  selector: (
    limit: number,
    err: Error,
    observable: Push.Observable<T>
  ) => Push.Convertible<U>
): Push.Operation<T, T | U> {
  return transform((observable) => {
    return new Observable<T | U>((obs) => {
      let subs: Push.Subscription | null = null;
      const unsubscribe = (): void => {
        if (!subs) return;
        subs.unsubscribe();
        subs = null;
      };

      intercept(observable, obs, {
        start(subscription) {
          subs = subscription;
        },
        error(reason: Error) {
          if (limit < 1) {
            obs.error(reason);
          } else {
            unsubscribe();

            Promise.resolve().then(() => {
              from(selector(limit - 1, reason, observable)).subscribe({
                start(subscription) {
                  subs = subscription;
                },
                next: obs.next.bind(obs),
                error: obs.error.bind(obs),
                complete: obs.complete.bind(obs)
              });
            });
          }
        }
      });

      return unsubscribe;
    });
  });
}
