import { TypeGuard } from 'type-core';

import { Pull } from '@definitions';

export class Validate {
  public static provider(provider: Pull.Provider<any, any>): void {
    if (!TypeGuard.isFunction(provider)) {
      throw new TypeError(`Expected Provider to be a function`);
    }
  }
  public static consumer(consumer: Pull.Consumer<any, any>): void {
    if (!TypeGuard.isFunction(consumer)) {
      throw new TypeError(`Expected Consumer to be a function`);
    }
  }
  public static counter(iterator: Pull.Iterator<any, any>): void {
    if (!TypeGuard.isObject(iterator)) {
      throw new TypeError('Expected Iterator to be an object');
    }
  }
}
