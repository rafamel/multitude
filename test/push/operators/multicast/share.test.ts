import { test, expect, describe } from '@jest/globals';
import { wait } from 'promist';
import { share, SharePolicy } from '@push';
import { Setup } from '../../../setup';

const policies: SharePolicy[] = ['keep-open', 'keep-closed', 'on-demand'];

describe(`no subscription`, () => {
  test(`subscriber and teardown are not called on initialization`, () => {
    for (const policy of [...policies, null]) {
      const { assertObservableCalledTimes } = Setup.observable(
        { error: false },
        policy ? share({ policy }) : share()
      );

      assertObservableCalledTimes({ subscriber: 0, teardown: 0 });
    }
  });
});

describe(`first subscription`, () => {
  test(`subscriber is called`, () => {
    for (const policy of policies) {
      const { observable, assertObservableCalledTimes } = Setup.observable(
        { error: false },
        share({ policy })
      );

      observable.subscribe({ error: () => undefined });
      assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
    }
  });
  test(`teardown is called on error/complete`, async () => {
    for (const policy of policies) {
      for (const withError of [false, true]) {
        const { observable, termination, assertObservableCalledTimes } =
          Setup.observable({ error: withError }, share({ policy }));

        const subs1 = observable.subscribe({ error: () => undefined });

        await wait(termination);
        expect(subs1.closed).toBe(true);
        assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
      }
    }
  });
  test(`observer calls propagate`, async () => {
    for (const policy of policies) {
      for (const withError of [false, true]) {
        const { observable, timeline } = Setup.observable(
          { error: withError },
          share({ policy })
        );
        const { observer, assertObserverCalledTimes } = Setup.observer();

        observable.subscribe(observer);
        for (const { ms, values, end } of timeline) {
          await wait(ms.add);
          assertObserverCalledTimes({
            start: 1,
            next: values.total.length,
            error: withError ? end : 0,
            complete: withError ? 0 : end
          });
        }
      }
    }
  });
});

describe(`further subscriptions, wo/ unsubscribe`, () => {
  test(`subscriber is not called on resubscription`, () => {
    for (const policy of policies) {
      const { observable, assertObservableCalledTimes } = Setup.observable(
        { error: false },
        share({ policy })
      );

      observable.subscribe({ error: () => undefined });
      observable.subscribe({ error: () => undefined });
      assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
    }
  });
  test(`subscriber is not called after error/complete`, async () => {
    for (const policy of policies) {
      for (const withError of [false, true]) {
        const { observable, termination, assertObservableCalledTimes } =
          Setup.observable({ error: withError }, share({ policy }));

        observable.subscribe({ error: () => undefined });
        await wait(termination);

        observable.subscribe({ error: () => undefined });
        assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
      }
    }
  });
  test(`teardown is called once on error/complete`, async () => {
    for (const policy of policies) {
      for (const withError of [false, true]) {
        const { observable, termination, assertObservableCalledTimes } =
          Setup.observable({ error: withError }, share({ policy }));

        observable.subscribe({ error: () => undefined });
        observable.subscribe({ error: () => undefined });

        await wait(termination);
        assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
      }
    }
  });
  test(`subscriptions after error/complete immediately error/complete`, async () => {
    for (const policy of policies) {
      for (const withError of [false, true]) {
        const { observable, termination } = Setup.observable(
          { error: withError },
          share({ policy })
        );

        observable.subscribe({ error: () => undefined });
        await wait(termination);

        const { observer, assertObserverCalledTimes } = Setup.observer();
        observable.subscribe(observer);
        assertObserverCalledTimes({
          start: 1,
          next: 0,
          error: withError ? 1 : 0,
          complete: withError ? 0 : 1
        });
      }
    }
  });
  test(`observer calls propagate, wo/ replay`, async () => {
    for (const policy of policies) {
      for (const withError of [false, true]) {
        const { observable, timeline } = Setup.observable(
          { error: withError },
          share({ policy })
        );
        observable.subscribe({ error: () => undefined });

        timeline.shift();
        const one = timeline.shift();
        await wait(one?.ms.total || null);

        const o2 = Setup.observer();
        observable.subscribe(o2.observer);

        for (const { ms, values, end } of timeline) {
          await wait(ms.add);
          o2.assertObserverCalledTimes({
            start: 1,
            next: values.total.length - (one?.values.total.length || 0),
            error: withError ? end : 0,
            complete: withError ? 0 : end
          });
        }
      }
    }
  });
  test(`observer calls propagate, w/ replay`, async () => {
    for (const policy of policies) {
      for (const withError of [false, true]) {
        const { observable, timeline } = Setup.observable(
          { error: withError },
          share({ policy, replay: 2 })
        );
        observable.subscribe({ error: () => undefined });

        timeline.shift();
        const one = timeline.shift();
        await wait(one?.ms.total || null);

        const o2 = Setup.observer();
        observable.subscribe(o2.observer);

        o2.assertObserverCalledTimes({
          start: 1,
          next: 2,
          error: 0,
          complete: 0
        });

        for (const { ms, values, end } of timeline) {
          await wait(ms.add);
          o2.assertObserverCalledTimes({
            start: 1,
            next: 2 + values.total.length - (one?.values.total.length || 0),
            error: withError ? end : 0,
            complete: withError ? 0 : end
          });
        }
      }
    }
  });
});

