import assert from 'node:assert';
import { test } from '@jest/globals';

import { interval } from '@push';
import { Util } from '@helpers';

test(`succeeds wo/ arguments`, async () => {
  const obs = interval();

  let errorCalled = false;
  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value),
    error: () => (errorCalled = true)
  });

  await new Promise((resolve) => setTimeout(resolve, 100));
  subscription.unsubscribe();

  assert(!errorCalled);
  assert(values[0] === 0);
});
test(`succeeds w/ every`, async () => {
  const obs = interval(300);

  let errorCalled = false;
  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value),
    error: () => (errorCalled = true)
  });

  await new Promise((resolve) => setTimeout(resolve, 1650));
  subscription.unsubscribe();

  assert(!errorCalled);
  assert.deepStrictEqual(values, [0, 1, 2, 3, 4]);
});
test(`succeeds w/ every, cancel (callback success)`, async () => {
  const obs = interval({ every: 300, cancel: (i) => i >= 4 });

  let errorCalled = false;
  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value),
    error: () => (errorCalled = true)
  });

  await new Promise((resolve) => setTimeout(resolve, 2250));
  subscription.unsubscribe();

  assert(!errorCalled);
  assert.deepStrictEqual(values, [0, 1, 2, 3, 4]);
});
test(`succeeds w/ every, cancel (callback failure)`, async () => {
  const obs = interval({
    every: 300,
    cancel: () => Util.throws(new Error('foo'))
  });

  let errorCalled = false;
  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value),
    error: () => (errorCalled = true)
  });

  await new Promise((resolve) => setTimeout(resolve, 450));
  subscription.unsubscribe();

  assert(errorCalled);
  assert.deepStrictEqual(values, [0]);
});
test(`succeeds w/ every, cancel (Promise resolution)`, async () => {
  const obs = interval({
    every: 300,
    cancel: new Promise((resolve) => setTimeout(resolve, 1650))
  });

  let errorCalled = false;
  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value),
    error: () => (errorCalled = true)
  });

  await new Promise((resolve) => setTimeout(resolve, 2250));
  subscription.unsubscribe();

  assert(!errorCalled);
  assert.deepStrictEqual(values, [0, 1, 2, 3, 4]);
});
test(`succeeds w/ every, cancel (Promise rejection)`, async () => {
  const obs = interval({
    every: 300,
    // eslint-disable-next-line promise/param-names
    cancel: new Promise((_, reject) => {
      setTimeout(() => reject(new Error('foo')), 1650);
    })
  });

  let errorCalled = false;
  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value),
    error: () => (errorCalled = true)
  });

  await new Promise((resolve) => setTimeout(resolve, 2250));
  subscription.unsubscribe();

  assert(errorCalled);
  assert.deepStrictEqual(values, [0, 1, 2, 3, 4]);
});
