import { Push } from '@definitions';
import { Subscription } from '../Subscription';

const weakmap = new WeakMap<Subscription, Push.Observer>();

export class Accessors {
  public static setObserver<T>(
    subscription: Subscription<T>,
    observer: Push.Observer<T> | null
  ): void {
    observer === null
      ? weakmap.delete(subscription)
      : weakmap.set(subscription, observer);
  }
  public static getObserver<T>(
    subscription: Subscription<T>
  ): Push.Observer<T> | null {
    return weakmap.get(subscription) || null;
  }
}
