/* eslint-disable  @typescript-eslint/explicit-function-return-type */
import { expect, jest } from '@jest/globals';
import { Observable } from '@push';

export function waitTime(ms: null | number): Promise<void> | void {
  return typeof ms === 'number'
    ? new Promise((resolve) => setTimeout(resolve, ms))
    : undefined;
}

export function setupObservable<T>(
  options: { error: boolean },
  projection: (obs: Observable<number>) => T
) {
  const fns = {
    subscriber: jest.fn(),
    teardown: jest.fn()
  };

  return {
    ...fns,
    termination: 50,
    timeline: [
      {
        ms: { add: null, total: null },
        values: { add: [1, 2], total: [1, 2] },
        end: 0
      },
      {
        ms: { add: 20, total: 20 },
        values: { add: [3, 4], total: [1, 2, 3, 4] },
        end: 0
      },
      {
        ms: { add: 15, total: 35 },
        values: { add: [5, 6], total: [1, 2, 3, 4, 5, 6] },
        end: 0
      },
      {
        ms: { add: 15, total: 50 },
        values: { add: [], total: [1, 2, 3, 4, 5, 6] },
        end: 1
      }
    ],
    observable: projection(
      new Observable((obs) => {
        fns.subscriber();
        obs.next(1);
        obs.next(2);

        const timeouts = [
          setTimeout(() => {
            obs.next(3);
            obs.next(4);
          }, 15),
          setTimeout(() => {
            obs.next(5);
            obs.next(6);
          }, 30),
          setTimeout(() => {
            if (options.error) {
              obs.error(new Error(`An error ocurred`));
            } else {
              obs.complete();
            }
          }, 45)
        ];

        return () => {
          fns.teardown();
          timeouts.forEach((timeout) => clearTimeout(timeout));
        };
      })
    ),
    assertObservableCalledTimes(times: {
      subscriber: number;
      teardown: number;
    }): void {
      expect(fns.subscriber).toHaveBeenCalledTimes(times.subscriber);
      expect(fns.teardown).toHaveBeenCalledTimes(times.teardown);
    }
  };
}

export function setupObserver() {
  const fns = {
    start: jest.fn(),
    next: jest.fn(),
    error: jest.fn(),
    complete: jest.fn()
  };
  return {
    observer: fns,
    assertObserverCalledTimes(times: {
      start: number;
      next: number;
      error: number;
      complete: number;
    }): void {
      expect(fns.start).toHaveBeenCalledTimes(times.start);
      expect(fns.next).toHaveBeenCalledTimes(times.next);
      expect(fns.error).toHaveBeenCalledTimes(times.error);
      expect(fns.complete).toHaveBeenCalledTimes(times.complete);
    }
  };
}
