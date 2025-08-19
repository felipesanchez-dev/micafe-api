module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  testPathIgnorePatterns: ["<rootDir>/src/__tests__/fixtures/"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.spec.ts",
    "!src/index.ts",
    "!src/__tests__/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  moduleNameMapping: {
    "^@domain/(.*)$": "<rootDir>/src/domain/$1",
    "^@application/(.*)$": "<rootDir>/src/application/$1",
    "^@infrastructure/(.*)$": "<rootDir>/src/infrastructure/$1",
    "^@interfaces/(.*)$": "<rootDir>/src/interfaces/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
    "^@app$": "<rootDir>/src/app.ts",
  },
};
