import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DailyDigest } from "../types";
import { useDigest } from "./useDigest";

const remoteDigest = {
  date: "2026-09-12",
  label: "09.12",
  headline: "今日 AI 日报",
  kicker: "DAILY BRIEF",
  items: [
    {
      id: "remote-1",
      source: "openai",
      sourceLabel: "OpenAI",
      category: "一手官方",
      title: "远程数据",
      summary: "摘要",
      what: "是什么",
      highlights: "亮点",
      productView: "产品视角",
      sourceUrl: "https://example.com",
      readTime: "2 min",
      featured: true,
    },
  ],
} satisfies DailyDigest;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useDigest", () => {
  it("加载远程日报数据", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => remoteDigest })),
    );

    const { result } = renderHook(() => useDigest());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.digest.items[0].title).toBe("远程数据");
  });

  it("请求失败时回退到 mock 数据", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })),
    );

    const { result } = renderHook(() => useDigest());

    await waitFor(() => expect(result.current.status).toBe("fallback"));
    expect(result.current.digest.items.length).toBeGreaterThan(0);
  });
});