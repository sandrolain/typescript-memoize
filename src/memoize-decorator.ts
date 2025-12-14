import { LRUCache } from "lru-cache";

// Sentinella per rappresentare undefined nella cache
const UNDEFINED_SENTINEL = Symbol("UNDEFINED_SENTINEL");

interface MemoizeArgs {
  hashFunction?: ((...args: any[]) => string) | undefined;
  tags?: string[];
  maxSize?: number;
  ttl?: number;
}

export function Memoize(args?: MemoizeArgs) {
  const { hashFunction, tags, maxSize = 1000, ttl = 0 } = args || {};

  return (
    target: Object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    if (descriptor.value != null) {
      descriptor.value = getNewFunction(
        descriptor.value,
        hashFunction,
        tags,
        maxSize,
        ttl
      );
    } else if (descriptor.get != null) {
      descriptor.get = getNewFunction(
        descriptor.get,
        hashFunction,
        tags,
        maxSize,
        ttl
      );
    } else {
      throw "Only put a Memoize() decorator on a method or get accessor.";
    }
  };
}

const clearCacheTagsMap: Map<string, LRUCache<string, any>[]> = new Map();

export function clear(tags: string[]): number {
  const cleared: Set<LRUCache<string, any>> = new Set();
  for (const tag of tags) {
    const caches = clearCacheTagsMap.get(tag);
    if (caches) {
      for (const cache of caches) {
        if (!cleared.has(cache)) {
          cache.clear();
          cleared.add(cache);
        }
      }
    }
  }
  return cleared.size;
}

// Funzione per deep hash degli argomenti
function hashArgs(args: any[]): string {
  const seen = new WeakSet();
  function replacer(key: string, value: any): any {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
      if (Array.isArray(value)) {
        return value;
      }
      // Ordina le chiavi per consistenza
      const sorted: any = {};
      Object.keys(value)
        .sort()
        .forEach((k) => (sorted[k] = value[k]));
      return sorted;
    }
    return value;
  }
  return JSON.stringify(args, replacer);
}

function getNewFunction(
  originalMethod: () => void,
  hashFunction?: MemoizeArgs["hashFunction"],
  tags?: MemoizeArgs["tags"],
  maxSize: number = 1000,
  ttl: number = 0
) {
  const propCacheName = Symbol(`__memoized_cache__`);

  // The function returned here gets called instead of originalMethod.
  return function (this: any, ...args: any[]) {
    let returnedValue: any;

    // Get or create cache
    if (!this.hasOwnProperty(propCacheName)) {
      const options: any = { max: maxSize };
      if (ttl && ttl > 0) {
        options.ttl = ttl;
        options.ttlAutopurge = true;
      }
      Object.defineProperty(this, propCacheName, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: new LRUCache<string, any>(options),
      });
    }
    let myCache: LRUCache<string, any> = this[propCacheName];

    if (Array.isArray(tags)) {
      for (const tag of tags) {
        let caches = clearCacheTagsMap.get(tag);
        if (!caches) {
          caches = [];
          clearCacheTagsMap.set(tag, caches);
        }
        caches.push(myCache);
      }
    }

    let hashKey: string;

    if (hashFunction) {
      hashKey = hashFunction.apply(this, args);
    } else {
      // Default: deep hash of all args
      hashKey = hashArgs(args);
    }

    if (myCache.has(hashKey)) {
      returnedValue = myCache.get(hashKey);
      // Se il valore è la sentinella, ritorna undefined
      if (returnedValue === UNDEFINED_SENTINEL) {
        return undefined;
      }
    } else {
      returnedValue = (originalMethod as any).apply(this, args);
      // Se il valore è undefined, memorizza la sentinella
      myCache.set(
        hashKey,
        returnedValue === undefined ? UNDEFINED_SENTINEL : returnedValue
      );
    }

    return returnedValue;
  };
}
