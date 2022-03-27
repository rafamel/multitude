import { test, expect } from '@jest/globals';
import 'symbol-observable';

import { Util } from '@helpers';
import { isObservableLike, isObservableCompatible } from '@push';

test(`isObservableLike`, () => {
  expect(isObservableLike(undefined)).toBe(false);
  expect(isObservableLike(null)).toBe(false);
  expect(isObservableLike(0)).toBe(false);
  expect(isObservableLike(true)).toBe(false);
  expect(isObservableLike('')).toBe(false);
  expect(isObservableLike(Util.noop)).toBe(false);
  expect(isObservableLike({})).toBe(false);
  expect(isObservableLike({ subscribe: {} })).toBe(false);
  expect(isObservableLike({ subscribe: Util.noop })).toBe(true);
});

test(`isObservableCompatible`, () => {
  expect(isObservableCompatible(undefined)).toBe(false);
  expect(isObservableCompatible(null)).toBe(false);
  expect(isObservableCompatible(0)).toBe(false);
  expect(isObservableCompatible(true)).toBe(false);
  expect(isObservableCompatible('')).toBe(false);
  expect(isObservableCompatible(Util.noop)).toBe(false);
  expect(isObservableCompatible({})).toBe(false);
  expect(isObservableCompatible({ [Symbol.observable]: {} })).toBe(false);
  expect(isObservableCompatible({ [Symbol.observable]: Util.noop })).toBe(true);
});
