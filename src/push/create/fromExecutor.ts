import { NullaryFn } from 'type-core';
import { SyncPromise } from 'promist';
import { Push } from '@definitions';
import { Observable } from '../classes/Observable';

export function fromExecutor<T>(
  executor: NullaryFn<PromiseLike<T> | T>
): Push.Observable<T> {
  return new Observable((obs) => {
    SyncPromise.from(executor).operate(
      (value) => {
        obs.next(value);
        obs.complete();
      },
      (error) => {
        obs.error(error as Error);
      }
    );
  });
}
