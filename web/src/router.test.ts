import { describe, expect, it } from "vitest";
import { parseHash } from "./router";

describe("parseHash", () => {
  it("默认回到今日日报", () => {
    expect(parseHash("")).toEqual({ name: "today" });
    expect(parseHash("#/today")).toEqual({ name: "today" });
  });

  it("解析详情路由", () => {
    expect(parseHash("#/item/openai-reasoning-0912")).toEqual({
      name: "item",
      id: "openai-reasoning-0912",
    });
  });

  it("解析收藏与历史路由", () => {
    expect(parseHash("#/favorites")).toEqual({ name: "favorites" });
    expect(parseHash("#/history")).toEqual({ name: "history" });
  });

  it("解析历史某一天", () => {
    expect(parseHash("#/day/2026-09-11")).toEqual({ name: "day", date: "2026-09-11" });
  });
});
