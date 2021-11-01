import { expect, test } from '@jest/globals';
import { Util } from '@helpers';

test(`Util.noop`, () => {
  expect(Util.noop()).toBe(undefined);
});
test(`Util.throws`, () => {
  const err = Error('foo');

  expect(() => Util.throws(err)).toThrowError(err);
});
