import { InMemoryCacheService } from "../../infrastructure/services/cache.service";

describe("InMemoryCacheService", () => {
  let cacheService: InMemoryCacheService;

  beforeEach(() => {
    cacheService = new InMemoryCacheService(1000);
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe("set and get", () => {
    it("should store and retrieve data", () => {
      const testData = { name: "test", value: 123 };

      cacheService.set("test-key", testData);
      const result = cacheService.get("test-key");

      expect(result).toEqual(testData);
    });

    it("should return null for non-existent key", () => {
      const result = cacheService.get("non-existent");

      expect(result).toBeNull();
    });

    it("should return null for expired data", async () => {
      const testData = { name: "test" };

      cacheService.set("test-key", testData, 50);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = cacheService.get("test-key");
      expect(result).toBeNull();
    });

    it("should use custom TTL when provided", () => {
      const testData = { name: "test" };

      cacheService.set("test-key", testData, 5000);

      const result = cacheService.get("test-key");
      expect(result).toEqual(testData);
    });
  });

  describe("clear", () => {
    it("should clear all cached data", () => {
      cacheService.set("key1", "value1");
      cacheService.set("key2", "value2");

      cacheService.clear();

      expect(cacheService.get("key1")).toBeNull();
      expect(cacheService.get("key2")).toBeNull();
    });
  });

  describe("getStats", () => {
    it("should return cache statistics", () => {
      cacheService.set("key1", "value1");
      cacheService.set("key2", "value2");

      const stats = cacheService.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain("key1");
      expect(stats.keys).toContain("key2");
    });

    it("should not count expired items in stats", async () => {
      cacheService.set("key1", "value1", 50);
      cacheService.set("key2", "value2", 5000);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = cacheService.getStats();

      expect(stats.size).toBe(1);
      expect(stats.keys).toContain("key2");
      expect(stats.keys).not.toContain("key1");
    });
  });
});
