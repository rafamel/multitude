import { Push } from '@definitions';
import { Invoke } from './helpers/Invoke';
import { Subscription } from './Subscription';

class SubscriptionObserver<T = any> implements Push.SubscriptionObserver<T> {
  #subscription: Subscription<T>;
  public constructor(subscription: Subscription<T>) {
    this.#subscription = subscription;
  }
  public get closed(): boolean {
    return this.#subscription.closed;
  }
  public next(value: T): void {
    Invoke.observer('next', value, this.#subscription);
  }
  public error(error: Error): void {
    Invoke.observer('error', error, this.#subscription);
  }
  public complete(): void {
    Invoke.observer('complete', undefined, this.#subscription);
  }
}

SubscriptionObserver.prototype.constructor = Object;

export { SubscriptionObserver };
