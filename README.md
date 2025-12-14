# typescript-memoize

[![npm](https://img.shields.io/npm/v/typescript-memoize.svg)](https://www.npmjs.com/package/typescript-memoize)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/darrylhodgins/typescript-memoize/master/LICENSE)
![Test](https://github.com/darrylhodgins/typescript-memoize/workflows/Test/badge.svg)

A memoize decorator for Typescript.

> **Note:** This is an updated fork of [darrylhodgins/typescript-memoize](https://github.com/darrylhodgins/typescript-memoize) with modern dependencies and enhanced features.

## Features

- 🚀 Simple decorator-based memoization for TypeScript methods and getters
- 🔄 Support for multiple parameter combinations with custom hash functions
- ⏱️ TTL (Time To Live) support for cache expiration
- 🏷️ Tag-based cache invalidation
- 📦 LRU cache with configurable size limits
- 🎯 Deep argument hashing by default
- 💪 Full TypeScript support with type definitions

## Installation

```bash
npm install --save typescript-memoize
```

## Usage

The `@Memoize` decorator can be used in multiple ways:

```typescript
@Memoize(options?: MemoizeArgs)

interface MemoizeArgs {
  hashFunction?: ((...args: any[]) => string) | undefined;
  tags?: string[];
  maxSize?: number;  // Default: 1000
  ttl?: number;      // Time to live in milliseconds, Default: 0 (no expiration)
}
```

## Use Cases

You can use the decorator in several ways:

- Memoize a `get` accessor
- Memoize a method which takes no parameters
- Memoize a method with parameters using deep hashing
- Memoize a method with custom hash function
- Memoize with TTL (expiration)
- Memoize with cache size limits
- Memoize with tag-based invalidation

You can call memoized methods *within* the same class, too. This could be useful if you want to memoize the return value for an entire data set, and also a filtered or mapped version of that same set.

## Basic Usage

### Memoize a `get` accessor, or a method which takes no parameters

These both work the same way. Subsequent calls to a memoized method without parameters, or to a `get` accessor, always return the same value.

I generally consider it an anti-pattern for a call to a `get` accessor to trigger an expensive operation. Simply adding `@Memoize()` to a `get` allows for seamless lazy-loading.

```typescript
import { Memoize } from 'typescript-memoize';

class SimpleFoo {
  // Memoize a method without parameters
  @Memoize()
  public getAllTheData() {
    // do some expensive operation to get data
    return data;
  }

  // Memoize a method and expire the value after some time in milliseconds
  @Memoize({ ttl: 5000 })
  public getDataForSomeTime() {
    // do some expensive operation to get data
    return data;
  }

  // Memoize a getter
  @Memoize()
  public get someValue() {
    // do some expensive operation to calculate value
    return value;
  }
}
```

And then we call them from somewhere else in our code:

```typescript
let simpleFoo = new SimpleFoo();

// Memoizes a calculated value and returns it:
let methodVal1 = simpleFoo.getAllTheData();

// Returns memoized value
let methodVal2 = simpleFoo.getAllTheData();

// Memoizes (lazy-loads) a calculated value and returns it:
let getterVal1 = simpleFoo.someValue;

// Returns memoized value
let getterVal2 = simpleFoo.someValue;

```

## Parameters and Hashing

### Using Default Deep Hashing

When you don't provide a `hashFunction`, the decorator automatically performs deep hashing of all arguments. This means all parameters are considered for memoization:

```typescript
import { Memoize } from 'typescript-memoize';

class DataProcessor {
  @Memoize()
  public getGreeting(name: string, planet: string) {
    return 'Hello, ' + name + '! Welcome to ' + planet;
  }
}

const processor = new DataProcessor();

// 'Hello, Darryl! Welcome to Earth'
let greeterVal1 = processor.getGreeting('Darryl', 'Earth');

// Different parameters = different cache entry
// 'Hello, Darryl! Welcome to Mars'
let greeterVal2 = processor.getGreeting('Darryl', 'Mars');
```

### Custom Hash Functions

Pass in a `hashFunction` to customize how cache keys are generated:

```typescript
import { Memoize } from 'typescript-memoize';

class MoreComplicatedFoo {
  // Memoize a method with multiple parameters
  // Memoize will remember values based on keys like: 'name;planet'
  @Memoize({ hashFunction: (name: string, planet: string) => {
    return name + ';' + planet;
  }})
  public getBetterGreeting(name: string, planet: string) {
    return 'Hello, ' + name + '! Welcome to ' + planet;
  }

  // Memoize based on some other logic
  @Memoize({ hashFunction: () => {
    return new Date().toISOString();
  }})
  public memoryLeak(greeting: string) {
    return greeting + '!!!!!';
  }

  // Memoize with TTL and custom hash function combined
  @Memoize({
    ttl: 10000, // milliseconds
    hashFunction: (name: string, planet: string) => {
      return name + ';' + planet;
    }
  })
  public getSameBetterGreeting(name: string, planet: string) {
    return 'Hello, ' + name + '! Welcome to ' + planet;
  }
}
```

We call these methods from somewhere else in our code.  By now you should be getting the idea:

```typescript
let moreComplicatedFoo = new MoreComplicatedFoo();

// 'Hello, Darryl! Welcome to Earth'
let greeterVal1 = moreComplicatedFoo.getBetterGreeting('Darryl', 'Earth');

// 'Hello, Darryl! Welcome to Mars'
let greeterVal2 = moreComplicatedFoo.getBetterGreeting('Darryl', 'Mars');

// Fill up the computer with useless greetings:
let greeting = moreComplicatedFoo.memoryLeak('Hello');

```

## Memoize accepts one or more "tag" strings that allow the cache to be invalidated on command

Passing an array with one or more "tag" strings will allow you to later clear the cache of results associated with methods or `get` accessors using the `clear()` function.

The `clear()` function also requires an array of "tag" strings.

```typescript
import { Memoize } from 'typescript-memoize';

class ClearableFoo {
  // Memoize accepts tags
  @Memoize({ tags: ["foo", "bar"] })
  public getClearableGreeting(name: string, planet: string) {
    return 'Hello, ' + name + '! Welcome to ' + planet;
  }

  // Memoize accepts tags
  @Memoize({ tags: ["bar"] })
  public getClearableSum(a: number, b: number) {
    return a + b;
  }
}
```

We call these methods from somewhere else in our code:

```typescript
import { clear } from 'typescript-memoize';

let clearableFoo = new ClearableFoo();

// 'Hello, Darryl! Welcome to Earth'
let greeterVal1 = clearableFoo.getClearableGreeting('Darryl', 'Earth');

// Returns memoized value
// 'Hello, Darryl! Welcome to Earth'
let greeterVal2 = clearableFoo.getClearableGreeting('Darryl', 'Earth');

// '3'
let sum1 = clearableFoo.getClearableSum(2, 1);

// Returns memoized value
// '3'
let sum2 = clearableFoo.getClearableSum(2, 1);

clear(["foo"]);

// The memoized values are cleared, returns a new value
// 'Hello, Darryl! Welcome to Mars'
let greeterVal3 = clearableFoo.getClearableGreeting('Darryl', 'Mars');

// The memoized value is not associated with 'foo' tag, returns memoized value
// '3'
let sum3 = clearableFoo.getClearableSum(2, 1);

clear(["bar"]);

// The memoized values are cleared, returns a new value
// 'Hello, Darryl! Welcome to Earth'
let greeterVal4 = clearableFoo.getClearableGreeting('Darryl', 'Earth');

// The memoized values are cleared, returns a new value
// '4'
let sum4 = clearableFoo.getClearableSum(2, 2);
```

## Advanced Features

### Deep Argument Hashing

By default, when no `hashFunction` is provided, the decorator performs deep hashing of all arguments. This means that methods with multiple parameters or complex object parameters will be properly memoized based on the actual content of the arguments.

**Features of deep hashing:**

- Object keys are sorted for consistent hashing
- Arrays are properly handled
- Nested objects are deeply compared
- Circular references are detected and handled safely

```typescript
class DeepHashExample {
  @Memoize()
  public processData(config: { a: number; b: string }) {
    // This will be properly memoized based on the content of config
    return `${config.a}-${config.b}`;
  }
  
  @Memoize()
  public processArray(items: number[]) {
    // Arrays are properly hashed
    return items.reduce((a, b) => a + b, 0);
  }
  
  @Memoize()
  public processCircular(obj: any) {
    // Circular references are safely handled
    return JSON.stringify(obj);
  }
}

const example = new DeepHashExample();

// These will use the same cache entry because objects have same content
example.processData({ b: "test", a: 1 });
example.processData({ a: 1, b: "test" }); // Cached! (keys are sorted)

// These are different cache entries
example.processData({ a: 1, b: "test" });
example.processData({ a: 2, b: "test" }); // Different content = new computation
```

### TTL (Time To Live)

Set an expiration time for cached values in milliseconds:

```typescript
class TTLExample {
  @Memoize({ ttl: 5000 }) // Cache expires after 5 seconds
  public getTemporaryData() {
    return fetchDataFromAPI();
  }
  
  @Memoize({ ttl: 60000 }) // Cache expires after 1 minute
  public getUserProfile(userId: string) {
    return fetchUserProfile(userId);
  }
}
```

When the TTL expires, the next call to the method will recompute the value and cache it again.

### Cache Size Limits

Limit the number of cached entries using LRU (Least Recently Used) eviction:

```typescript
class LimitedCacheExample {
  @Memoize({ maxSize: 100 }) // Keep only the 100 most recent results
  public getCachedResult(id: string) {
    return expensiveOperation(id);
  }
}
```

### Combining Options

All options can be combined:

```typescript
class AdvancedExample {
  @Memoize({
    hashFunction: (id: string, type: string) => `${type}:${id}`,
    tags: ['user-data'],
    maxSize: 50,
    ttl: 60000 // 1 minute
  })
  public getUserData(id: string, type: string) {
    return fetchUserData(id, type);
  }
}
```

### Undefined Values

The decorator properly handles methods that return `undefined`. Unlike some caching solutions, this library correctly caches `undefined` values:

```typescript
class UndefinedExample {
  @Memoize()
  public findUser(id: string): User | undefined {
    // If user is not found, returns undefined
    // This undefined value will be properly cached
    return users.find(u => u.id === id);
  }
}

const example = new UndefinedExample();
const user1 = example.findUser("nonexistent"); // Returns undefined, caches it
const user2 = example.findUser("nonexistent"); // Returns cached undefined, doesn't search again
```

## API Reference

### Decorators

#### `@Memoize(options?: MemoizeArgs)`

Main decorator for memoization.

**Options:**

- `hashFunction?: (...args: any[]) => string` - Custom function to generate cache keys from method arguments. If not provided, uses deep hashing.
- `tags?: string[]` - Tags for cache invalidation via the `clear()` function.
- `maxSize?: number` - Maximum number of cached entries using LRU eviction (default: 1000).
- `ttl?: number` - Time to live in milliseconds. After this time, cached values expire (default: 0, no expiration).

#### ~~`@MemoizeExpiring(ttl: number)`~~

**Deprecated:** This decorator no longer exists. Use `@Memoize({ ttl: number })` instead.

### Functions

#### `clear(tags: string[]): number`

Clears all caches associated with the given tags.

**Parameters:**

- `tags: string[]` - Array of tags to clear

**Returns:**

- `number` - Number of caches cleared

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

The library maintains high test coverage (100% lines, 100% statements, 100% functions, 95% branches) including comprehensive tests for:

- Method and getter memoization
- Deep argument hashing
- Custom hash functions
- TTL expiration
- Cache size limits
- Tag-based invalidation
- Circular reference handling
- Undefined value caching

## Requirements

- TypeScript with `experimentalDecorators` enabled in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

## License

MIT

## Credits

This project is an updated fork of [darrylhodgins/typescript-memoize](https://github.com/darrylhodgins/typescript-memoize).
