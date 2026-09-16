import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { READ_KEY, useReadItems } from "./useReadItems";

describe("useReadItems", () => {
  it("标记已读并持久化", () => {
    const { result } = renderHook(() => useReadItems());

    act(() => {
      result.current.markRead("item-a");
    });

    expect(result.current.isRead("item-a")).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]")).toEqual(["item-a"]);
  });

  it("重复标记不会产生重复项", () => {
    const { result } = renderHook(() => useReadItems());

    act(() => {
      result.current.markRead("item-a");
      result.current.markRead("item-a");
    });

    expect(result.current.ids).toEqual(["item-a"]);
  });

  it("从 localStorage 恢复", () => {
    window.localStorage.setItem(READ_KEY, JSON.stringify(["item-b"]));
    const { result } = renderHook(() => useReadItems());

    expect(result.current.isRead("item-b")).toBe(true);
  });
});