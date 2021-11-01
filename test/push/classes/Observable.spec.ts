import { expect, test } from '@jest/globals';
import { Observable, configure } from '@push';
import { compliance } from '../../es-observable/compliance';

configure({ onUnhandledError: null });

test(`Observable passes spec and compliance tests`, async () => {
  const response = await compliance({
    spec: true,
    name: 'Observable',
    logging: 'silent',
    Constructor: Observable
  });
  expect(response.result[1]).toHaveLength(0);
});
