import { MaybePromise, TypeGuard } from 'type-core';
import { SyncPromise } from 'promist';

import { Pull } from '@definitions';
import { Validate } from './helpers/Validate';

export class PullableIterator<O, I> implements Pull.PullableIterator<O, I> {
  #closed: boolean;
  #iterator: Pull.Iterator<O, I>;
  public constructor(iterator: Pull.Iterator<O, I>) {
    Validate.counter(iterator);

    this.#closed = false;
    this.#iterator = iterator;
  }
  public next(value: I): MaybePromise<Pull.Response<O>> {
    if (this.#closed) return { complete: true };

    const iterator = this.#iterator;
    const method = iterator.next;
    if (TypeGuard.isEmpty(method)) return { complete: true };

    return SyncPromise.from(() => method.call(iterator, value))
      .operate((response) => {
        if (TypeGuard.isObject(response)) return response;
        throw new TypeError('Expected response to be an object');
      })
      .consume();
  }
  public error(error: Error): MaybePromise<Pull.Response<O>> {
    if (this.#closed) return { complete: true };

    const iterator = this.#iterator;

    return SyncPromise.from(() => null)
      .operate(() => {
        const method = iterator.error;
        if (TypeGuard.isEmpty(method)) throw error;
        return method.call(iterator, error);
      })
      .operate(
        (response) => {
          if (TypeGuard.isObject(response)) return response;

          this.#closed = true;
          throw new TypeError('Expected response to be an object');
        },
        (err) => {
          this.#closed = true;
          throw err;
        }
      )
      .consume();
  }
  public complete(): MaybePromise<void> {
    if (this.#closed) return;

    this.#closed = true;
    const iterator = this.#iterator;
    const method = iterator.complete;
    if (TypeGuard.isEmpty(method)) return;

    return SyncPromise.from(() => method.call(iterator))
      .operate(() => undefined)
      .consume();
  }
}
