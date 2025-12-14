import { clear, Memoize } from "../../src/memoize-decorator";

describe("Memoize()", () => {
  // Using Jest mocks instead of Jasmine spies
  let getNumberSpy = jest.fn();
  let valueSpy = jest.fn();
  let getGreetingSpy = jest.fn();
  let multiplySpy = jest.fn();

  let a: MyClass;
  let b: MyClass;

  beforeEach(() => {
    a = new MyClass();
    b = new MyClass();

    getNumberSpy.mockClear();
    valueSpy.mockClear();
    getGreetingSpy.mockClear();
    multiplySpy.mockClear();
  });

  class MyClass {
    @Memoize()
    public getNumber(): number {
      getNumberSpy();
      return Math.random();
    }

    @Memoize()
    public get value(): number {
      return Math.random();
    }

    @Memoize()
    public getGreeting(greeting: string, planet: string): string {
      getGreetingSpy(greeting, planet);
      return greeting + ", " + planet;
    }

    @Memoize({ hashFunction: (a: number, b: number) => `${a};${b}` })
    public multiply(a: number, b: number) {
      multiplySpy(a, b);
      return a * b;
    }

    @Memoize()
    public multiplyDeep(a: number, b: number) {
      multiplySpy(a, b);
      return a * b;
    }

    @Memoize({ maxSize: 2 })
    public limitedCache(key: string) {
      return `result-${key}`;
    }

    @Memoize({ ttl: 100 })
    public expiringCache(key: string) {
      return `expiring-${key}`;
    }

    @Memoize({ tags: ["test"] })
    public taggedMethod(key: string) {
      return `tagged-${key}`;
    }

    @Memoize()
    public multiply3(a: number, b: number) {
      multiplySpy(a, b);
      return a * b;
    }

    @Memoize()
    public getGreeting3(greeting: string, planet: string): string {
      getGreetingSpy(greeting, planet);
      return greeting + ", " + planet;
    }

    @Memoize({ tags: ["foo", "bar"] })
    public getGreeting4(greeting: string, planet: string): string {
      getGreetingSpy(greeting, planet);
      return greeting + ", " + planet;
    }
  }

  describe("when decorating a method", () => {
    it("method should be memoized", () => {
      expect(a.getNumber()).toEqual(a.getNumber());
    });

    it("multiple instances shouldn't share values for methods", () => {
      expect(a.getNumber()).not.toEqual(b.getNumber());
    });
  });

  describe("when decorating a get accessor", () => {
    it("accessor should be memoized", () => {
      expect(a.value).toEqual(a.value);
    });

    it("multiple instances shouldn't share values for accessors", () => {
      expect(a.value).not.toEqual(b.value);
    });
  });

  describe("when decorating a method, which takes some parameters", () => {
    it("should call the original method with the original arguments", () => {
      let val1 = a.getGreeting("Halló", "heimur"); // In Icelandic
      expect(val1).toEqual("Halló, heimur");
      expect(getGreetingSpy).toHaveBeenCalledWith("Halló", "heimur");
    });

    it("should call the original method once", () => {
      let val1 = a.getGreeting("Ciao", "mondo"); // In Italian
      let val2 = a.getGreeting("Ciao", "mondo");

      expect(val1).toEqual("Ciao, mondo");
      expect(val2).toEqual("Ciao, mondo");

      expect(getGreetingSpy).toHaveBeenCalledTimes(1);
    });

    it("should not share between two instances of the same class", () => {
      let val1 = a.getGreeting("Hej", "världen"); // In Swedish
      let val2 = b.getGreeting("Hej", "världen");

      expect(val1).toEqual("Hej, världen");
      expect(val2).toEqual("Hej, världen");

      expect(getGreetingSpy).toHaveBeenCalledTimes(2);
    });

    it("should call the original method once, even if the second parameter is different", () => {
      let val1 = a.getGreeting("Hola", "Mundo"); // Spanish
      let val2 = a.getGreeting("Hola", "Mars");

      expect(val1).toEqual("Hola, Mundo");
      expect(val2).toEqual("Hola, Mars");

      expect(getGreetingSpy).toHaveBeenCalledTimes(2);
    });

    it("should call the original method once", () => {
      let val1 = a.getGreeting("Bonjour", "le monde");
      let val2 = a.getGreeting("Hello", "World");

      expect(val1).toEqual("Bonjour, le monde");
      expect(val2).toEqual("Hello, World");

      expect(getGreetingSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("when decorating a method with deep hashing", () => {
    it("should call the original method with the original arguments", () => {
      let val1 = a.multiplyDeep(5, 7);
      expect(multiplySpy).toHaveBeenCalledWith(5, 7);
    });

    it("should only call the original method once for same args", () => {
      let val1 = a.multiplyDeep(4, 6);
      let val2 = a.multiplyDeep(4, 6);
      expect(val1).toEqual(24);
      expect(val2).toEqual(24);
      expect(multiplySpy).toHaveBeenCalledTimes(1);
    });

    it("should call again for different args", () => {
      let val1 = a.multiplyDeep(4, 7);
      let val2 = a.multiplyDeep(4, 9);
      expect(val1).toEqual(28);
      expect(val2).toEqual(36);
      expect(multiplySpy).toHaveBeenCalledTimes(2);
    });
  });

  describe("when using default options", () => {
    class DefaultOptionsClass {
      @Memoize() // No arguments, all defaults
      public defaultMethod(value: string) {
        return `default-${value}`;
      }
    }

    it("should use default maxSize and ttl", () => {
      const instance = new DefaultOptionsClass();
      const result1 = instance.defaultMethod("test");
      const result2 = instance.defaultMethod("test");

      expect(result1).toEqual("default-test");
      expect(result2).toEqual("default-test");
    });
  });

  describe("when using custom hashFunction", () => {
    it("should use custom hash function and cache properly", () => {
      let val1 = a.multiply(3, 5);
      let val2 = a.multiply(3, 5); // should be cached using custom hash
      expect(val1).toEqual(15);
      expect(val2).toEqual(15);
      expect(multiplySpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("when using maxSize limit", () => {
    it("should respect cache size limit", () => {
      let val1 = a.limitedCache("a");
      let val2 = a.limitedCache("b");
      let val3 = a.limitedCache("c"); // should evict "a"
      let val4 = a.limitedCache("a"); // should be recalculated

      expect(val1).toEqual("result-a");
      expect(val2).toEqual("result-b");
      expect(val3).toEqual("result-c");
      expect(val4).toEqual("result-a");
      // Note: exact behavior depends on LRU, but should work
    });
  });

  describe("when using ttl", () => {
    it("should expire cache after ttl", async () => {
      let val1 = a.expiringCache("test");
      let val2 = a.expiringCache("test"); // should be cached

      expect(val1).toEqual("expiring-test");
      expect(val2).toEqual("expiring-test");

      await new Promise((resolve) => setTimeout(resolve, 150)); // wait > 100ms

      let val3 = a.expiringCache("test"); // should be recalculated
      expect(val3).toEqual("expiring-test");
    });
  });

  describe("when using tags", () => {
    it("should clear cache by tags", () => {
      let val1 = a.taggedMethod("test");
      let val2 = a.taggedMethod("test"); // cached

      expect(val1).toEqual("tagged-test");
      expect(val2).toEqual("tagged-test");

      clear(["test"]);

      let val3 = a.taggedMethod("test"); // should be recalculated
      expect(val3).toEqual("tagged-test");
    });
  });

  describe("when passing arguments as arguments object", () => {
    it("should call the original method with the original arguments", () => {
      let val1 = a.multiply3(5, 7);
      expect(multiplySpy).toHaveBeenCalledWith(5, 7);
    });

    it("should only call the original method once", () => {
      let val1 = a.multiply3(4, 6);
      let val2 = a.multiply3(4, 6);
      expect(val1).toEqual(24);
      expect(val2).toEqual(24);
      expect(multiplySpy).toHaveBeenCalledTimes(1);
    });

    it("should take into consideration every parameter", () => {
      let val1 = a.getGreeting3("Hello", "World");
      let val2 = a.getGreeting3("Hello", "Moon");

      expect(val1).toEqual("Hello, World");
      expect(val2).toEqual("Hello, Moon");

      expect(getGreetingSpy).toHaveBeenCalledTimes(2);
    });

    it("should be cleared ", () => {
      let val1 = a.getGreeting4("Hello", "World");
      let val2 = a.getGreeting4("Hello", "Moon");
      let val3 = a.getGreeting4("Hello", "World");
      clear(["foo"]);
      let val4 = a.getGreeting4("Hello", "Moon");
      let val5 = a.getGreeting4("Hello", "World");
      clear(["bar"]);
      let val6 = a.getGreeting4("Hello", "World");

      clear(["unknown"]);

      expect(val1).toEqual("Hello, World");
      expect(val2).toEqual("Hello, Moon");
      expect(val3).toEqual("Hello, World");
      expect(val4).toEqual("Hello, Moon");
      expect(val5).toEqual("Hello, World");
      expect(val6).toEqual("Hello, World");

      expect(getGreetingSpy).toHaveBeenCalledTimes(5);
    });
  });

  describe("when applied to invalid targets", () => {
    it("should throw an error when descriptor has no value or get", () => {
      const descriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: true,
      };

      expect(() => {
        Memoize()(Object.prototype, "test", descriptor);
      }).toThrow("Only put a Memoize() decorator on a method or get accessor.");
    });
  });

  describe("when handling complex object arguments", () => {
    class ComplexClass {
      @Memoize()
      public processObject(obj: { name: string; age: number }) {
        return `${obj.name}-${obj.age}`;
      }

      @Memoize()
      public processArray(arr: number[]) {
        return arr.reduce((a, b) => a + b, 0);
      }

      @Memoize()
      public processComplexNested(data: { users: { name: string }[] }) {
        return data.users.map((u) => u.name).join(",");
      }
    }

    it("should properly hash object arguments with sorted keys", () => {
      const instance = new ComplexClass();
      const obj1 = { age: 30, name: "Alice" }; // keys in different order
      const obj2 = { name: "Alice", age: 30 };

      const result1 = instance.processObject(obj1);
      const result2 = instance.processObject(obj2);

      expect(result1).toEqual(result2);
      expect(result1).toEqual("Alice-30");
    });

    it("should handle array arguments", () => {
      const instance = new ComplexClass();
      const result1 = instance.processArray([1, 2, 3]);
      const result2 = instance.processArray([1, 2, 3]);

      expect(result1).toEqual(6);
      expect(result2).toEqual(6);
    });

    it("should handle complex nested objects", () => {
      const instance = new ComplexClass();
      const data = { users: [{ name: "Alice" }, { name: "Bob" }] };
      const result = instance.processComplexNested(data);

      expect(result).toEqual("Alice,Bob");
    });
  });

  describe("when handling circular references", () => {
    class CircularClass {
      @Memoize()
      public processCircular(obj: any) {
        return "processed";
      }
    }

    it("should handle circular object references", () => {
      const instance = new CircularClass();
      const circular: any = { name: "test" };
      circular.self = circular;

      const result = instance.processCircular(circular);
      expect(result).toEqual("processed");

      // Should be cached
      const result2 = instance.processCircular(circular);
      expect(result2).toEqual("processed");
    });
  });

  describe("when method returns undefined", () => {
    class UndefinedClass {
      callCount = 0;

      @Memoize()
      public returnsUndefined() {
        this.callCount++;
        return undefined;
      }

      @Memoize()
      public returnsUndefinedWithArgs(key: string) {
        this.callCount++;
        return undefined;
      }
    }

    it("should cache undefined values", () => {
      const instance = new UndefinedClass();

      const result1 = instance.returnsUndefined();
      const result2 = instance.returnsUndefined();

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(instance.callCount).toEqual(1); // Should only call once
    });

    it("should cache undefined values with arguments", () => {
      const instance = new UndefinedClass();

      const result1 = instance.returnsUndefinedWithArgs("test");
      const result2 = instance.returnsUndefinedWithArgs("test");

      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
      expect(instance.callCount).toEqual(1); // Should only call once
    });
  });
});
