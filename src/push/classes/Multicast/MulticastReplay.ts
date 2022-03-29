import { TypeGuard } from 'type-core';

export declare namespace MulticastReplay {
  interface Subscription<T> extends Connection<T> {
    push(value: T): void;
  }
  interface Connection<T> {
    value(): T | void;
    limit(max: number): void;
    consume(cb: (value: T) => void): void;
  }
}

export class MulticastReplay<T> implements MulticastReplay.Subscription<T> {
  private max: number;
  private last: T | void;
  private values: T[];
  public constructor() {
    this.max = 0;
    this.last = undefined;
    this.values = [];
  }
  public push(value: T): void {
    this.last = value;

    const max = this.max;
    if (!max) return;

    const values = this.values;
    values.push(value);
    if (values.length > max) values.shift();
  }
  public value(): T | void {
    return this.last;
  }
  public limit(max: number): void {
    this.max = TypeGuard.isNumber(max)
      ? max >= 0
        ? max
        : Number.POSITIVE_INFINITY
      : 0;

    if (this.values.length > this.max) {
      this.values = this.max <= 0 ? [] : this.values.slice(-this.max);
    }
  }
  public consume(cb: (value: T) => void): void {
    for (const value of this.values) cb(value);
  }
}
