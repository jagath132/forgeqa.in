import { describe, it, expect } from "vitest";
import { PLANS } from "../billing/plans.js";

describe("PLANS", () => {
  it("defines free, pro, and enterprise tiers", () => {
    expect(PLANS.free).toBeDefined();
    expect(PLANS.pro).toBeDefined();
    expect(PLANS.enterprise).toBeDefined();
  });

  it("free plan has 0 price", () => {
    expect(PLANS.free.monthlyPrice).toBe(0);
    expect(PLANS.free.maxUsers).toBe(1);
  });

  it("pro plan has reasonable limits", () => {
    expect(PLANS.pro.monthlyPrice).toBe(29);
    expect(PLANS.pro.maxTestCases).toBe(5000);
  });

  it("all plans have features array", () => {
    for (const plan of Object.values(PLANS)) {
      expect(Array.isArray(plan.features)).toBe(true);
      expect(plan.features.length).toBeGreaterThan(0);
    }
  });
});
