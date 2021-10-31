import { Empty } from 'type-core';
import { Push } from '@definitions';
import { transform } from '../../utils/transform';
import { Observable } from '../../classes/Observable';
import { Talkback } from '../../classes/Talkback';
import { from } from '../create/from';

export function tap<T>(
  observer?: Push.Observer<T> | Empty
): Push.Transformation<T, Push.Observable<T>> {
  if (!observer) return (obs) => from(obs);
  return transform((observable) => {
    return new Observable<T>((obs) => {
      return observable.subscribe(
        new Talkback([observer, obs], {
          stopAtFirst: false,
          onError: obs.error.bind(obs)
        })
      );
    });
  });
}
