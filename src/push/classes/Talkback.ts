import { UnaryFn } from 'type-core';
import { shallow } from 'merge-strategies';
import { Push } from '@definitions';
import { Util } from '@helpers';

export declare namespace Talkback {
  export interface Options {
    /**
     * Stream events to first observer with
     * the method present instead of to all.
     */
    stopAtFirst?: boolean;
    /**
     * Receives errors thrown by observer method calls.
     */
    onError?: UnaryFn<Error>;
  }
}

export class Talkback<T = any> implements Push.Talkback<T> {
  #items: Iterable<Push.Observer<T>>;
  #options: Required<Talkback.Options>;
  public constructor(
    items: Iterable<Push.Observer<T>>,
    options?: Talkback.Options
  ) {
    this.#items = items;
    this.#options = shallow(
      {
        stopAtFirst: false,
        onError: (err: Error) => {
          setTimeout(() => Util.throws(err), 0);
        }
      },
      options || undefined
    );
  }
  /**
   * Emits a start signal with a Subscription.
   */
  public start(subscription: Push.Subscription): void {
    return this.#execute('start', subscription);
  }
  /**
   * Emits a value.
   */
  public next(value: T): void {
    return this.#execute('next', value);
  }
  /**
   * Emits an error.
   */
  public error(error: Error): void {
    return this.#execute('error', error);
  }
  /**
   * Emits a complete signal.
   */
  public complete(): void {
    return this.#execute('complete', undefined);
  }
  #execute(action: keyof Push.Observer, payload: any): void {
    const options = this.#options;
    for (const item of this.#items) {
      try {
        const isEmpty = !Util.calls(item, action, [payload]);
        if (isEmpty) continue;
      } catch (err) {
        options.onError(err as Error);
      }
      if (options.stopAtFirst) break;
    }
  }
}
