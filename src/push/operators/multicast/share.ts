import { Push } from '@definitions';
import { transform } from '../../utils/transform';
import { Observable } from '../../classes/Observable';

/**
 * 'on-demand': Default policy. Subscribes and re-subscribes to the original Observable once the resulting one has open subscriptions, so long as the original Observable hasn't errored or completed on previous subscriptions. Unsubscribes from the original Observable once the resulting Observable has no active subscriptions.
 * 'keep-open': Keeps the parent subscription open even if it has no current subscriptions.
 * 'keep-closed': Permanently unsubscribes from the original Observable once the resulting one has no active subscriptions. Subsequent subscriptions will error or complete immediately with the same signal as the original Observable if it finalized before being unsubscribed, or otherwise error.
 */
export type SharePolicy = 'on-demand' | 'keep-open' | 'keep-closed';

export interface ShareOptions {
  replay?: number;
}

/**
 * Creates an Observable that multicasts the original Observable.
 * The original Observable won't be subscribed until there is at least
 * one subscriber.
 */
export function share<T>(
  policy: SharePolicy,
  options?: ShareOptions
): Push.Transformation<T, Push.Observable<T>> {
  return transform((observable) => {
    let values: T[] = [];
    let subscription: null | Push.Subscription = null;
    let termination: null | { error: any; complete: boolean } = null;
    const observers: Set<Push.SubscriptionObserver> = new Set();

    return new Observable<T>((obs) => {
      if (termination) {
        return termination.complete
          ? obs.complete()
          : obs.error(termination.error);
      }

      observers.add(obs);
      for (const value of values) obs.next(value);

      if (!subscription) {
        observable.subscribe({
          start(subs) {
            subscription = subs;
          },
          next(value) {
            if (options?.replay && options.replay > 0) {
              values.push(value);
              if (options.replay < values.length) values.shift();
            }
            for (const obs of observers) obs.next(value);
          },
          error(err) {
            termination = { error: err, complete: false };
            for (const obs of observers) obs.error(err);
          },
          complete() {
            termination = { error: null, complete: true };
            for (const obs of observers) obs.complete();
          }
        });
      }

      return () => {
        observers.delete(obs);

        if (observers.size > 0) return;

        values = [];
        if (policy === 'keep-open') return;
        if (policy === 'keep-closed') {
          if (!termination) {
            termination = {
              error: new Error('Shared observable was already closed'),
              complete: false
            };
          }
          subscription?.unsubscribe();
        } else {
          subscription?.unsubscribe();
          subscription = null;
        }
      };
    });
  });
}
