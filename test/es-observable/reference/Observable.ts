import { NoParamFn, Observables, UnaryFn } from '../../../src/definitions';
import { IdentityGuard } from '../../../src/helpers';
import {
  fromIterable,
  fromObservableLike
} from '../../../src/streams/PushStream/from';
import { Subscription } from './Subscription';
import SymbolObservable from 'symbol-observable';

const $subscriber = Symbol('subscriber');

export class Observable<T = any> implements Observables.Observable<T> {
  static of<T>(...items: T[]): Observable<T> {
    const Constructor = typeof this === 'function' ? this : Observable;
    return fromIterable(Constructor, items) as any;
  }
  static from<T>(
    item:
      | Observables.Subscriber<T>
      | Observables.Observable<T>
      | Observables.Compatible<T>
      | Observables.Like<T>
      | Iterable<T>
  ): Observable<T> {
    const Constructor = IdentityGuard.isFunction(this) ? this : Observable;

    // Subscriber
    if (IdentityGuard.isFunction(item)) return new Constructor(item);

    if (IdentityGuard.isObject(item)) {
      const target: any = item;
      // Compatible
      const so = target[SymbolObservable];
      if (IdentityGuard.isFunction(so)) {
        const obs = so();
        if (!IdentityGuard.isObject(obs) && !IdentityGuard.isFunction(obs)) {
          throw new TypeError('Invalid Observable compatible object');
        }
        return fromObservableLike(Constructor, obs) as any;
      }

      // Like
      if (IdentityGuard.isFunction(target.subscribe)) {
        return fromObservableLike(Constructor, target) as any;
      }

      // Iterable
      if (IdentityGuard.isFunction(target[Symbol.iterator])) {
        return fromIterable(Constructor, target) as any;
      }
    }

    throw new TypeError(`Unable to convert ${typeof item} into an Observable`);
  }
  private [$subscriber]: Observables.Subscriber<T>;
  public constructor(subscriber: Observables.Subscriber<T>) {
    if (!IdentityGuard.isFunction(subscriber)) {
      throw new TypeError('Expected subscriber to be a function');
    }

    this[$subscriber] = subscriber;
  }
  public [SymbolObservable](): Observable<T> {
    return this;
  }
  public [Symbol.observable](): Observable<T> {
    return this;
  }
  public subscribe(observer: Observables.Observer<T>): Subscription<T>;
  public subscribe(
    onNext: UnaryFn<T>,
    onError?: UnaryFn<Error>,
    onComplete?: NoParamFn
  ): Subscription<T>;
  public subscribe(observer: any, ...arr: any[]): Subscription<T> {
    if (IdentityGuard.isFunction(observer)) {
      observer = { next: observer, error: arr[0], complete: arr[1] };
    } else if (!IdentityGuard.isObject(observer)) {
      observer = {};
    }

    return new Subscription(observer, this[$subscriber]);
  }
}