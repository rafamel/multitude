import { Push } from '@definitions';
import { Util } from './Util';

const defaults: Required<Push.Hooks> = {
  onUnhandledError(error: Error): void {
    setTimeout(() => Util.throws(error), 0);
  },
  onStoppedNotification: null
};

const globals: Push.Hooks = { ...defaults };

export class Globals {
  public static setGlobals(value: Push.Hooks | null): void {
    Object.assign(globals, value || defaults);
  }
  public static onUnhandledError(
    error: Error,
    subscription: Push.Subscription
  ): void {
    Util.calls(globals, 'onUnhandledError', [error, subscription]);
  }
  public static onStoppedNotification(
    value: any,
    subscription: Push.Subscription
  ): void {
    try {
      Util.calls(globals, 'onStoppedNotification', [value, subscription]);
    } catch (err) {
      this.onUnhandledError(err as Error, subscription);
    }
  }
}
