import { TypeGuard } from 'type-core';

import { Push } from '@definitions';
import { Observable } from '../classes/Observable';

export type FromEventArgs =
  | { source: NodeJS.EventEmitter; type: string | symbol }
  | { source: EventTarget; type: string; capture?: boolean };

export function fromEvent(args: FromEventArgs): Push.Observable {
  const { source, type, capture } = { capture: false, ...args };

  if (TypeGuard.isEventTarget(source)) {
    return new Observable<Event>((obs) => {
      function listener(event: Event): void {
        obs.next(event);
      }

      try {
        source.addEventListener(type as string, listener, capture);
      } catch (error) {
        obs.error(error as Error);
      }

      return () => source.removeEventListener(type as string, listener);
    });
  }

  if (TypeGuard.isEventEmitterLike(source)) {
    return new Observable((obs) => {
      function listener(...events: any[]): void {
        events.length > 1 ? obs.next(events) : obs.next(events[0]);
      }

      try {
        source.addListener(type, listener);
      } catch (error) {
        obs.error(error as Error);
      }

      return () => source.removeListener(type, listener);
    });
  }

  throw new Error('Source must be an EventEmitter or EventTarget');
}
