import { Push } from '@definitions';
import { operate } from '../../utils/operate';

export type Result<T> =
  | { done: false; success: true; data: T }
  | { done: true; success: true; data: null }
  | { done: true; success: false; data: Error };

export function results<T>(): Push.Operation<T, Result<T>> {
  return operate<T, Result<T>>((obs) => {
    return {
      next(value: T): void {
        obs.next({ done: false, success: true, data: value });
      },
      error(error: Error): void {
        obs.next({ done: true, success: false, data: error });
        obs.complete();
      },
      complete(): void {
        obs.next({ done: true, success: true, data: null });
        obs.complete();
      }
    };
  });
}
