import assert from 'node:assert';
import { test } from '@jest/globals';

import { Observable, push, map } from '@push';

test(`succeeds`, () => {
  const obs = push(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.next(3);
    }),
    map((x: number, i) => [x, i])
  );

  const values: any[] = [];
  obs.subscribe((x) => values.push(x));

  assert.deepStrictEqual(values, [
    [1, 0],
    [2, 1],
    [3, 2]
  ]);
});
