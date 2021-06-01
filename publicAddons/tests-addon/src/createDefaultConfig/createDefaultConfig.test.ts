import { join } from 'path';
import createDefaultConfig from './createDefaultConfig';

const fixtures = join(__dirname, 'fixtures');

test('with src', () => {
  expect(
    createDefaultConfig(join(fixtures, 'normal'), {}).collectCoverageFrom,
  ).toContain('src/**/*.{js,jsx,ts,tsx}');
});

test('project mode without package', () => {
  expect(
    createDefaultConfig(join(fixtures, 'projectmode'), {}).collectCoverageFrom,
  ).toContain('packages/*/src/**/*.{js,jsx,ts,tsx}');
});

test('project mode with package', () => {
  expect(
    createDefaultConfig(join(fixtures, 'projectmode'), {
      package: 'a',
    }).collectCoverageFrom,
  ).toContain('packages/a/src/**/*.{js,jsx,ts,tsx}');
});

test('project mode with not exists package', () => {
  expect(() =>
    createDefaultConfig(join(fixtures, 'projectmode'), {
      package: 'b',
    }),
  ).toThrow(/packages\/b does not exists/);
});

test('jest maxWorkers', () => {
  const oldMaxWorkers = process.env.MAX_WORKERS;
  process.env.MAX_WORKERS = '2';
  expect(createDefaultConfig(join(fixtures, 'normal'), {}).maxWorkers).toBe(2);
  delete process.env.MAX_WORKERS;
  expect(createDefaultConfig(join(fixtures, 'normal'), {}).maxWorkers).toBe(
    undefined,
  );
  if (oldMaxWorkers === undefined) {
    delete process.env.MAX_WORKERS;
  } else {
    process.env.MAX_WORKERS = oldMaxWorkers;
  }
});