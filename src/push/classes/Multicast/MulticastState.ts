import { Push } from '@definitions';
import { MulticastReplay } from './MulticastReplay';

type ErrorType = Error;
export declare namespace MulticastState {
  type Type<T> =
    | Unsubscribe<T>
    | Subscribe<T>
    | Error<T>
    | Complete<T>
    | Terminate<T>;

  /* General States */
  interface Core<T> {
    type: 'unsubscribe' | 'subscribe' | 'error' | 'complete' | 'terminate';
    subscriber: Push.Subscriber<T>;
  }

  /* Specific states */
  interface Unsubscribe<T> extends Core<T> {
    type: 'unsubscribe';
    error: ErrorType;
    replay: void;
  }
  interface Subscribe<T> extends Core<T> {
    type: 'subscribe';
    replay: MulticastReplay.Subscription<T>;
    observers: Set<Push.SubscriptionObserver>;
    subscription: Push.Subscription | null;
  }
  interface Error<T> extends Core<T> {
    type: 'error';
    error: ErrorType;
    replay: MulticastReplay.Subscription<T>;
  }
  interface Complete<T> extends Core<T> {
    type: 'complete';
    replay: MulticastReplay.Subscription<T>;
  }
  interface Terminate<T> extends Core<T> {
    type: 'terminate';
    error: ErrorType;
    replay: void;
  }

  // Update handlers
  interface Handlers<T> {
    onKeepUnsubscribe: ((data: Unsubscribe<T>) => void) | null;
    onUnsubscribeSubscribe(
      data: Unsubscribe<T>,
      next: Subscribe<T>,
      subscribe: (subscription: Push.Subscription) => boolean
    ): void;
    onKeepSubscribe(data: Subscribe<T>): void;
    onSubscribeUnsubscribe(data: Subscribe<T>, next: Unsubscribe<T>): void;
    onKeepFinal(data: Complete<T> | Error<T>): void;
    onFinalTerminate(data: Complete<T> | Error<T>, next: Terminate<T>): void;
    onKeepTerminate(data: Terminate<T>): void;
  }
}

const DEFAULT_ERROR = new Error('Multicast observable is not connected');

export class MulticastState<T> {
  private state: MulticastState.Type<T>;
  public constructor(subscriber: Push.Subscriber<T>) {
    this.state = this.unsubscribe(subscriber);
  }
  public data(): MulticastState.Type<T> {
    return this.state;
  }
  public finalize(type: 'error', error: Error): void;
  public finalize(type: 'complete'): void;
  public finalize(type: 'error' | 'complete', error?: Error): void {
    if (this.state.type !== 'subscribe') return;

    this.state =
      type === 'error'
        ? this.error(error as Error, this.state)
        : this.complete(this.state);
  }
  public update(
    params: { connect: boolean; replay: number },
    handlers: Partial<MulticastState.Handlers<T>>
  ): void {
    const data = this.state;

    switch (data.type) {
      case 'unsubscribe': {
        if (params.connect) {
          this.state = this.subscribe(null, data);
          this.state.replay.limit(params.replay);

          if (handlers.onUnsubscribeSubscribe) {
            handlers.onUnsubscribeSubscribe(
              data,
              this.state,
              (subscription) => {
                if (this.state.type === 'subscribe') {
                  this.state.subscription = subscription;
                  return true;
                }
                return false;
              }
            );
          }
        } else if (handlers.onKeepUnsubscribe) {
          handlers.onKeepUnsubscribe(data);
        }
        break;
      }
      case 'subscribe': {
        data.replay.limit(params.replay);

        if (!params.connect) {
          this.state = this.unsubscribe(data.subscriber);
          if (handlers.onSubscribeUnsubscribe) {
            handlers.onSubscribeUnsubscribe(data, this.state);
          }
        } else if (handlers.onKeepSubscribe) {
          handlers.onKeepSubscribe(data);
        }
        break;
      }
      case 'complete':
      case 'error': {
        data.replay.limit(params.replay);

        if (!params.connect) {
          this.state = this.terminate(data);
          if (handlers.onFinalTerminate) {
            handlers.onFinalTerminate(data, this.state);
          }
        } else if (handlers.onKeepFinal) {
          handlers.onKeepFinal(data);
        }
        break;
      }
      default: {
        if (handlers.onKeepTerminate) {
          handlers.onKeepTerminate(data);
        }
      }
    }
  }
  private unsubscribe(
    subscriber: Push.Subscriber<T>
  ): MulticastState.Unsubscribe<T> {
    return {
      type: 'unsubscribe',
      error: DEFAULT_ERROR,
      replay: undefined,
      subscriber
    };
  }
  private subscribe(
    subscription: Push.Subscription | null,
    data: MulticastState.Unsubscribe<T>
  ): MulticastState.Subscribe<T> {
    return {
      type: 'subscribe',
      replay: new MulticastReplay(),
      subscription,
      subscriber: data.subscriber,
      observers: new Set()
    };
  }
  private error(
    error: Error,
    data: MulticastState.Subscribe<T>
  ): MulticastState.Error<T> {
    return {
      type: 'error',
      error,
      replay: data.replay,
      subscriber: data.subscriber
    };
  }
  private complete(
    data: MulticastState.Subscribe<T>
  ): MulticastState.Complete<T> {
    return {
      type: 'complete',
      replay: data.replay,
      subscriber: data.subscriber
    };
  }
  private terminate(
    data: MulticastState.Error<T> | MulticastState.Complete<T>
  ): MulticastState.Terminate<T> {
    return {
      type: 'terminate',
      error: DEFAULT_ERROR,
      replay: undefined,
      subscriber: data.subscriber
    };
  }
}
