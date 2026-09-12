import { describe, expect, it } from "vitest";
import { assertVisitorGroupSizeWithinLimit, MAX_VISITORS_PER_REQUEST, VisitorGroupSizeError } from "./constants";

describe("assertVisitorGroupSizeWithinLimit", () => {
  it("allows a group exactly at the limit", () => {
    expect(() => assertVisitorGroupSizeWithinLimit(MAX_VISITORS_PER_REQUEST)).not.toThrow();
  });

  it("allows a single visitor", () => {
    expect(() => assertVisitorGroupSizeWithinLimit(1)).not.toThrow();
  });

  it("rejects a group one over the limit", () => {
    expect(() => assertVisitorGroupSizeWithinLimit(MAX_VISITORS_PER_REQUEST + 1)).toThrow(VisitorGroupSizeError);
  });

  it("rejects a wildly oversized batch upload", () => {
    expect(() => assertVisitorGroupSizeWithinLimit(5000)).toThrow(VisitorGroupSizeError);
  });

  it("reports the actual count and the limit in the error", () => {
    try {
      assertVisitorGroupSizeWithinLimit(MAX_VISITORS_PER_REQUEST + 7);
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(VisitorGroupSizeError);
      const e = err as VisitorGroupSizeError;
      expect(e.count).toBe(MAX_VISITORS_PER_REQUEST + 7);
      expect(e.limit).toBe(MAX_VISITORS_PER_REQUEST);
      expect(e.message).toContain(String(MAX_VISITORS_PER_REQUEST + 7));
      expect(e.message).toContain(String(MAX_VISITORS_PER_REQUEST));
    }
  });

  it("respects a custom limit override", () => {
    expect(() => assertVisitorGroupSizeWithinLimit(10, 5)).toThrow(VisitorGroupSizeError);
    expect(() => assertVisitorGroupSizeWithinLimit(5, 5)).not.toThrow();
  });
});
