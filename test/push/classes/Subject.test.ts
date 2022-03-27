/* eslint-disable unicorn/error-message */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';

import {
  Subject,
  Observable,
  isObservableCompatible,
  isObservableLike,
  Subscription,
  configure
} from '@push';
import { Setup } from '../../setup';

beforeEach(() => configure(null));

describe(`Subject-specific behavior`, () => {
  test(`is instance of Observable`, () => {
    expect(new Subject()).toBeInstanceOf(Observable);
  });
  test(`Subject.value is undefined by default`, () => {
    expect(new Subject().value).toBe(undefined);
  });
  test(`Subject.constructor value sets initial value`, () => {
    expect(new Subject({ value: 'foo' }).value).toBe('foo');
  });
  test(`Subject.constructor value is not emitted`, () => {
    const subject = new Subject({ value: 'foo' });
    const { observer } = Setup.observer();

    subject.subscribe(observer);
    expect(observer.next).toHaveBeenCalledTimes(0);
  });
  test(`Subject.next, Subject.error, Subject.complete calls propagate adequately`, () => {
    for (const withError of [false, true]) {
      const subject = new Subject<void>();

      const o1 = Setup.observer();
      const o2 = Setup.observer();
      const o3 = Setup.observer();

      const subs1 = subject.subscribe(o1.observer);
      subject.subscribe(o2.observer);
      subject.next();
      subject.subscribe(o3.observer);
      subject.next();
      subs1.unsubscribe();
      subject.next();
      withError ? subject.error(new Error()) : subject.complete();
      subject.next();
      subject.complete();

      o1.assertObserverCalledTimes({
        start: 1,
        next: 2,
        error: 0,
        complete: 0
      });
      o2.assertObserverCalledTimes({
        start: 1,
        next: 3,
        error: withError ? 1 : 0,
        complete: withError ? 0 : 1
      });
      o3.assertObserverCalledTimes({
        start: 1,
        next: 2,
        error: withError ? 1 : 0,
        complete: withError ? 0 : 1
      });
    }
  });
  test(`Subject.next calls update Subject.value`, () => {
    const subject = new Subject<string>();
    subject.next('foo');

    expect(subject.value).toBe('foo');

    const subscription = subject.subscribe({ error: () => undefined });
    subject.next('bar');
    expect(subject.value).toBe('bar');

    subscription.unsubscribe();
    subject.next('baz');
    expect(subject.value).toBe('baz');
  });
  test(`Subject.next calls after termination don't update Subject.value`, () => {
    for (const withError of [false, true]) {
      const subject = new Subject<string>();
      subject.subscribe({ error: () => undefined });
      subject.next('foo');

      withError ? subject.error(new Error()) : subject.complete();
      subject.next('bar');
      expect(subject.value).toBe('foo');
    }
  });
  test(`Subject.next calls w/ or wo/ observers don't propagate to onStoppedNotification hook`, async () => {
    const fn = jest.fn();
    configure({ onStoppedNotification: fn });

    const subject = new Subject<void>();

    subject.next();
    expect(fn).toHaveBeenCalledTimes(0);

    subject.subscribe().unsubscribe();
    subject.next();
    subject.complete();
    expect(fn).toHaveBeenCalledTimes(0);
  });
  test(`Subject.next calls after termination propagate to onStoppedNotification hook`, async () => {
    for (const withError of [false, true]) {
      const fn = jest.fn();
      configure({ onStoppedNotification: fn, onUnhandledError: null });

      const s1 = new Subject<void>();
      withError ? s1.error(new Error()) : s1.complete();
      expect(fn).toHaveBeenCalledTimes(0);
      s1.next();
      expect(fn).toHaveBeenCalledTimes(1);

      const s2 = new Subject<void>();
      s2.subscribe({ error: () => undefined });
      s2.subscribe({ error: () => undefined });
      withError ? s2.error(new Error()) : s2.complete();
      expect(fn).toHaveBeenCalledTimes(1);
      s2.next();
      expect(fn).toHaveBeenCalledTimes(2);
    }
  });
  test(`Subject.error calls w/ observers don't propagate to onUnhandledError hook`, async () => {
    const fn = jest.fn();
    configure({ onUnhandledError: fn });

    const subject = new Subject<void>();
    subject.subscribe({ error: () => undefined });
    subject.error(new Error());

    expect(fn).toHaveBeenCalledTimes(0);
  });
  test(`Subject.error calls wo/ observers propagate to onUnhandledError hook`, async () => {
    const fn = jest.fn();
    configure({ onUnhandledError: fn });

    const s1 = new Subject<void>();
    const s2 = new Subject<void>();
    s2.subscribe({ error: () => undefined }).unsubscribe();

    s1.error(new Error());
    expect(fn).toHaveBeenCalledTimes(1);

    s2.error(new Error());
    expect(fn).toHaveBeenCalledTimes(2);
  });
  test(`Subject.error calls after termination propagate to onUnhandledError hook`, async () => {
    const fn = jest.fn();
    configure({ onUnhandledError: fn });

    const s1 = new Subject<void>();
    s1.complete();
    expect(fn).toHaveBeenCalledTimes(0);
    s1.error(new Error());
    expect(fn).toHaveBeenCalledTimes(1);

    const s2 = new Subject<void>();
    s2.subscribe({ error: () => undefined });
    s2.subscribe({ error: () => undefined });
    s2.complete();
    expect(fn).toHaveBeenCalledTimes(1);
    s2.error(new Error());
    expect(fn).toHaveBeenCalledTimes(2);
  });
  test(`Subject.constructor.of sets initial Subject.value`, () => {
    expect(Subject.of('foo').value).toBe('foo');
  });
  test(`Subject.constructor.of value is not emitted`, () => {
    const subject = Subject.of('foo');
    const { observer } = Setup.observer();

    subject.subscribe(observer);
    expect(observer.next).toHaveBeenCalledTimes(0);
  });
  test(`Subject.constructor.from options set initial Subject.value`, () => {
    const subject = Subject.from<string>([], { value: 'foo' });
    expect(subject.value).toBe('foo');
  });
  test(`Subject.constructor.from convertible values override initial Subject.value`, () => {
    const subject = Subject.from<string>(['bar', 'baz'], { value: 'foo' });
    expect(subject.value).toBe('baz');
  });
  test(`Subject.constructor.from merges w/ convertible`, async () => {
    for (const withError of [false, true]) {
      const { observable, assertObservableCalledTimes } = Setup.from(
        new Observable<string>((obs) => {
          obs.next('foo');
          Promise.resolve().then(() => {
            obs.next('bar');
            obs.next('baz');
          });
        })
      );

      const subject = Subject.from(observable);
      assertObservableCalledTimes({ subscriber: 1, teardown: 0 });

      const { observer, assertObserverCalledTimes } = Setup.observer();
      subject.subscribe(observer);
      subject.subscribe({ error: () => undefined });

      assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
      assertObserverCalledTimes({ start: 1, next: 0, error: 0, complete: 0 });

      subject.next('foobar');
      assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });

      await Promise.resolve();
      assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
      assertObserverCalledTimes({ start: 1, next: 3, error: 0, complete: 0 });

      withError ? subject.error(new Error()) : subject.complete();
      assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
      assertObserverCalledTimes({
        start: 1,
        next: 3,
        error: withError ? 1 : 0,
        complete: withError ? 0 : 1
      });
    }
  });
});

