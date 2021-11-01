import { NullaryFn, TypeGuard } from 'type-core';
import { Push } from '@definitions';
import { Util } from '@helpers';
import { isSubscriptionLike } from './type-guards';

export function teardown(teardown: Push.Teardown): NullaryFn {
  if (TypeGuard.isFunction(teardown)) return teardown;
  if (TypeGuard.isEmpty(teardown)) return Util.noop;
  if (isSubscriptionLike(teardown)) return () => teardown.unsubscribe();
  throw new TypeError('Expected teardown to be a function or a subscription');
}
