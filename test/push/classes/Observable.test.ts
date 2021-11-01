import { beforeEach, expect, test } from '@jest/globals';
import {
  Observable,
  isObservableCompatible,
  isObservableLike,
  Subscription,
  configure
} from '@push';
import { Util } from '@helpers';
import { Setup } from '../../setup';

beforeEach(() => configure(null));

test(`is ObservableLike`, () => {
  const instance = new Observable(() => undefined);
  expect(isObservableLike(instance)).toBe(true);
});
test(`is ObservableCompatible`, () => {
  const instance = new Observable(() => undefined);
  expect(isObservableCompatible(instance)).toBe(true);

  const observable = instance[Symbol.observable]();
  expect(observable).toBeInstanceOf(Observable);
});
test(`can be subscribed and unsubscribed`, () => {
  expect(() => {
    return new Observable(() => undefined).subscribe().unsubscribe();
  }).not.toThrow();
});
test(`Subscribe: errors when Observer is not empty, a function or an object`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const instance: any = new Observable(() => undefined);

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

  const instance = new Observable(() => undefined);

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
test(`Subscription.unsubscribe: errors when subscriber fails`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  new Observable(() => () => Util.throws(Error())).subscribe().unsubscribe();

  expect(errors).toHaveLength(1);
});
test(`Subscription.unsubscribe: doesn't error when subscriber succeeds`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  new Observable(() => () => undefined).subscribe().unsubscribe();

  expect(errors).toHaveLength(0);
});
test(`Observer.start: errors when it fails`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');

  const { observable, subscriber } = Setup.from(null);
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

  const { observable, subscriber } = Setup.from(null);
  const { observer } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    start: () => {
      observer.start();
      throw Error();
    }
  });

  expect(subscription.closed).toBe(true);
  expect(subscriber).toHaveBeenCalledTimes(0);
  expect(observer.start).toHaveBeenCalledTimes(1);
});
test(`Observer.start: doesn't error when it succeeds`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const { observable, subscriber } = Setup.from(null);
  const { observer } = Setup.observer();

  observable.subscribe(observer).unsubscribe();

  expect(errors).toHaveLength(0);
  expect(subscriber).toHaveBeenCalledTimes(1);
  expect(observer.start).toHaveBeenCalledTimes(1);
});
test(`Observer.start: receives a subscription`, () => {
  const { observable } = Setup.from(null);
  const { observer } = Setup.observer();

  const subscription = observable.subscribe(observer);
  subscription.unsubscribe();

  expect(observer.start).toHaveBeenCalledWith(subscription);
  expect(subscription).toBeInstanceOf(Subscription);
});
test(`Observer.next: hooks properly unsubscribe on error (sync)`, () => {
  configure({
    onUnhandledError: (_, subscription) => subscription.unsubscribe()
  });

  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => obs.next())
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    next: () => {
      observer.next();
      throw Error();
    }
  });

  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });
});
test(`Observer.next: hooks properly unsubscribe on error (async)`, async () => {
  configure({
    onUnhandledError: (_, subscription) => subscription.unsubscribe()
  });

  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      Promise.resolve().then(() => obs.next());
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    next: () => {
      observer.next();
      throw Error();
    }
  });

  assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 0, complete: 0 });

  await Promise.resolve();
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });
});
test(`Observer.next: errors when it fails (sync)`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => obs.next())
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    next: () => {
      observer.next();
      throw error;
    }
  });

  expect(errors[0]).toBe(error);
  expect(subscription.closed).toBe(false);
  assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
  assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });
});
test(`Observer.next: errors when it fails (async)`, async () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      Promise.resolve().then(() => obs.next());
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    next: () => {
      observer.next();
      throw Error();
    }
  });

  expect(errors).toHaveLength(0);
  assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 0, complete: 0 });
  await Promise.resolve();
  expect(errors).toHaveLength(1);
  expect(subscription.closed).toBe(false);
  assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
  assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });
});
test(`Observer.next: doesn't error when it succeeds (sync)`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => obs.next())
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe(observer);

  expect(subscription.closed).toBe(false);
  assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
  assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });

  subscription.unsubscribe();
  expect(errors).toHaveLength(0);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });
});
test(`Observer.next: doesn't error when it succeeds (async)`, async () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      Promise.resolve().then(() => obs.next());
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe(observer);

  await Promise.resolve();
  expect(subscription.closed).toBe(false);
  assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
  assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });

  subscription.unsubscribe();
  expect(errors).toHaveLength(0);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 1, error: 0, complete: 0 });
});
test(`Observer.error: errors when it fails (sync)`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => obs.error(error))
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();
  const subscription = observable.subscribe({
    ...observer,
    error: (err) => {
      observer.error();
      throw err;
    }
  });

  expect(errors[0]).toBe(error);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
});
test(`Observer.error: errors when it fails (async)`, async () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      Promise.resolve().then(() => obs.error(Error()));
      return () => Util.throws(new Error());
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    error: () => {
      observer.error();
      throw error;
    }
  });

  await Promise.resolve();
  expect(errors[0]).toBe(error);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
});
test(`Observer.error: errors after it's closed (sync)`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const values = [Error('foo'), Error('bar'), Error('baz')];
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      obs.error(Error());
      obs.error(values[0]);
      obs.error(values[1]);
      obs.error(values[2]);
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe(observer);

  expect(subscription.closed).toBe(true);
  expect(errors).toEqual(values);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
});
test(`Observer.error: errors after it's closed (async)`, async () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const values = [Error('foo'), Error('bar'), Error('baz')];
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      obs.error(Error());
      Promise.resolve().then(() => {
        obs.error(values[0]);
        obs.error(values[1]);
        obs.error(values[2]);
      });
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe(observer);

  await Promise.resolve();
  expect(subscription.closed).toBe(true);
  expect(errors).toEqual(values);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
});
test(`Observer.error: errors when there's no listener (sync)`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => obs.error(error))
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    error: undefined
  });

  expect(errors[0]).toBe(error);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: null, complete: 0 });
});
test(`Observer.error: errors when there's no listener (async)`, async () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      Promise.resolve().then(() => obs.error(error));
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    error: undefined
  });

  await Promise.resolve();
  expect(errors[0]).toBe(error);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: null, complete: 0 });
});
test(`Observer.error: doesn't error when it succeeds and there's a listener (sync)`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => obs.error(Error()))
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe(observer);

  expect(errors).toHaveLength(0);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
});
test(`Observer.error: doesn't error when it succeeds and there's a listener (async)`, async () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      Promise.resolve().then(() => obs.error(Error()));
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe(observer);

  await Promise.resolve();
  expect(errors).toHaveLength(0);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
});
test(`Observer.error: catches Subscriber error`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable(() => Util.throws(error))
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe(observer);

  expect(errors).toHaveLength(0);
  expect(subscription.closed).toBe(true);
  expect(observer.error).toHaveBeenCalledWith(error);
  assertObservableCalledTimes({ subscriber: 1, teardown: null });
  assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
});
test(`Observer.error: catches Subscriber error and errors on failure`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable(() => Util.throws(error))
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    error: (err) => {
      observer.error();
      throw err;
    }
  });

  expect(errors[0]).toBe(error);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: null });
  assertObserverCalledTimes({ start: 1, next: 0, error: 1, complete: 0 });
});
test(`Observer.error: catches Subscriber errors and errors when lacking listener`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable(() => Util.throws(error))
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    error: undefined
  });

  expect(errors[0]).toBe(error);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: null });
  assertObserverCalledTimes({ start: 1, next: 0, error: null, complete: 0 });
});
test(`Observer.complete: rejects when it fails (sync)`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => obs.complete())
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    complete: () => {
      observer.complete();
      throw error;
    }
  });

  expect(errors[0]).toBe(error);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 0, complete: 1 });
});
test(`Observer.complete: errors when it fails (async)`, async () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const error = Error('foo');
  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      Promise.resolve().then(() => obs.complete());
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe({
    ...observer,
    complete: () => {
      observer.complete();
      throw error;
    }
  });

  await Promise.resolve();
  expect(errors[0]).toBe(error);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 0, complete: 1 });
});
test(`Observer.complete: doesn't error when it succeeds (sync)`, () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      obs.complete();
      obs.complete();
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe(observer);

  expect(errors).toHaveLength(0);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 0, complete: 1 });
});
test(`Observer.complete: doesn't error when it succeeds (async)`, async () => {
  const errors: Error[] = [];
  configure({ onUnhandledError: (err) => errors.push(err) });

  const { observable, assertObservableCalledTimes } = Setup.from<void>(
    new Observable((obs) => {
      Promise.resolve().then(() => {
        obs.complete();
        obs.complete();
      });
    })
  );
  const { observer, assertObserverCalledTimes } = Setup.observer();

  const subscription = observable.subscribe(observer);

  await Promise.resolve();
  expect(errors).toHaveLength(0);
  expect(subscription.closed).toBe(true);
  assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  assertObserverCalledTimes({ start: 1, next: 0, error: 0, complete: 1 });
});