describe(`further subscriptions, w/ unsubscribe`, () => {
  test(`keep-open: subscriber is not called on resubscription`, () => {
    const { observable, assertObservableCalledTimes } = Setup.observable(
      { error: false },
      share({ policy: 'keep-open' })
    );

    observable.subscribe({ error: () => undefined }).unsubscribe();
    observable.subscribe({ error: () => undefined });

    assertObservableCalledTimes({ subscriber: 1, teardown: 0 });
  });
  test(`keep-open: subscriber is not called after error/complete`, async () => {
    for (const withError of [false, true]) {
      const { observable, termination, assertObservableCalledTimes } =
        Setup.observable({ error: withError }, share({ policy: 'keep-open' }));

      observable.subscribe({ error: () => undefined }).unsubscribe();
      await wait(termination);
      observable.subscribe({ error: () => undefined });

      assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    }
  });
  test(`keep-open: teardown is called once on error/complete`, async () => {
    for (const withError of [false, true]) {
      const { observable, termination, assertObservableCalledTimes } =
        Setup.observable({ error: withError }, share({ policy: 'keep-open' }));

      observable.subscribe({ error: () => undefined }).unsubscribe();
      await wait(termination);
      observable.subscribe({ error: () => undefined });
      await wait(termination);

      assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    }
  });
  test(`keep-open: subscriptions after error/complete immediately error/complete`, async () => {
    for (const withError of [false, true]) {
      const { observable, termination } = Setup.observable(
        { error: withError },
        share({ policy: 'keep-open' })
      );

      observable.subscribe({ error: () => undefined }).unsubscribe();
      await wait(termination);

      const { observer, assertObserverCalledTimes } = Setup.observer();
      observable.subscribe(observer);
      assertObserverCalledTimes({
        start: 1,
        next: 0,
        error: withError ? 1 : 0,
        complete: withError ? 0 : 1
      });
    }
  });
  test(`keep-open: observer calls propagate, wo/ replay`, async () => {
    for (const withError of [false, true]) {
      const { observable, timeline } = Setup.observable(
        { error: withError },
        share({ policy: 'keep-open' })
      );

      observable.subscribe({ error: () => undefined }).unsubscribe();

      timeline.shift();
      const one = timeline.shift();
      await wait(one?.ms.total || null);

      const o2 = Setup.observer();
      observable.subscribe(o2.observer);

      for (const { ms, values, end } of timeline) {
        await wait(ms.add);
        o2.assertObserverCalledTimes({
          start: 1,
          next: values.total.length - (one?.values.total.length || 0),
          error: withError ? end : 0,
          complete: withError ? 0 : end
        });
      }
    }
  });
  test(`keep-open: observer calls propagate, w/ replay`, async () => {
    for (const withError of [false, true]) {
      const { observable, timeline } = Setup.observable(
        { error: withError },
        share({ policy: 'keep-open', replay: 2 })
      );
      observable.subscribe({ error: () => undefined }).unsubscribe();

      timeline.shift();
      const one = timeline.shift();
      await wait(one?.ms.total || null);

      const o2 = Setup.observer();
      observable.subscribe(o2.observer);

      o2.assertObserverCalledTimes({
        start: 1,
        next: 2,
        error: 0,
        complete: 0
      });

      for (const { ms, values, end } of timeline) {
        await wait(ms.add);
        o2.assertObserverCalledTimes({
          start: 1,
          next: 2 + values.total.length - (one?.values.total.length || 0),
          error: withError ? end : 0,
          complete: withError ? 0 : end
        });
      }
    }
  });
  test(`keep-closed: teardown is immediately called`, async () => {
    const { observable, assertObservableCalledTimes } = Setup.observable(
      { error: false },
      share({ policy: 'keep-closed' })
    );

    observable.subscribe({ error: () => undefined }).unsubscribe();
    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  });
  test(`keep-closed: subscriber is not called on resubscription`, () => {
    const { observable, assertObservableCalledTimes } = Setup.observable(
      { error: false },
      share({ policy: 'keep-closed' })
    );

    observable.subscribe({ error: () => undefined }).unsubscribe();
    observable.subscribe({ error: () => undefined });

    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  });
  test(`keep-closed: subscriptions after error/complete immediately error/complete`, async () => {
    for (const withError of [false, true]) {
      const { observable, termination } = Setup.observable(
        { error: withError },
        share({ policy: 'keep-closed' })
      );

      const subscription = observable.subscribe({ error: () => undefined });
      await wait(termination);
      subscription.unsubscribe();

      const { observer, assertObserverCalledTimes } = Setup.observer();
      observable.subscribe(observer);
      assertObserverCalledTimes({
        start: 1,
        next: 0,
        error: withError ? 1 : 0,
        complete: withError ? 0 : 1
      });
    }
  });
  test(`keep-closed: immediately errors`, async () => {
    const { observable } = Setup.observable(
      { error: false },
      share({ policy: 'keep-closed' })
    );

    observable.subscribe({ error: () => undefined }).unsubscribe();

    const o2 = Setup.observer();
    observable.subscribe(o2.observer);

    o2.assertObserverCalledTimes({
      start: 1,
      next: 0,
      error: 1,
      complete: 0
    });
  });
  test(`on-demand: teardown is immediately called`, () => {
    const { observable, assertObservableCalledTimes } = Setup.observable(
      { error: false },
      share({ policy: 'on-demand' })
    );

    observable.subscribe({ error: () => undefined }).unsubscribe();

    assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
  });
  test(`on-demand: subscriber is called on resubscription`, () => {
    const { observable, assertObservableCalledTimes } = Setup.observable(
      { error: false },
      share({ policy: 'on-demand' })
    );

    observable.subscribe({ error: () => undefined }).unsubscribe();
    observable.subscribe({ error: () => undefined });

    assertObservableCalledTimes({ subscriber: 2, teardown: 1 });
  });
  test(`on-demand: subscriber is not called after error/complete`, async () => {
    for (const withError of [false, true]) {
      const { observable, termination, assertObservableCalledTimes } =
        Setup.observable({ error: withError }, share({ policy: 'on-demand' }));

      const subscription = observable.subscribe({ error: () => undefined });
      await wait(termination);
      subscription.unsubscribe();
      observable.subscribe({ error: () => undefined });

      assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    }
  });
  test(`on-demand: teardown is called once on error/complete`, async () => {
    for (const withError of [false, true]) {
      const { observable, termination, assertObservableCalledTimes } =
        Setup.observable({ error: withError }, share({ policy: 'on-demand' }));

      const subscription = observable.subscribe({ error: () => undefined });
      await wait(termination);
      subscription.unsubscribe();
      observable.subscribe({ error: () => undefined });
      await wait(termination);

      assertObservableCalledTimes({ subscriber: 1, teardown: 1 });
    }
  });
  test(`on-demand: subscriptions after error/complete immediately error/complete`, async () => {
    for (const withError of [false, true]) {
      const { observable, termination } = Setup.observable(
        { error: withError },
        share({ policy: 'on-demand' })
      );

      const subscription = observable.subscribe({ error: () => undefined });
      await wait(termination);
      subscription.unsubscribe();

      const { observer, assertObserverCalledTimes } = Setup.observer();
      observable.subscribe(observer);
      assertObserverCalledTimes({
        start: 1,
        next: 0,
        error: withError ? 1 : 0,
        complete: withError ? 0 : 1
      });
    }
  });
  test(`on-demand: observer calls propagate, wo/ replay`, async () => {
    for (const withError of [false, true]) {
      const { observable, timeline } = Setup.observable(
        { error: withError },
        share({ policy: 'on-demand' })
      );

      observable.subscribe({ error: () => undefined }).unsubscribe();

      const o2 = Setup.observer();
      observable.subscribe(o2.observer);

      for (const { ms, values, end } of timeline) {
        await wait(ms.add);
        o2.assertObserverCalledTimes({
          start: 1,
          next: values.total.length,
          error: withError ? end : 0,
          complete: withError ? 0 : end
        });
      }
    }
  });
  test(`on-demand: observer calls propagate, w/ replay`, async () => {
    for (const withError of [false, true]) {
      const { observable, timeline } = Setup.observable(
        { error: withError },
        share({ policy: 'on-demand', replay: 2 })
      );

      observable.subscribe({ error: () => undefined }).unsubscribe();

      const o2 = Setup.observer();
      observable.subscribe(o2.observer);

      for (const { ms, values, end } of timeline) {
        await wait(ms.add);
        o2.assertObserverCalledTimes({
          start: 1,
          next: values.total.length,
          error: withError ? end : 0,
          complete: withError ? 0 : end
        });
      }
    }
  });
});
