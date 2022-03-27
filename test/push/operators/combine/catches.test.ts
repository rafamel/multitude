import assert from 'node:assert';
import { test } from '@jest/globals';
import { into } from 'pipettes';

import { catches, Observable } from '@push';

test(`non error flow succeeds`, async () => {
  let catchesCalled = false;

  const obs = into(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.complete();
    }),
    catches(() => {
      catchesCalled = true;
      return Observable.of(null);
    })
  );

  const values: any[] = [];
  const times = [0, 0, 0, 0];
  const subscription = obs.subscribe({
    start: () => times[0]++,
    next: (value) => {
      times[1]++;
      values.push(value);
    },
    error: () => times[2]++,
    complete: () => times[3]++
  });

  await Promise.resolve();
  assert(!catchesCalled);
  assert(subscription.closed);
  assert.deepStrictEqual(values, [1, 2]);
  assert.deepStrictEqual(times, [1, 2, 0, 1]);
});
test(`error flow succeeds, error finalization`, async () => {
  const errors = [new Error('foo'), new Error('bar')];

  const args: any[] = [];
  const teardownCalled = [false, false];
  let teardownCalledBeforeNextSubscription = false;
  const obs = into(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.error(errors[0]);
      return () => {
        teardownCalled[0] = true;
      };
    }),
    catches((reason, observable) => {
      args.push(reason, observable);
      return new Observable<number>((obs) => {
        if (teardownCalled[0]) {
          teardownCalledBeforeNextSubscription = true;
        }
        obs.next(3);
        obs.next(4);
        obs.error(errors[1]);
        return () => {
          teardownCalled[1] = true;
        };
      });
    })
  );

  let reason: any;
  const values: any[] = [];
  const times = [0, 0, 0, 0];
  const subscription = obs.subscribe({
    start: () => times[0]++,
    next: (value) => {
      times[1]++;
      values.push(value);
    },
    error: (err) => {
      times[2]++;
      reason = err;
    },
    complete: () => times[3]++
  });

  await Promise.resolve();
  assert(subscription.closed);
  assert(reason === errors[1]);
  assert.deepStrictEqual(values, [1, 2, 3, 4]);
  assert.deepStrictEqual(times, [1, 4, 1, 0]);
  assert.deepStrictEqual(teardownCalled, [true, true]);
  assert(teardownCalledBeforeNextSubscription);
});

test(`error flow succeeds, unsubscribe finalization`, async () => {
  const args: any[] = [];
  const teardownCalled = [false, false];
  const obs = into(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.error(new Error('foo'));
      return () => {
        teardownCalled[0] = true;
      };
    }),
    catches((reason, observable) => {
      args.push(reason, observable);
      return new Observable<number>((obs) => {
        obs.next(3);
        obs.next(4);
        return () => {
          teardownCalled[1] = true;
        };
      });
    })
  );

  const values: any[] = [];
  const times = [0, 0, 0, 0];
  const subscription = obs.subscribe({
    start: () => times[0]++,
    next: (value) => {
      times[1]++;
      values.push(value);
    },
    error: () => times[2]++,
    complete: () => times[3]++
  });

  await Promise.resolve();
  subscription.unsubscribe();

  assert(subscription.closed);
  assert.deepStrictEqual(times, [1, 4, 0, 0]);
  assert.deepStrictEqual(values, [1, 2, 3, 4]);
  assert.deepStrictEqual(teardownCalled, [true, true]);
});
