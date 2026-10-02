import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./test/browser', testMatch:'**/*.spec.js', workers:1, timeout:30000,
  outputDir:process.env.CI ? 'test-results' : '/private/tmp/yuki-browser-test-results',
  use:{baseURL:'http://127.0.0.1:4177',channel:process.env.CI ? undefined : 'chrome',trace:'retain-on-failure'},
  webServer:{command:'node test/browser/serve.mjs',url:'http://127.0.0.1:4177',reuseExistingServer:false,timeout:30000}
});
