import { BinaryFn } from 'type-core';
import { Push } from '@definitions';
import { operate } from '../../utils/operate';

export function distinct<T>(
  selector?: BinaryFn<[T, number], any>
): Push.Operation<T> {
  return operate<T>((obs) => {
    let index = 0;
    const values = new Set();

    return {
      next(value: T): void {
        const selectedValue = selector ? selector(value, index++) : value;
        if (!values.has(selectedValue)) {
          values.add(selectedValue);
          obs.next(value);
        }
      },
      teardown() {
        values.clear();
      }
    };
  });
}
