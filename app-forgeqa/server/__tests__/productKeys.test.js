import { describe, it, expect } from "vitest";
import { isValidKeyFormat } from "../auth/productKeys.js";

describe("isValidKeyFormat", () => {
  it("accepts valid 5x5 format", () => {
    expect(isValidKeyFormat("ABCDE-23456-FGHJK-78999-KLMNP")).toBe(true);
  });

  it("rejects invalid characters (0, O, I, 1)", () => {
    expect(isValidKeyFormat("ABCDE-23456-FGHJK-78999-0KLMN")).toBe(false);
    expect(isValidKeyFormat("ABCDE-23456-FGHJK-78999-OKLMN")).toBe(false);
    expect(isValidKeyFormat("ABCDE-23456-FGHJK-78999-IKLMN")).toBe(false);
    expect(isValidKeyFormat("ABCDE-23456-FGHJK-78999-1KLMN")).toBe(false);
  });

  it("rejects wrong segment lengths", () => {
    expect(isValidKeyFormat("ABCD-23456-FGHJK-78999-KLMNP")).toBe(false);
    expect(isValidKeyFormat("ABCDE-2345-FGHJK-78999-KLMNP")).toBe(false);
  });

  it("rejects lowercase", () => {
    expect(isValidKeyFormat("abcde-23456-fghjk-78999-klmnp")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidKeyFormat("")).toBe(false);
  });
});
