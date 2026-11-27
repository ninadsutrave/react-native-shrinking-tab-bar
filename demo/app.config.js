// The demo is published inside the website under /demo by default.
// Override with DEMO_BASE_URL when hosting it somewhere else.
module.exports = {
  expo: {
    name: 'Shrinking Tab Bar Demo',
    slug: 'react-native-shrinking-tab-bar-demo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
      output: 'single',
    },
    experiments: {
      baseUrl: process.env.DEMO_BASE_URL ?? '/demo',
    },
  },
};
