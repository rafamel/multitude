import { from, Observable, Subject } from '@push';
import assert from 'assert';
import 'symbol-observable';

test(`succeeds w/ Observable`, () => {
  const observable = new Observable(() => undefined);

  assert(from(observable) === observable);
});
test(`succeeds w/ Subject`, () => {
  const subject = new Subject();
  const observable = from(subject);

  assert(observable !== subject);
  assert(observable instanceof Observable);
  assert(!(observable instanceof Subject));

  const values: any[] = [];
  observable.subscribe((value) => values.push(value));
  subject.next(1);
  subject.next(2);
  subject.complete();

  assert.deepStrictEqual(values, [1, 2]);
});
test(`succeeds w/ Observable`, () => {
  const observable = from(
    new Observable((obs) => {
      obs.next(1);
      obs.next(2);
      obs.complete();
    })
  );

  assert(observable instanceof Observable);

  const values: any[] = [];
  observable.subscribe((value) => values.push(value));
  assert.deepStrictEqual(values, [1, 2]);
});
test(`succeeds w/ Compatible`, () => {
  const obs = new Observable((obs) => {
    obs.next(1);
    obs.next(2);
    obs.complete();
  });
  const observable = from({
    [Symbol.observable]() {
      return obs;
    }
  });

  assert(observable instanceof Observable);

  const values: any[] = [];
  observable.subscribe((value) => values.push(value));
  assert.deepStrictEqual(values, [1, 2]);
});
test(`fails w/ invalid Compatible`, () => {
  let error: any;
  try {
    from({ [Symbol.observable]: () => null as any });
  } catch (err) {
    error = err;
  }

  assert(error);
  assert(error instanceof TypeError);
});
test(`succeeds w/ Like`, () => {
  const obs = new Observable((obs) => {
    obs.next(1);
    obs.next(2);
    obs.complete();
  });

  const observable = from({
    subscribe(...arr: any[]) {
      return obs.subscribe(...arr);
    }
  });

  assert(observable instanceof Observable);

  const values: any[] = [];
  observable.subscribe((value) => values.push(value));
  assert.deepStrictEqual(values, [1, 2]);
});
test(`succeeds w/ Iterable`, () => {
  const observable = from([1, 2]);

  assert(observable instanceof Observable);

  const values: any[] = [];
  observable.subscribe((value) => values.push(value));
  assert.deepStrictEqual(values, [1, 2]);
});
