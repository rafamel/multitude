import { Push } from '@definitions';
import { Multicast } from '../../classes/Multicast';

/**
 * 'on-demand': Subscribes and re-subscribes to the original Observable once the resulting one has open subscriptions, so long as the original Observable hasn't errored or completed on previous subscriptions. Unsubscribes from the original Observable once the resulting Observable has no active subscriptions.
 * 'keep-open': Keeps the parent subscription open even if it has no current subscriptions.
 * 'keep-closed': Permanently unsubscribes from the original Observable once the resulting one has no active subscriptions. Subsequent subscriptions will error or complete immediately with the same signal as the original Observable if it finalized before being unsubscribed, or otherwise error.
 */
export type SharePolicy = 'on-demand' | 'keep-open' | 'keep-closed';

export interface ShareOptions {
  replay?: number;
}

/**
 * Creates an Observable that multicasts the original Observable.
 * The original Observable won't be subscribed until there is at least
 * one subscriber.
 */
export function share<T, U extends T | void = T | void>(
  policy: SharePolicy,
  options?: ShareOptions
): Push.Transformation<T, Push.Multicast<T, U>> {
  const replay = options?.replay || 0;

  return (convertible) => {
    switch (policy) {
      case 'keep-open': {
        return Multicast.from(convertible, ({ event }) => {
          return { connect: event !== 'start', replay };
        });
      }
      case 'keep-closed': {
        let didDisconnect = false;
        return Multicast.from(
          convertible,
          ({ event, source, subscriptions }) => {
            if (source === 'error' || source === 'complete') {
              return { connect: true, replay };
            }

            switch (event) {
              case 'start': {
                return { connect: false, replay };
              }
              case 'subscribe': {
                return { connect: !didDisconnect, replay };
              }
              default: {
                const connect = subscriptions - 1 > 0;
                if (!connect) didDisconnect = true;
                return { connect, replay };
              }
            }
          }
        );
      }
      default: {
        return Multicast.from(
          convertible,
          ({ event, source, subscriptions }) => {
            if (source === 'error' || source === 'complete') {
              return { connect: true, replay };
            }
            switch (event) {
              case 'start': {
                return { connect: false, replay };
              }
              case 'subscribe': {
                return { connect: true, replay };
              }
              default: {
                return { connect: subscriptions - 1 > 0, replay };
              }
            }
          }
        );
      }
    }
  };
}
