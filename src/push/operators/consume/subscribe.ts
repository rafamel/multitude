import { NullaryFn, UnaryFn } from 'type-core';

import { Push } from '@definitions';
import { transform } from '../../utils/transform';

export function subscribe<T>(
  observer: Push.Observer<T> | null
): Push.Transformation<T, Push.Subscription>;
export function subscribe<T>(
  onNext: UnaryFn<T>,
  onError?: UnaryFn<Error>,
  onComplete?: NullaryFn
): Push.Transformation<T, Push.Subscription>;

export function subscribe(
  observer: any,
  ...arr: any[]
): Push.Transformation<any, Push.Subscription> {
  return transform((observable) => {
    return observable.subscribe(observer, ...arr);
  });
}
