import assert from 'node:assert';
import { test } from '@jest/globals';

import { Observable, push, take } from '@push';

test(`succeeds w/ count (1)`, () => {
  const obs = push(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.next(3);
      obs.next(4);
      obs.next(5);
      obs.next(6);
    }),
    take(3)
  );

  const values: any[] = [];
  const subscription = obs.subscribe((x) => values.push(x));

  assert(subscription.closed);
  assert.deepStrictEqual(values, [1, 2, 3]);
});
test(`succeeds w/ count (2)`, () => {
  const obs = push(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.next(3);
      obs.next(4);
      obs.next(5);
      obs.next(6);
    }),
    take(3)
  );

  const values: any[] = [];
  const subscription = obs.subscribe((x) => values.push(x));

  assert(subscription.closed);
  assert.deepStrictEqual(values, [1, 2, 3]);
});
test(`succeeds w/ while (value)`, () => {
  const obs = push(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.next(3);
      obs.next(4);
      obs.next(5);
      obs.next(6);
      obs.next(2);
      obs.next(1);
    }),
    take((x: number) => x < 3)
  );

  const values: any[] = [];
  const subscription = obs.subscribe((x) => values.push(x));

  assert(subscription.closed);
  assert.deepStrictEqual(values, [1, 2]);
});
test(`succeeds w/ while (index)`, () => {
  const obs = push(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.next(3);
      obs.next(4);
      obs.next(5);
      obs.next(6);
    }),
    take((_: any, i) => i < 3)
  );

  const values: any[] = [];
  const subscription = obs.subscribe((x) => values.push(x));

  assert(subscription.closed);
  assert.deepStrictEqual(values, [1, 2, 3]);
});
