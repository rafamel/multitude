import assert from 'node:assert';
import { test } from '@jest/globals';

import { interval } from '@push';

test(`succeeds w/ every`, async () => {
  const obs = interval(300);

  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value)
  });

  await new Promise((resolve) => setTimeout(resolve, 1650));
  subscription.unsubscribe();

  assert.deepStrictEqual(values, [0, 1, 2, 3, 4]);
});
test(`succeeds w/ every, cancel (no cancellation)`, async () => {
  const controller = new AbortController();
  const obs = interval(300, { cancel: controller.signal });

  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value)
  });

  await new Promise((resolve) => setTimeout(resolve, 2250));
  subscription.unsubscribe();

  assert.deepStrictEqual(values, [0, 1, 2, 3, 4, 5, 6]);
});
test(`succeeds w/ every, cancel (pre sync cancellation)`, async () => {
  const controller = new AbortController();

  controller.abort();
  const obs = interval(300, { cancel: controller.signal });

  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value)
  });

  await new Promise((resolve) => setTimeout(resolve, 450));
  subscription.unsubscribe();

  assert.deepStrictEqual(values, []);
});
test(`succeeds w/ every, cancel (post sync cancellation)`, async () => {
  const controller = new AbortController();

  const obs = interval(300, { cancel: controller.signal });
  controller.abort();

  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value)
  });

  await new Promise((resolve) => setTimeout(resolve, 450));
  subscription.unsubscribe();

  assert.deepStrictEqual(values, []);
});
test(`succeeds w/ every, cancel (async cancellation)`, async () => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 1650);

  const obs = interval(300, { cancel: controller.signal });

  const values: any[] = [];
  const subscription = obs.subscribe({
    next: (value) => values.push(value)
  });

  await new Promise((resolve) => setTimeout(resolve, 2250));
  subscription.unsubscribe();

  assert.deepStrictEqual(values, [0, 1, 2, 3, 4]);
});
