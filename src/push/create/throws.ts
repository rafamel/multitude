import { TypeGuard } from 'type-core';
import { Push } from '@definitions';
import { Observable } from '../classes/Observable';

export function throws<T = any>(error: string | Error): Push.Observable<T> {
  const err = TypeGuard.isString(error) ? new Error(error) : error;
  return new Observable((obs) => obs.error(err));
}
