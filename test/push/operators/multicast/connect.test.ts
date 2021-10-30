import { test } from '@jest/globals';
import { connect } from '@push';
import { setupObservable, setupObserver, waitTime } from '../../../setup';

test(`subscriber is called on initialization`, () => {
  const { assertObservableCalledTimes } = setupObservable(
    { error: false },
    connect()
  );

  assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
});
test(`teardown is called on error/complete`, async () => {
  for (const withError of [false, true]) {
    const { termination, assertObservableCalledTimes } = setupObservable(
      { error: withError },
      connect()
    );

    await waitTime(termination);
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  }
});
test(`subscriber is not called on subscription`, () => {
  const { observable, assertObservableCalledTimes } = setupObservable(
    { error: false },
    connect()
  );

  observable.subscribe({ error: () => undefined }).unsubscribe();
  observable.subscribe({ error: () => undefined });
  assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
});
test(`subscriber is not called after error/complete`, async () => {
  for (const withError of [false, true]) {
    const { observable, termination, assertObservableCalledTimes } =
      setupObservable({ error: withError }, connect());
    await waitTime(termination);

    observable.subscribe({ error: () => undefined });
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  }
});
test(`teardown is called once on error/complete`, async () => {
  for (const withError of [false, true]) {
    const { observable, termination, assertObservableCalledTimes } =
      setupObservable({ error: withError }, connect());

    observable.subscribe({ error: () => undefined });
    observable.subscribe({ error: () => undefined });

    await waitTime(termination);
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  }
});
test(`subscriptions after error/complete immediately error/complete`, async () => {
  for (const withError of [false, true]) {
    const { observable, termination } = setupObservable(
      { error: withError },
      connect()
    );

    await waitTime(termination);
    const { observer, assertObserverCalledTimes } = setupObserver();

    observable.subscribe(observer);
    assertObserverCalledTimes({
      start: 1,
      next: 0,
      error: withError ? 1 : 0,
      complete: withError ? 0 : 1
    });
  }
});
test(`observer calls propagate, wo/ replay`, async () => {
  for (const withError of [false, true]) {
    const { observable, timeline } = setupObservable(
      { error: withError },
      connect()
    );

    const { observer, assertObserverCalledTimes } = setupObserver();
    observable.subscribe({ error: () => undefined }).unsubscribe();
    observable.subscribe(observer);

    let nSyncValues = 0;
    for (const { ms, values, end } of timeline) {
      if (ms.total === null) {
        nSyncValues += values.add.length;
      } else {
        await waitTime(ms.add);
        assertObserverCalledTimes({
          start: 1,
          next: values.total.length - nSyncValues,
          error: withError ? end : 0,
          complete: withError ? 0 : end
        });
      }
    }
  }
});
test(`observer calls propagate, w/ replay`, async () => {
  for (const withError of [false, true]) {
    const { observable, timeline } = setupObservable(
      { error: withError },
      connect({ replay: 2 })
    );

    const { observer, assertObserverCalledTimes } = setupObserver();
    observable.subscribe({ error: () => undefined }).unsubscribe();
    observable.subscribe(observer);

    let nSyncValues = 0;
    for (const { ms, values, end } of timeline) {
      if (ms.total === null) {
        nSyncValues += values.add.length;
      } else {
        await waitTime(ms.add);
        assertObserverCalledTimes({
          start: 1,
          next: values.total.length - Math.max(0, nSyncValues - 2),
          error: withError ? end : 0,
          complete: withError ? 0 : end
        });
      }
    }
  }
});
