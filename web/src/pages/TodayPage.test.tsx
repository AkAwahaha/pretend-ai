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
  it("渲染精读与速览分区", () => {
    renderTodayPage();

    expect(screen.getByText("精读")).toBeInTheDocument();
    expect(screen.getByText("速览")).toBeInTheDocument();
    expect(screen.getByText(TODAY_DIGEST.items[0].title)).toBeInTheDocument();
  });

  it("按分类筛选内容", () => {
    renderTodayPage();

    fireEvent.click(screen.getByRole("tab", { name: "项目发现" }));

    expect(screen.getByText("agent-memory：给 Agent 加一层长期记忆")).toBeInTheDocument();
    expect(screen.queryByText(TODAY_DIGEST.items[0].title)).not.toBeInTheDocument();
  });

  it("点击标题会打开详情", () => {
    const { onOpen } = renderTodayPage();

    fireEvent.click(screen.getByText(TODAY_DIGEST.items[0].title));

    expect(onOpen).toHaveBeenCalledWith(TODAY_DIGEST.items[0].id);
  });
});
