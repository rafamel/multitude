import { Push } from '@definitions';
import { from } from '../operators/create/from';

export function transform<T, R>(
  transformation: (observable: Push.Observable<T>) => R
): Push.Transformation<T, R> {
  return function (convertible) {
    return transformation(from(convertible));
  };
}
