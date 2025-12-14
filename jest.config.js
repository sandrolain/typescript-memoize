module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/test/specs/**/*.spec.ts"],
  globals: {
    "ts-jest": {
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        target: "es2020",
        module: "commonjs",
        lib: ["es2020"],
        strict: true,
        esModuleInterop: true,
      },
    },
  },
};
