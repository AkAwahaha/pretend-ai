import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useArchive } from "./useArchive";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useArchive", () => {
  it("读取历史索引", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          { date: "2026-09-12", label: "09.12", count: 8, title: "示例标题", sources: ["OpenAI"] },
        ],
      })),
    );

    const { result } = renderHook(() => useArchive());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.entries[0].label).toBe("09.12");
    expect(result.current.entries[0].title).toBe("示例标题");
  });

  it("接口失败时返回空状态", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));

    const { result } = renderHook(() => useArchive());

    await waitFor(() => expect(result.current.status).toBe("empty"));
    expect(result.current.entries).toEqual([]);
  });
});