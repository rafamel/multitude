import assert from 'node:assert';
import { test } from '@jest/globals';
import { into } from 'pipettes';

import { Observable, map } from '@push';

test(`succeeds`, () => {
  const obs = into(
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
