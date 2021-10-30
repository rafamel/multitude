import { Push } from '@definitions';
import { Hooks, Subscription, Talkback } from '../assistance';
import { SubscriptionManager } from './SubscriptionManager';
import { Empty, Dictionary, NullaryFn, TypeGuard } from 'type-core';

const $empty = Symbol('empty');

export class Invoke {
  public static method<T extends Dictionary, K extends keyof T>(
    obj: T | Empty,
    key: K,
    payload?: Empty | any[],
    onEmpty?: Empty | NullaryFn
  ): void {
    if (!obj) return;
    let method: any = $empty;
    try {
      method = (obj as any)[key];
      payload ? method.call(obj, ...payload) : method.call(obj);
    } catch (err) {
      if (TypeGuard.isEmpty(method)) onEmpty && onEmpty();
      else throw err;
    }
  }
  public static observer(
    action: 'start' | 'next' | 'error' | 'complete',
    payload: any,
    subscription: Subscription,
    hooks: Hooks
  ): void {
    if (SubscriptionManager.isClosed(subscription)) {
      if (action === 'next') {
        hooks.onStoppedNotification(payload, subscription);
      } else if (action === 'error') {
        hooks.onUnhandledError(payload, subscription);
      }
      return;
    }

    const observer = SubscriptionManager.getObserver(subscription);
    if (action === 'error' || action === 'complete') {
      SubscriptionManager.close(subscription);
    }

    try {
      this.method(
        observer,
        action,
        action === 'complete' ? null : [payload],
        action === 'error'
          ? () => hooks.onUnhandledError(payload, subscription)
          : null
      );
    } catch (err) {
      hooks.onUnhandledError(err as Error, subscription);
    } finally {
      if (action === 'error' || action === 'complete') {
        try {
          subscription.unsubscribe();
        } catch (err) {
          hooks.onUnhandledError(err as Error, subscription);
        }
      }
    }
  }
  public static observers(
    action: keyof Push.Observer,
    payload: any,
    items: Push.Observer[],
    options: Talkback.Options
  ): void {
    for (const item of items) {
      let method: any = $empty;
      try {
        method = item[action];
        method.call(item, payload);
      } catch (err) {
        if (TypeGuard.isEmpty(method)) continue;
        else if (options.onError) options.onError(err as Error);
      }
      if (!options.multicast) break;
    }
  }
}
