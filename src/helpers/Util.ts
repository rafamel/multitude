import { Empty, NullaryFn, UnaryFn, Dictionary, TypeGuard } from 'type-core';

const $empty = Symbol('empty');

export class Util {
  public static noop(): void {
    return undefined;
  }
  public static identity<T>(value: T): T {
    return value;
  }
  public static throws(error: Error): never {
    throw error;
  }
  public static tries(
    tries: Empty | NullaryFn,
    catches: Empty | UnaryFn<Error>,
    finalizes: Empty | NullaryFn
  ): void {
    try {
      if (tries) tries();
    } catch (err) {
      if (catches) catches(err as Error);
    } finally {
      if (finalizes) finalizes();
    }
  }
  public static calls<T extends Dictionary, K extends keyof T>(
    obj: T | Empty,
    key: K,
    payload: null | any[]
  ): boolean {
    if (!obj) return false;
    let method: any = $empty;
    try {
      method = (obj as any)[key];
      payload ? method.call(obj, ...payload) : method.call(obj);
    } catch (err) {
      if (TypeGuard.isEmpty(method)) return false;
      else throw err;
    }

    return true;
  }
}
