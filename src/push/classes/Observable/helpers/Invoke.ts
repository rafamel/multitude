import { Globals, Util } from '@helpers';
import { Subscription } from '../Subscription';
import { Accessors } from './Accessors';

export class Invoke {
  public static observer(
    action: 'start' | 'next' | 'error' | 'complete',
    payload: any,
    subscription: Subscription
  ): void {
    const observer = Accessors.getObserver(subscription);

    if (!observer) {
      if (action === 'next') {
        Globals.onStoppedNotification(payload, subscription);
      } else if (action === 'error') {
        Globals.onUnhandledError(payload, subscription);
      }
      return;
    }

    if (action === 'error' || action === 'complete') {
      Accessors.setObserver(subscription, null);
    }

    try {
      const didCall = Util.calls(
        observer,
        action,
        action === 'complete' ? null : [payload]
      );
      if (!didCall && action === 'error') {
        Globals.onUnhandledError(payload, subscription);
      }
    } catch (err) {
      Globals.onUnhandledError(err as Error, subscription);
    } finally {
      if (action === 'error' || action === 'complete') {
        try {
          subscription.unsubscribe();
        } catch (err) {
          Globals.onUnhandledError(err as Error, subscription);
        }
      }
    }
  }
}
