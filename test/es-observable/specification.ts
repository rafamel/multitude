import { Observable, configure } from '@push';
import { compliance } from './compliance';
import { ESObservable } from './module';

configure({ onUnhandledError: null });

let pass = true;
[
  () => compliance('ES Observable', ESObservable, 'final'),
  () => compliance('Observable', Observable, 'each')
]
  .reduce((acc, item) => {
    return acc.then(item).then((result) => {
      pass = pass && !result.result[1].length;
    });
  }, Promise.resolve())
  .then(() => (pass ? undefined : process.exit(1)));
