import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/selfhost",
  workers: 1,
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:5175",
    viewport: { width: 390, height: 844 },
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev:selfhost -- --port 5175",
        url: "http://127.0.0.1:5175",
        reuseExistingServer: true,
      },
});
