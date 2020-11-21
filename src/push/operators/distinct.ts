import { BinaryFn, Push } from '@definitions';
import { operate } from '../utils';

export function distinct<T>(
  selector?: BinaryFn<[T, number], any>
): Push.Operation<T> {
  return operate<T>((tb) => {
    let index = 0;
    const values = new Set();

    return {
      next(value: T): void {
        const selectedValue = selector ? selector(value, index++) : value;
        if (!values.has(selectedValue)) {
          values.add(selectedValue);
          tb.next(value);
        }
      },
      terminate() {
        values.clear();
      }
    };
  });
}