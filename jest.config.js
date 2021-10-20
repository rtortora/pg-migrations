/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // NOTE: This makes tests run a lot faster. If you want to turn
  // it back on, you will want to set --maxWorkers=1 on the test
  // script in package.json.
  // See: https://github.com/kulshekhar/ts-jest/issues/259
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};