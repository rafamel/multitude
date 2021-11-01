import { NullaryFn } from 'type-core';
import { Push } from '@definitions';
import { Observable } from '../classes/Observable';

// TODO: remove
export function defer<T>(
  deferral: NullaryFn<T | PromiseLike<T>>
): Push.Observable<T> {
  return new Observable((obs) => {
    Promise.resolve()
      .then(async () => deferral())
      .then(
        (value) => {
          obs.next(value);
          obs.complete();
        },
        (error) => {
          obs.error(error);
        }
      );
  });
}
