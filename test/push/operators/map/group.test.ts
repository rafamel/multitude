import assert from 'node:assert';
import { test } from '@jest/globals';

import { Observable, push, group } from '@push';

test(`succeeds`, () => {
  const obs = push(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.next(3);
      obs.next(4);
      obs.next(5);
      obs.next(6);
      obs.next(7);
    }),
    group(3)
  );

  const values: any[] = [];
  obs.subscribe((x) => values.push(x));

  assert.deepStrictEqual(values, [
    [1, 2, 3],
    [4, 5, 6]
  ]);
});
