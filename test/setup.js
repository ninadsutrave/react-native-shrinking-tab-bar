/* global jest */
// Worklets and Reanimated run their JS fallbacks; safe-area returns zero insets.
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/src/mock')
);
require('react-native-reanimated').setUpTests();
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default
);
