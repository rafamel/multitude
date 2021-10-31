import { Push } from '@definitions';
import { operate } from '../../utils/operate';
import { intercept } from '../../utils/intercept';

export function mergeMap<T, U>(
  projection: (value: T, index: number) => Push.Convertible<U>
): Push.Operation<T, U> {
  return operate<T, U>((obs) => {
    let index = 0;
    let parentComplete = false;
    let completeSubscriptions = 0;
    const subscriptions: Push.Subscription[] = [];

    function unsubscribe(): void {
      for (const subscription of subscriptions) {
        subscription.unsubscribe();
      }
    }

    return {
      next(value: T): void {
        if (obs.closed) return;

        intercept(projection(value, index++), {
          to: obs,
          between: {
            start(subscription) {
              subscriptions.push(subscription);
            },
            error(error) {
              obs.error(error);
              unsubscribe();
            },
            complete() {
              completeSubscriptions++;

              if (!parentComplete) return;
              if (completeSubscriptions >= subscriptions.length) {
                obs.complete();
                unsubscribe();
              }
            }
          }
        });
      },
      complete() {
        parentComplete = true;
        if (completeSubscriptions >= subscriptions.length) {
          obs.complete();
        }
      },
      teardown() {
        if (obs.closed || !parentComplete) unsubscribe();
      }
    };
  });
}
