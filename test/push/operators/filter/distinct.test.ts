import assert from 'node:assert';
import { test } from '@jest/globals';

import { Observable, push, distinct } from '@push';

test(`succeeds w/ default selector`, () => {
  const arr = [1, {}, 'b', {}];
  const obs = push(
    new Observable<any>((obs) => {
      obs.next(arr[0]);
      obs.next(arr[1]);
      obs.next(arr[1]);
      obs.next(arr[2]);
      obs.next(arr[3]);
      obs.next(arr[1]);
      obs.next(arr[3]);
      obs.next(arr[0]);
    }),
    distinct()
  );

  const values: any[] = [];
  obs.subscribe((x) => values.push(x));

  assert.deepStrictEqual(values, arr);
});
test(`succeeds w/ custom selector (1)`, () => {
  const arr = [1, {}, 'b', {}];
  const obs = push(
    new Observable<any>((obs) => {
      obs.next(arr[0]);
      obs.next(arr[1]);
      obs.next(arr[1]);
      obs.next(arr[2]);
      obs.next(arr[3]);
      obs.next(arr[1]);
      obs.next(arr[3]);
      obs.next(arr[0]);
    }),
    distinct((x, i) => String(x) + String(i))
  );

  const values: any[] = [];
  obs.subscribe((x) => values.push(x));

  assert.deepStrictEqual(values, [
    arr[0],
    arr[1],
    arr[1],
    arr[2],
    arr[3],
    arr[1],
    arr[3],
    arr[0]
  ]);
});
test(`succeeds w/ custom selector (2)`, () => {
  const arr = [1, {}, 'b', {}];
  const obs = push(
    new Observable<any>((obs) => {
      obs.next(arr[0]);
      obs.next(arr[1]);
      obs.next(arr[1]);
      obs.next(arr[2]);
      obs.next(arr[3]);
      obs.next(arr[1]);
      obs.next(arr[3]);
      obs.next(arr[0]);
    }),
    distinct((x) => String(x))
  );

  const values: any[] = [];
  obs.subscribe((x) => values.push(x));

  assert.deepStrictEqual(values, [arr[0], arr[1], arr[2]]);
});
