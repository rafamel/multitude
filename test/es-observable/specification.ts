import { Observable, configure } from '@push';
import { compliance } from './compliance';
import { ESObservable } from './module';

configure({ onUnhandledError: null });

let pass = true;
[
  () => {
    return compliance({
      spec: true,
      name: 'ES Observable',
      logging: 'final',
      Constructor: ESObservable
    });
  },
  () => {
    return compliance({
      spec: true,
      name: 'Observable',
      logging: 'each',
      Constructor: Observable
    });
  }
]
  .reduce((acc, item) => {
    return acc.then(item).then((result) => {
      pass = pass && !result.result[1].length;
    });
  }, Promise.resolve())
  .then(() => (pass ? undefined : process.exit(1)));
