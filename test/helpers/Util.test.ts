import assert from 'assert';
import { test } from '@jest/globals';
import { Util } from '@helpers';

test(`Util.noop`, () => {
  assert(Util.noop() === undefined);
});
test(`Util.throws`, () => {
  const err = Error('foo');

  let error: any = {};
  try {
    Util.throws(err);
  } catch (err) {
    error = err;
  }

  assert(error === err);
});
