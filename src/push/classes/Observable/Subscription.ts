import { NullaryFn } from 'type-core';
import { Push } from '@definitions';
import { Globals, Util } from '@helpers';
import { teardown } from '../../utils/teardown';
import { Accessors } from './helpers/Accessors';
import { Invoke } from './helpers/Invoke';
import { SubscriptionObserver } from './SubscriptionObserver';

class Subscription<T = any> implements Push.Subscription {
  #teardown: NullaryFn | null;
  public constructor(
    observer: Push.Observer<T>,
    subscriber: Push.Subscriber<T>
  ) {
    this.#teardown = null;
    Accessors.setObserver(this, observer);

    Invoke.observer('start', this, this);
    if (!Accessors.getObserver(this)) return;

    const subscriptionObserver = new SubscriptionObserver(this);

    let fn: NullaryFn = Util.noop;
    try {
      const unsubscribe = subscriber(subscriptionObserver);
      fn = teardown(unsubscribe);
    } catch (err) {
      subscriptionObserver.error(err as Error);
    } finally {
      if (!Accessors.getObserver(this)) {
        try {
          fn();
        } catch (err) {
          Globals.onUnhandledError(err as Error, this);
        }
      } else {
        this.#teardown = fn;
      }
    }
  }
  public get closed(): boolean {
    return !Accessors.getObserver(this);
  }
  public unsubscribe(): void {
    if (Accessors.getObserver(this)) {
      Accessors.setObserver(this, null);
    }

    const teardown = this.#teardown;
    if (!teardown) return;

    this.#teardown = null;
    try {
      teardown();
    } catch (err) {
      Globals.onUnhandledError(err as Error, this);
    }
  }
}

Subscription.prototype.constructor = Object;

export { Subscription };
