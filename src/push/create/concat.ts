import { Push } from '@definitions';
import { Observable } from '../classes/Observable';
import { from } from './from';

export function concat<T, U extends Push.Convertible>(
  observable: Push.Convertible<T>,
  ...observables: U[]
): Push.Observable<T | (U extends Push.Convertible<infer V> ? V : never)> {
  return new Observable((obs) => {
    const arr = [observable, ...observables].map((x) => from(x));

    let subscription: Push.Subscription | null = null;

    function resubscribe(): void {
      if (!arr.length) return obs.complete();

      const observable = arr.shift();
      if (!observable) return resubscribe();

      observable.subscribe({
        start(subs) {
          subscription = subs;
        },
        next(value) {
          obs.next(value);
        },
        error(err) {
          obs.error(err);
        },
        complete() {
          resubscribe();
        }
      });
    }

    resubscribe();
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  });
}
