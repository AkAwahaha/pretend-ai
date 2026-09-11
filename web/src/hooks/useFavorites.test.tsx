import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FAVORITES_KEY, useFavorites } from "./useFavorites";

describe("useFavorites", () => {
  it("切换收藏并写入 localStorage", () => {
    const { result } = renderHook(() => useFavorites());

    act(() => {
      result.current.toggle("item-a");
    });

    expect(result.current.isFavorite("item-a")).toBe(true);
    expect(JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]")).toEqual(["item-a"]);

    act(() => {
      result.current.toggle("item-a");
    });

    expect(result.current.isFavorite("item-a")).toBe(false);
  });

  it("从 localStorage 恢复收藏", () => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(["item-b"]));
    const { result } = renderHook(() => useFavorites());

    expect(result.current.isFavorite("item-b")).toBe(true);
  });
});
