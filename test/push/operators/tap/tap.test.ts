import assert from 'node:assert';
import { test } from '@jest/globals';

import { Observable, Subscription, push, tap } from '@push';

test(`Observer.start`, () => {
  let pass = false;

  const obs = push(
    new Observable<number>(() => undefined),
    tap({
      start(subscription) {
        pass = subscription instanceof Subscription;
      }
    })
  );

  obs.subscribe();
  assert(pass);
});
test(`Observer.next`, () => {
  const times = [0, 0];
  const values: [any[], any[]] = [[], []];

  const obs = push(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.next(3);
    }),
    tap({
      next(x: number) {
        times[0]++;
        values[0].push(x);
      }
    })
  );

  const subscription = obs.subscribe((x) => {
    times[1]++;
    values[1].push(x);
  });

  assert.deepStrictEqual(times, [3, 3]);
  assert.deepStrictEqual(values, [
    [1, 2, 3],
    [1, 2, 3]
  ]);

  subscription.unsubscribe();
  assert.deepStrictEqual(times, [3, 3]);
});
test(`Observer.error`, () => {
  const times = [0, 0];
  const values: [Error[], Error[]] = [[], []];

  const error = new Error('foo');
  const obs = push(
    new Observable<number>((obs) => {
      obs.error(error);
    }),
    tap({
      error(err) {
        times[0]++;
        values[0].push(err);
      }
    })
  );

  obs.subscribe({
    error: (x) => {
      times[1]++;
      values[1].push(x);
    }
  });

  assert.deepStrictEqual(times, [1, 1]);
  assert.deepStrictEqual(values, [[error], [error]]);
});
test(`Observer.complete`, () => {
  const times = [0, 0];

  const obs = push(
    new Observable<number>((obs) => {
      obs.complete();
    }),
    tap({
      complete: () => times[0]++
    })
  );

  obs.subscribe({ complete: () => times[1]++ });

  assert.deepStrictEqual(times, [1, 1]);
});
