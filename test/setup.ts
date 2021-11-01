/* eslint-disable  @typescript-eslint/explicit-function-return-type */
import { expect, jest } from '@jest/globals';
import { Observable } from '@push';

export class Setup {
  public static from<T>(observable: Observable<T> | null) {
    const fns = {
      subscriber: jest.fn(),
      teardown: jest.fn()
    };

    return {
      ...fns,
      observable: new Observable((obs) => {
        fns.subscriber();
        const subscription = observable ? observable.subscribe(obs) : null;
        return () => {
          fns.teardown();
          if (subscription) subscription.unsubscribe();
        };
      }),
      assertObservableCalledTimes(times: {
        subscriber: number | null;
        teardown: number | null;
      }): void {
        if (times.subscriber !== null) {
          expect(fns.subscriber).toHaveBeenCalledTimes(times.subscriber);
        }
        if (times.teardown !== null) {
          expect(fns.teardown).toHaveBeenCalledTimes(times.teardown);
        }
      }
    };
  }
  public static observable<T>(
    options: { error: boolean },
    projection: (obs: Observable<number>) => T
  ) {
    const { observable, ...other } = Setup.from(
      new Observable((obs) => {
        obs.next(1);
        obs.next(2);

        const timeouts = [
          setTimeout(() => {
            obs.next(3);
            obs.next(4);
          }, 50),
          setTimeout(() => {
            obs.next(5);
            obs.next(6);
          }, 100),
          setTimeout(() => {
            if (options.error) {
              obs.error(new Error(`An error ocurred`));
            } else {
              obs.complete();
            }
          }, 150)
        ];

        return () => {
          timeouts.forEach((timeout) => clearTimeout(timeout));
        };
      })
    );

    return {
      ...other,
      observable: projection(observable),
      termination: 200,
      timeline: [
        {
          ms: { add: null, total: null },
          values: { add: [1, 2], total: [1, 2] },
          end: 0
        },
        {
          ms: { add: 75, total: 75 },
          values: { add: [3, 4], total: [1, 2, 3, 4] },
          end: 0
        },
        {
          ms: { add: 50, total: 125 },
          values: { add: [5, 6], total: [1, 2, 3, 4, 5, 6] },
          end: 0
        },
        {
          ms: { add: 50, total: 175 },
          values: { add: [], total: [1, 2, 3, 4, 5, 6] },
          end: 1
        }
      ]
    };
  }
  public static observer() {
    const fns = {
      start: jest.fn(),
      next: jest.fn(),
      error: jest.fn(),
      complete: jest.fn()
    };
    return {
      observer: fns,
      assertObserverCalledTimes(times: {
        start: number | null;
        next: number | null;
        error: number | null;
        complete: number | null;
      }): void {
        if (times.start !== null) {
          expect(fns.start).toHaveBeenCalledTimes(times.start);
        }
        if (times.next !== null) {
          expect(fns.next).toHaveBeenCalledTimes(times.next);
        }
        if (times.error !== null) {
          expect(fns.error).toHaveBeenCalledTimes(times.error);
        }
        if (times.complete !== null) {
          expect(fns.complete).toHaveBeenCalledTimes(times.complete);
        }
      }
    };
  }
}
