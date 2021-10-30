import { Push } from '@definitions';
import { Invoke } from '../helpers';
import { Subscription } from './Subscription';
import { Hooks } from './Hooks';
import { Empty } from 'type-core';

class SubscriptionObserver<T = any> implements Push.SubscriptionObserver<T> {
  #hooks: Hooks<T>;
  #subscription: Subscription<T>;
  public constructor(
    subscription: Subscription<T>,
    ...hooks: [] | [Push.Hooks<T> | Empty]
  ) {
    this.#hooks = Hooks.from(hooks[0]);
    this.#subscription = subscription;
  }
  public get closed(): boolean {
    return this.#subscription.closed;
  }
  public next(value: T): void {
    Invoke.observer('next', value, this.#subscription, this.#hooks);
  }
  public error(error: Error): void {
    Invoke.observer('error', error, this.#subscription, this.#hooks);
  }
  public complete(): void {
    Invoke.observer('complete', undefined, this.#subscription, this.#hooks);
  }
}

SubscriptionObserver.prototype.constructor = Object;

export { SubscriptionObserver };
