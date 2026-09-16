import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useSearchIndex } from "./useSearchIndex";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useSearchIndex", () => {
  it("读取搜索索引", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          {
            id: "openai-2026-09-16-0",
            date: "2026-09-16",
            title: "标题",
            summary: "摘要",
            category: "模型技术快讯",
            source: "OpenAI",
            heat: 70,
            url: "https://example.com",
          },
        ],
      })),
    );

    const { result } = renderHook(() => useSearchIndex());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.entries[0].id).toBe("openai-2026-09-16-0");
  });

  it("索引为空时返回 empty", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })));

    const { result } = renderHook(() => useSearchIndex());

    await waitFor(() => expect(result.current.status).toBe("empty"));
    expect(result.current.entries).toEqual([]);
  });
});