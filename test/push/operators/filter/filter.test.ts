import assert from 'node:assert';
import { test } from '@jest/globals';
import { into } from 'pipettes';

import { Observable, filter } from '@push';

test(`succeeds`, () => {
  const obs = into(
    new Observable<number>((obs) => {
      obs.next(1);
      obs.next(2);
      obs.next(3);
      obs.next(4);
    }),
    filter((x: number, i) => typeof x === 'number' && i !== 2)
  );

  const values: any[] = [];
  obs.subscribe((x) => values.push(x));

  assert.deepStrictEqual(values, [1, 2, 4]);
});
