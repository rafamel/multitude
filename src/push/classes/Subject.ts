import { Push } from '@definitions';
import { from } from '../creators/from';
import { tap } from '../operators/tap';
import { Observable } from './Observable';
import { into } from 'pipettes';

export declare namespace Subject {
  export interface Options<U> {
    /** Sets initial value; it won't be emitted. */
    value?: U;
  }
}

export class Subject<T = any, U extends T | void = T | void>
  extends Observable<T>
  implements Push.Subject<T, U>
{
  public static of<T>(item: T): Subject<T, T> {
    const subject = new this<T, T>(item);
    subject.next(item);
    return subject;
  }
  public static from<T, U extends T | void = T | void>(
    item: Push.Convertible<T>,
    options?: Subject.Options<U>
  ): Subject<T, U> {
    if (item.constructor === this) return item;

    const observable = from(item);
    const subject = new this<T, U>(options);

    let subscription: null | Push.Subscription = null;
    into(observable, tap({ start: (subs) => (subscription = subs) })).subscribe(
      subject
    );

    subject.subscribe({
      error: () => (subscription ? subscription.unsubscribe() : undefined),
      complete: () => (subscription ? subscription.unsubscribe() : undefined)
    });

    return subject;
  }
  #value: T | U;
  #closed: boolean;
  #observers: Array<Push.SubscriptionObserver<T>>;
  public constructor(options?: Subject.Options<U>) {
    const observers: Array<Push.SubscriptionObserver<T>> = [];
    super((obs) => {
      observers.push(obs);
      return () => {
        const index = observers.indexOf(obs);
        if (index >= 0) observers.splice(index, 1);
      };
    });
    this.#value = (options ? options.value : undefined) as U;
    this.#closed = false;
    this.#observers = observers;
  }
  public [Symbol.observable](): Observable<T> {
    return Observable.from(this);
  }
  public get value(): T | U {
    return this.#value;
  }
  public get closed(): boolean {
    return this.#closed;
  }
  public next(value: T): void {
    this.#value = value;
    for (const observer of this.#observers) {
      observer.next(value);
    }
  }
  public error(error: Error): void {
    this.#closed = true;
    for (const observer of this.#observers) {
      observer.error(error);
    }
  }
  public complete(): void {
    this.#closed = true;
    for (const observer of this.#observers) {
      observer.complete();
    }
  }
}
