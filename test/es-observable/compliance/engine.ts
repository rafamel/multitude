/* eslint-disable no-console */
import chalk from 'chalk';
import util from 'util';

export type Test = null | [string, () => void | Promise<void>];
export type Result = [string, Error[]];
export type Response = { result: Result; results: Result[] };
export type Logging = 'silent' | 'final' | 'each' | 'verbose' | 'raw';

export function test(name: string, fn: () => void | Promise<void>): Test {
  return [name, fn];
}

export async function engine(
  name: string,
  tests: Test[],
  logging: Logging
): Promise<Response> {
  const results: Result[] = [];

  const log = (...args: any): void => {
    process.stdout.write(util.format(...args) + '\n');
  };

  const consoleLog = console.log;
  const verbose: any[] = [];
  console.log =
    logging === 'raw'
      ? log
      : (...args: any[]): void => {
          verbose.push(args);
        };

  const all: Error[] = [];
  for (const entry of tests) {
    const local: Error[] = [];
    if (entry) {
      try {
        await entry[1]();
      } catch (err) {
        all.push(err as Error);
        local.push(err as Error);
      }
      results.push([entry[0], local]);
    }
  }

  console.log = consoleLog;

  if (logging !== 'silent') {
    if (all.length) log(chalk.bgRed.black(' FAIL ') + ` ${name}`);
    else log(chalk.bgGreen.black(' PASS ') + ` ${name}`);
  }

  if (logging !== 'silent' && logging !== 'final') {
    for (const result of results) {
      if (result[1].length) {
        log(chalk.red('  ✕ ') + result[0]);
        const err = result[1][0];
        if (err && err.message && err.message.substr(-8) !== ' == true') {
          const str =
            '     ' +
            chalk.red('Error: ') +
            err.message.replace(/\n/g, '\n      ');
          log(str);
        }
      } else {
        log(chalk.green('  ✓ ') + result[0]);
      }
    }
  }

  if (logging === 'verbose') {
    for (const args of verbose) log(...args);
  }

  return {
    result: [name, all],
    results
  };
}
