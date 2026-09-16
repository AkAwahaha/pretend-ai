import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TODAY_DIGEST } from "../data/mock";
import { TodayPage } from "./TodayPage";

function renderTodayPage() {
  const onToggleFavorite = vi.fn();
  const onOpen = vi.fn();
  render(
    <TodayPage
      digest={TODAY_DIGEST}
      isFavorite={() => false}
      onToggleFavorite={onToggleFavorite}
      onOpen={onOpen}
    />,
  );
  return { onToggleFavorite, onOpen };
}

describe("TodayPage", () => {
  it("渲染内容列表与热度排序说明", () => {
    renderTodayPage();

    expect(screen.getByRole("heading", { level: 2, name: /今日/ })).toBeInTheDocument();
    expect(screen.getByText("按热度排序")).toBeInTheDocument();
    expect(screen.getByText(TODAY_DIGEST.items[0].title)).toBeInTheDocument();
  });

  it("按主题筛选内容", () => {
    renderTodayPage();

    fireEvent.click(screen.getByRole("button", { name: "筛选分类" }));
    fireEvent.click(screen.getByRole("tab", { name: "开源开发者生态" }));

    expect(screen.getByText("agent-memory：给 Agent 加一层长期记忆")).toBeInTheDocument();
    expect(screen.queryByText(TODAY_DIGEST.items[0].title)).not.toBeInTheDocument();
  });

  it("点击标题会打开详情", () => {
    const { onOpen } = renderTodayPage();

    fireEvent.click(screen.getByText(TODAY_DIGEST.items[0].title));

    expect(onOpen).toHaveBeenCalledWith(TODAY_DIGEST.items[0].id);
  });
});