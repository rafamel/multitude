import { Push } from '@definitions';
import { operate } from '../../utils/operate';

export function trail<T>(length: number): Push.Operation<T, T[]> {
  return operate<T, T[]>((obs) => {
    const arr: T[] = [];
    return {
      next(value: T): void {
        arr.push(value);
        if (arr.length > length) arr.shift();
        if (arr.length === length) {
          obs.next(Array.from(arr));
        }
      }
    };
  });
}
