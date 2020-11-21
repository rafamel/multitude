import { Push, WideRecord } from '@definitions';
import { Subscription } from '../Subscription';

const $observer = Symbol('observer');
export class ManageObserver {
  public static set<T>(
    subscription: Subscription<T>,
    observer: Push.Observer<T>
  ): void {
    (subscription as any)[$observer] = observer;
  }
  public static get<T>(subscription: Subscription<T>): WideRecord {
    return (subscription as any)[$observer];
  }
  public static close<T>(subscription: Subscription<T>): void {
    (subscription as any)[$observer] = null;
  }
  public static isClosed<T>(subscription: Subscription<T>): boolean {
    return !(subscription as any)[$observer];
  }
}