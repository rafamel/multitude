import { NoParamFn, Push } from '@definitions';
import { Handler, TypeGuard } from '@helpers';
import { isSubscriptionLike } from '@utils';

const empty = Promise.resolve();
const noop = (): Promise<void> => empty;

export function terminateToAsyncFunction(
  terminate: Push.Terminate
): NoParamFn<Promise<void>> {
  function each(
    item: Exclude<Push.Terminate, any[]>
  ): NoParamFn<Promise<void>> {
    if (TypeGuard.isEmpty(item)) return noop;
    if (TypeGuard.isFunction(item)) {
      return () => {
        try {
          return Promise.resolve(item());
        } catch (err) {
          return Promise.reject(err);
        }
      };
    }
    if (isSubscriptionLike(item)) {
      return () => {
        item.unsubscribe();
        return Promise.resolve(item).then(Handler.noop);
      };
    }
    throw new TypeError(
      'Expected subscriber terminate to be a function, a subscription, or an array of them'
    );
  }

  if (!Array.isArray(terminate)) return each(terminate);

  const fns = terminate.map(each);
  return () => Promise.all(fns.map((fn) => fn())).then(Handler.noop);
}