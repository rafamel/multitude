import { Push } from '@definitions';
import { Multicast } from '../../classes/Multicast';

/**
 * Creates a new Observable that multicasts the original Observable.
 * The original Observable will be immediately subscribed,
 * and will continue to be even if there are no subscribers
 * when no multicast handler is passed
 */
export function connect<T, U extends T | void = T | void>(
  options?: Multicast.Options | Multicast.Handler
): Push.Transformation<T, Push.Multicast<T, U>> {
  return (convertible) => {
    return Multicast.from(convertible, options);
  };
}
