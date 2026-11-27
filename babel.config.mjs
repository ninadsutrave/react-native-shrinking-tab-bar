export default {
  // Apps run the Worklets plugin on this package themselves; tests need it too.
  env: {
    test: { plugins: ['react-native-worklets/plugin'] },
  },
  overrides: [
    {
      exclude: /\/node_modules\//,
      presets: ['module:react-native-builder-bob/babel-preset'],
    },
    {
      include: /\/node_modules\//,
      presets: ['module:@react-native/babel-preset'],
    },
  ],
};