describe(`Observable behavior`, () => {
  test(`is ObservableLike`, () => {
    expect(isObservableLike(new Subject())).toBe(true);
  });
  test(`is ObservableCompatible`, () => {
    const instance = new Subject();
    expect(isObservableCompatible(instance)).toBe(true);

    const observable = instance[Symbol.observable]();
    expect(observable).toBeInstanceOf(Observable);
  });
  test(`can be subscribed and unsubscribed`, () => {
    expect(() => new Subject().subscribe().unsubscribe()).not.toThrow();
  });
  test(`Subscribe: errors when Observer is not empty, a function or an object`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const instance: any = new Subject();

    instance.subscribe(0);
    expect(errors).toHaveLength(1);
    instance.subscribe(false);
    expect(errors).toHaveLength(2);
    instance.subscribe('');
    expect(errors).toHaveLength(3);
  });
  test(`Subscribe: Doesn't error when Observer is empty, a function or an object`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const instance = new Subject();

    const subscriptions = [
      instance.subscribe(),
      instance.subscribe(null),
      instance.subscribe(undefined),
      instance.subscribe(() => undefined),
      instance.subscribe({})
    ];

    subscriptions.map((subscription) => subscription.unsubscribe());

    expect(errors).toHaveLength(0);
  });
  test(`Observer.start: errors when it fails`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const error = new Error('foo');

    const { observable, subscriber } = Setup.from(new Subject());
    const { observer } = Setup.observer();
    const subscription = observable.subscribe({
      ...observer,
      start() {
        observer.start();
        throw error;
      }
    });

    expect(errors[0]).toBe(error);
    expect(subscription.closed).toBe(false);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(observer.start).toHaveBeenCalledTimes(1);
  });
  test(`Observer.start: hooks properly unsubscribe on error`, () => {
    configure({
      onUnhandledError: (_, subscription) => subscription.unsubscribe()
    });

    const { observable, subscriber } = Setup.from(new Subject());
    const { observer } = Setup.observer();

    const subscription = observable.subscribe({
      ...observer,
      start: () => {
        observer.start();
        throw new Error();
      }
    });

    expect(subscription.closed).toBe(true);
    expect(subscriber).toHaveBeenCalledTimes(0);
    expect(observer.start).toHaveBeenCalledTimes(1);
  });

  test(`Observer.start: doesn't error when it succeeds`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const { observable, subscriber } = Setup.from(new Subject());
    const { observer } = Setup.observer();

    observable.subscribe(observer).unsubscribe();

    expect(errors).toHaveLength(0);
    expect(subscriber).toHaveBeenCalledTimes(1);
    expect(observer.start).toHaveBeenCalledTimes(1);
  });
  test(`Observer.start: receives a subscription`, () => {
    const { observable } = Setup.from(new Subject());
    const { observer } = Setup.observer();

    const subscription = observable.subscribe(observer);
    subscription.unsubscribe();

    expect(observer.start).toHaveBeenCalledWith(subscription);
    expect(subscription).toBeInstanceOf(Subscription);
  });
  test(`Observer.next: hooks properly unsubscribe on error`, () => {
    configure({
      onUnhandledError: (_, subscription) => subscription.unsubscribe()
    });

    const subject = new Subject<void>();
    const { observable, assertObservableCalledTimes } = Setup.from(subject);
    const { observer, assertObserverCalledTimes } = Setup.observer();

    const subscription = observable.subscribe({
      ...observer,
      next: () => {
        observer.next();
        throw new Error();
      }
    });

    subject.next();
    expect(subscription.closed).toBe(true);
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });
  });
  test(`Observer.next: errors when it fails`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const error = new Error('foo');
    const subject = new Subject<void>();
    const { observable, assertObservableCalledTimes } = Setup.from(subject);
    const { observer, assertObserverCalledTimes } = Setup.observer();

    const subscription = observable.subscribe({
      ...observer,
      next: () => {
        observer.next();
        throw error;
      }
    });

    subject.next();
    expect(errors[0]).toBe(error);
    expect(subscription.closed).toBe(false);
    assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
    assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });
  });
  test(`Observer.next: doesn't error when it succeeds`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const subject = new Subject<void>();
    const { observable, assertObservableCalledTimes } = Setup.from(subject);
    const { observer, assertObserverCalledTimes } = Setup.observer();

    const subscription = observable.subscribe(observer);
    subject.next();

    expect(subscription.closed).toBe(false);
    assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
    assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });

    subscription.unsubscribe();
    expect(errors).toHaveLength(0);
    expect(subscription.closed).toBe(true);
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });
  });

  test(`Observer.error: errors when it fails`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const error = new Error('foo');
    const subject = new Subject<void>();
    const { observable, assertObservableCalledTimes } = Setup.from(subject);
    const { observer, assertObserverCalledTimes } = Setup.observer();
    const subscription = observable.subscribe({
      ...observer,
      error: (err) => {
        observer.error();
        throw err;
      }
    });

    subject.error(error);
    expect(errors[0]).toBe(error);
    expect(subscription.closed).toBe(true);
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
  });
  test(`Observer.error: errors after it's closed`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const values = [new Error('foo'), new Error('bar'), new Error('baz')];
    const subject = new Subject<void>();
    const { observable, assertObservableCalledTimes } = Setup.from(subject);
    const { observer, assertObserverCalledTimes } = Setup.observer();

    const subscription = observable.subscribe(observer);
    subject.error(new Error());
    subject.error(values[0]);
    subject.error(values[1]);
    subject.error(values[2]);

    expect(subscription.closed).toBe(true);
    expect(errors).toEqual(values);
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
  });
  test(`Observer.error: errors when there's no listener`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const error = new Error('foo');
    const subject = new Subject<void>();
    const { observable, assertObservableCalledTimes } = Setup.from(subject);
    const { observer, assertObserverCalledTimes } = Setup.observer();

    const subscription = observable.subscribe({
      ...observer,
      error: undefined
    });

    subject.error(error);
    expect(errors[0]).toBe(error);
    expect(subscription.closed).toBe(true);
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    assertObserverCalledTimes({ start: 1, next: 0, error: null, complete: 0 });
  });
  test(`Observer.error: doesn't error when it succeeds and there's a listener`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const subject = new Subject<void>();
    const { observable, assertObservableCalledTimes } = Setup.from(subject);
    const { observer, assertObserverCalledTimes } = Setup.observer();

    const subscription = observable.subscribe(observer);
    subject.error(new Error());

    expect(errors).toHaveLength(0);
    expect(subscription.closed).toBe(true);
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
  });
  test(`Observer.complete: rejects when it fails`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const error = new Error('foo');
    const subject = new Subject<void>();
    const { observable, assertObservableCalledTimes } = Setup.from(subject);
    const { observer, assertObserverCalledTimes } = Setup.observer();

    const subscription = observable.subscribe({
      ...observer,
      complete: () => {
        observer.complete();
        throw error;
      }
    });

    subject.complete();
    expect(errors[0]).toBe(error);
    expect(subscription.closed).toBe(true);
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    assertObserverCalledTimes({ start: 1, next: 0, error: 0, complete: 1 });
  });
  test(`Observer.complete: doesn't error when it succeeds`, () => {
    const errors: Error[] = [];
    configure({ onUnhandledError: (err) => errors.push(err) });

    const subject = new Subject<void>();
    const { observable, assertObservableCalledTimes } = Setup.from(subject);
    const { observer, assertObserverCalledTimes } = Setup.observer();

    const subscription = observable.subscribe(observer);
    subject.complete();
    subject.complete();

    expect(errors).toHaveLength(0);
    expect(subscription.closed).toBe(true);
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    assertObserverCalledTimes({ start: 1, next: 0, error: 0, complete: 1 });
  });
});
