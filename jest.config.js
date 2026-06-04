// `@tanstack/db` is CJS but pulls the ESM-only `fractional-indexing`; jest must
// transform it (jest-expo's default pattern otherwise ignores all of node_modules).
const esmPackages = ['fractional-indexing'];

module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    `/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|${esmPackages.join('|')}))`,
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/',
  ],
};
