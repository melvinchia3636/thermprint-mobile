import { describe, expect, it } from "bun:test";
import {
  PrintProgressProvider,
  usePrintProgress,
} from "../PrintProgressContext";

describe("PrintProgressContext", () => {
  it("exports PrintProgressProvider as a React component function", () => {
    expect(typeof PrintProgressProvider).toBe("function");
  });

  it("exports usePrintProgress as a context consumer hook", () => {
    expect(typeof usePrintProgress).toBe("function");
    expect(() => {
      usePrintProgress();
    }).toThrow();
  });
});
