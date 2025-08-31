// Basic property access
const foo = import.meta.foo;
const isDev = import.meta.NODE_ENV;

// Method calls
const resolved = import.meta.resolve("./file");
const barResult = import.meta.bar();

// Complex expressions
const config = {
  env: import.meta.environment,
  version: import.meta.getVersion("1.0.0"),
};

export { barResult, config, foo, isDev, resolved };
