import { Push } from '@definitions';
import { Subscription } from '../Subscription';

const $observer = Symbol('observer');

export class Accessors {
  public static setObserver<T>(
    subscription: Subscription<T>,
    observer: Push.Observer<T> | null
  ): void {
    Object.defineProperty(subscription, $observer, {
      enumerable: false,
      writable: true,
      value: observer
    });
  }
  public static getObserver<T>(
    subscription: Subscription<T>
  ): Push.Observer<T> | null {
    return (subscription as any)[$observer];
  }
}
