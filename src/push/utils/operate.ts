import { Push } from '@definitions';
import { Observable } from '../classes/Observable';
import { transform } from './transform';
import { intercept } from './intercept';

export interface OperationObserver<T> extends Push.Observer<T> {
  teardown?: () => void;
}

export function operate<T, U = T>(
  operation: (observer: Push.SubscriptionObserver<U>) => OperationObserver<T>
): Push.Operation<T, U> {
  return transform((observable) => {
    return new Observable((obs: Push.SubscriptionObserver) => {
      const { teardown, ...observer } = operation(obs);
      const subscription = intercept(observable, {
        between: observer,
        to: obs
      });

      return () => {
        subscription.unsubscribe();
        if (teardown) teardown();
      };
    });
  });
}
