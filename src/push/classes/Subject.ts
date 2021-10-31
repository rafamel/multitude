import { into } from 'pipettes';
import { Push } from '@definitions';
import { from } from '../operators/create/from';
import { tap } from '../operators/tap';
import { Observable } from './Observable';

export declare namespace Subject {
  export interface Options<U> {
    /**
     * Sets an initial `Subject.value`.
     * This value will not be emitted.
     */
    value?: U;
  }
}

export class Subject<T = any, U extends T | void = T | void>
  extends Observable<T>
  implements Push.Subject<T, U>
{
  /**
   * As subjects initialize before subscriptions,
   * `item` won't be emitted and will be used instead
   * as an initial `Subject.value`.
   * Effectively an alternative to `new Subject({ value })`.
   */
  public static of<T>(item: T): Subject<T, T> {
    return new this<T, T>({ value: item });
  }
  /**
   * As subjects initialize before subscriptions,
   * values emitted synchronously by the source `item`
   * won't be emitted.
   * The last synchronous value will, if existing,
   * be set as the initial `Subject.value`, overriding
   * the `options.value` passed, if any.
   * The finalization of the source `item` will
   * cause the Subject to also close.
   */
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
  #observers: Set<Push.SubscriptionObserver<T>>;
  public constructor(options?: Subject.Options<U>) {
    const observers = new Set<Push.SubscriptionObserver<T>>();
    super((obs) => {
      observers.add(obs);
      return () => {
        observers.delete(obs);
      };
    });
    this.#value = (options ? options.value : undefined) as U;
    this.#closed = false;
    this.#observers = observers;
  }
  public [Symbol.observable](): Observable<T> {
    return Observable.from(this);
  }
  /**
   * Last value emitted by a Subject or, in its abscense,
   * the initial value set.
   */
  public get value(): T | U {
    return this.#value;
  }
  /**
   * Indicates the state of the subject.
   */
  public get closed(): boolean {
    return this.#closed;
  }
  /**
   * Emits a value.
   */
  public next(value: T): void {
    this.#value = value;
    for (const observer of this.#observers) {
      observer.next(value);
    }
  }
  /**
   * Emits an error.
   */
  public error(error: Error): void {
    this.#closed = true;
    for (const observer of this.#observers) {
      observer.error(error);
    }
  }
  /**
   * Emits a complete signal.
   */
  public complete(): void {
    this.#closed = true;
    for (const observer of this.#observers) {
      observer.complete();
    }
  }
}
