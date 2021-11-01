import { Push } from '@definitions';
import { Talkback } from '../classes/Talkback';
import { from } from '../create/from';

interface InterceptOptions<T, U> {
  between: Push.Observer<T>;
  to: Push.SubscriptionObserver<U>;
}

export function intercept<T, U>(
  convertible: Push.Convertible<T>,
  options: InterceptOptions<T, U>
): Push.Subscription {
  return from(convertible).subscribe(
    new Talkback<any>([options.between, options.to], {
      stopAtFirst: true,
      onError: options.to.error.bind(options.to)
    })
  );
}
