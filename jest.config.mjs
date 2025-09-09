/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
    clearMocks: true,
    coverageProvider: "v8",
    globals: {
        // fetch: global.fetch,
    },
    maxWorkers: "50%",
    moduleDirectories: [
        "src/js",
        "modules",
        "node_modules",
    ],    
    moduleNameMapper: {
        '^web-worker:(?:..?/)+(.*)$': '<rootDir>/test/mocks/$1',
        // '^file-saver$': '<rootDir>/test/mocks/file-saver.js',
    },
    setupFiles: ['./test/utils/jest-setup.js'],
    testEnvironment: "./test/utils/env-with-fetch.js",
    testEnvironmentOptions: {
        customExportConditions: [''],
    },
    testMatch: [
        "<rootDir>/test/*.test.jsx",
        //   "**/__tests__/**/*.[jt]s?(x)",
        //   "**/?(*.)+(spec|test).[tj]s?(x)"
    ],
    transformIgnorePatterns: [
        "/node_modules/(?!balanced-match)",
        "\\.pnp\\.[^\\/]+$"
    ],
};
