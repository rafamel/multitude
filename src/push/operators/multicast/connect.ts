import { Push } from '@definitions';
import { transform } from '../../utils/transform';
import { share } from './share';

export interface ConnectOptions {
  replay?: number;
}

/**
 * Creates a new Observable that multicasts the original Observable.
 * The original Observable will be immediately subscribed,
 * and will continue to be even if there are no subscribers.
 */
export function connect<T>(
  options?: ConnectOptions
): Push.Transformation<T, Push.Observable<T>> {
  const opts = { replay: options?.replay || 0 };

  return transform((observable) => {
    const res = share<T>({ policy: 'keep-open', replay: opts.replay })(
      observable
    );
    res.subscribe({ error: () => undefined });
    return res;
  });
}
