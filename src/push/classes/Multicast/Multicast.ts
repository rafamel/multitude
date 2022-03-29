import { Empty, NullaryFn, TypeGuard, UnaryFn } from 'type-core';

import { Push } from '@definitions';
import { from } from '../../create/from';
import { Observable } from '../Observable';
import { MulticastState } from './MulticastState';

export declare namespace Multicast {
  /**
   * Handler called on instantiation and
   * upon subscription events to the multicast.
   */
  type Handler = (state: State) => Params;
  /** Options for replay on always connected multicasts */
  type Options = { replay?: number };

  /**
   * Single argument for the multicaster function,
   * which is called on start and subscription events.
   */
  interface State {
    /** Event prompting a handler call */
    event: 'start' | 'subscribe' | 'unsubscribe';
    /** Source observable subscription state */
    source: 'subscribe' | 'unsubscribe' | 'error' | 'complete';
    /** Current number of subscriptions */
    subscriptions: number;
  }
  interface Params {
    /** Connect or disconnect from source observable values */
    connect: boolean;
    /** Replay emitted values upon subscription */
    replay: number;
  }
}

export class Multicast<T = any, U extends T | void = T | void>
  extends Observable<T>
  implements Push.Multicast<T, U>
{
  /**
   * Creates a replay multicast of `items`.
   */
  public static of<T>(...items: T[]): Multicast<T, T> {
    const Constructor = TypeGuard.isFunction(this) ? this : Multicast;
    return new Constructor(
      (obs) => {
        for (const item of items) obs.next(item);
      },
      () => ({ connect: true, replay: items.length })
    );
  }
  /**
   * Creates a multicast from `source`.
   */
  public static from<T, U extends T | void = T | void>(
    source: Push.Convertible<T>,
    options?: Multicast.Options | Multicast.Handler
  ): Multicast<T, U> {
    const observable = from(source);
    const Constructor = TypeGuard.isFunction(this) ? this : Multicast;

    return new Constructor((obs) => observable.subscribe(obs), options);
  }
  #value: NullaryFn<T | void>;
  #observable: Observable<T>;
  public constructor(
    subscriber: Push.Subscriber<T>,
    options?: Multicast.Options | Multicast.Handler
  ) {
    super(subscriber);

    const state = new MulticastState(subscriber);
    this.#value = () => state.data().replay?.value();

    const callback = (
      event: Multicast.State['event']
    ): Required<Multicast.Params> => {
      const data = state.data();
      if (data.type === 'terminate') {
        return { connect: false, replay: 0 };
      }
      if (!options) {
        return { connect: true, replay: 0 };
      }

      return TypeGuard.isFunction(options)
        ? options({
            event,
            source: data.type,
            subscriptions: data.type === 'subscribe' ? data.observers.size : 0
          })
        : { replay: options.replay || 0, connect: true };
    };

    const subscribe = (
      data: MulticastState.Subscribe<T>,
      cb: (subscription: Push.Subscription) => boolean
    ): void => {
      super.subscribe({
        start: (subscription) => {
          if (data.subscription) data.subscription.unsubscribe();
          if (!cb(subscription)) subscription.unsubscribe();
        },
        next: (value) => {
          data.replay.push(value);
          for (const obs of data.observers) obs.next(value);
        },
        error: (error) => {
          state.finalize('error', error);
          for (const obs of data.observers) obs.error(error);
        },
        complete: () => {
          state.finalize('complete');
          for (const obs of data.observers) obs.complete();
        }
      });
    };

    this.#observable = new Observable((obs) => {
      state.update(callback('subscribe'), {
        onKeepUnsubscribe: (data) => {
          obs.error(data.error);
        },
        onUnsubscribeSubscribe: (_, next, cb) => {
          next.observers.add(obs);
          subscribe(next, cb);
        },
        onKeepSubscribe: (data) => {
          data.replay.consume((value) => obs.next(value));
          data.observers.add(obs);
        },
        onSubscribeUnsubscribe: (data, next) => {
          if (data.subscription) data.subscription.unsubscribe();

          const error = next.error;
          for (const obs of data.observers) obs.error(error);
        },
        onKeepFinal: (data) => {
          data.replay.consume((value) => obs.next(value));

          if (data.type === 'complete') obs.complete();
          else obs.error(data.error);
        },
        onFinalTerminate: (_, next) => {
          obs.error(next.error);
        },
        onKeepTerminate: (data) => {
          obs.error(data.error);
        }
      });

      return () => {
        state.update(callback('unsubscribe'), {
          onUnsubscribeSubscribe: (_, next, cb) => {
            subscribe(next, cb);
          },
          onKeepSubscribe: (data) => {
            data.observers.delete(obs);
          },
          onSubscribeUnsubscribe: (data, next) => {
            data.observers.delete(obs);
            if (data.subscription) data.subscription.unsubscribe();

            const error = next.error;
            for (const obs of data.observers) obs.error(error);
          }
        });
      };
    });

    state.update(callback('start'), {
      onUnsubscribeSubscribe: (_, next, cb) => {
        subscribe(next, cb);
      },
      onSubscribeUnsubscribe: (data, next) => {
        if (data.subscription) data.subscription.unsubscribe();

        const error = next.error;
        for (const obs of data.observers) obs.error(error);
      }
    });
  }
  public [Symbol.observable](): Observable<T> {
    return this.#observable;
  }
  /**
   * Last multicasted value.
   */
  public get value(): T | U {
    return this.#value() as T | U;
  }
  public subscribe(observer?: Empty | Push.Observer<T>): Push.Subscription;
  public subscribe(
    onNext: UnaryFn<T>,
    onError?: UnaryFn<Error>,
    onComplete?: NullaryFn
  ): Push.Subscription;
  public subscribe(observer: any, ...arr: any[]): Push.Subscription {
    return this.#observable.subscribe(observer, ...arr);
  }
}
