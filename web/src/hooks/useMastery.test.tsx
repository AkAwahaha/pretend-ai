import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MASTERY_KEY, useMastery } from "./useMastery";

describe("useMastery", () => {
  it("标记已掌握并持久化", () => {
    const { result } = renderHook(() => useMastery());

    act(() => {
      result.current.setMastery("item-a", "mastered");
    });

    expect(result.current.getMastery("item-a")).toBe("mastered");
    expect(JSON.parse(window.localStorage.getItem(MASTERY_KEY) ?? "{}")).toEqual({ "item-a": "mastered" });
  });

  it("再次点击同一状态会取消标记", () => {
    const { result } = renderHook(() => useMastery());

    act(() => {
      result.current.setMastery("item-a", "mastered");
    });
    act(() => {
      result.current.setMastery("item-a", "mastered");
    });

    expect(result.current.getMastery("item-a")).toBeNull();
  });

  it("可以在两种状态间切换", () => {
    const { result } = renderHook(() => useMastery());

    act(() => {
      result.current.setMastery("item-a", "mastered");
    });
    act(() => {
      result.current.setMastery("item-a", "unmastered");
    });

    expect(result.current.getMastery("item-a")).toBe("unmastered");
  });

  it("从 localStorage 恢复并忽略非法值", () => {
    window.localStorage.setItem(MASTERY_KEY, JSON.stringify({ "item-b": "mastered", "item-c": "unknown" }));
    const { result } = renderHook(() => useMastery());

    expect(result.current.getMastery("item-b")).toBe("mastered");
    expect(result.current.getMastery("item-c")).toBeNull();
  });
});