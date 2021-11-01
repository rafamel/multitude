import { NullaryFn } from 'type-core';
import { Push } from '@definitions';
import { Observable } from '../../classes/Observable';
import { Util } from '@helpers';

export function fromExecutor<T>(
  executor: NullaryFn<PromiseLike<T> | T>
): Push.Observable<T> {
  return new Observable((obs) => {
    Util.resolves(
      executor,
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
