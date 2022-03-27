import { Push } from '@definitions';
import { operate } from '../../utils/operate';

export function group<T>(every: number): Push.Operation<T, T[]> {
  return operate<T, T[]>((obs) => {
    let arr: T[] = [];

    return {
      next(value: T): void {
        arr.push(value);
        if (arr.length >= every) {
          const response = arr;
          arr = [];
          obs.next(response);
        }
      }
    };
  });
}
