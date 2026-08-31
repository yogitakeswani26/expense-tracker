module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/dist/**/*.test.js'],
  collectCoverageFrom: [
    'dist/**/*.js',
    '!dist/**/*.d.js',
    '!dist/**/*.test.js',
  ],
  passWithNoTests: true,
};
