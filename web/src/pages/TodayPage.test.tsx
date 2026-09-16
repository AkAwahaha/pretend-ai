import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TODAY_DIGEST } from "../data/mock";
import { TodayPage } from "./TodayPage";

function renderTodayPage() {
  const onToggleFavorite = vi.fn();
  const onSetMastery = vi.fn();
  const onOpen = vi.fn();
  render(
    <TodayPage
      digest={TODAY_DIGEST}
      isFavorite={() => false}
      getMastery={() => null}
      onToggleFavorite={onToggleFavorite}
      onSetMastery={onSetMastery}
      onOpen={onOpen}
    />,
  );
  return { onToggleFavorite, onSetMastery, onOpen };
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

  it("可以在首页快速记录灵感", () => {
    const onCreateNote = vi.fn();
    render(
      <TodayPage
        digest={TODAY_DIGEST}
        isFavorite={() => false}
        getMastery={() => null}
        onToggleFavorite={vi.fn()}
        onCreateNote={onCreateNote}
        onOpen={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("记下此刻的想法…"), {
      target: { value: "首页记录的想法" },
    });
    fireEvent.click(screen.getByRole("button", { name: "收进灵感" }));

    expect(onCreateNote).toHaveBeenCalledWith("首页记录的想法");
  });
  it("点击标题会打开详情", () => {
    const { onOpen } = renderTodayPage();

    fireEvent.click(screen.getByText(TODAY_DIGEST.items[0].title));

    expect(onOpen).toHaveBeenCalledWith(TODAY_DIGEST.items[0].id);
  });

  it("显示掌握按钮并把状态回传给页面", () => {
    const first = TODAY_DIGEST.items[0];
    const onSetMastery = vi.fn();
    render(
      <TodayPage
        digest={TODAY_DIGEST}
        isFavorite={() => false}
        getMastery={(id) => (id === first.id ? "mastered" : null)}
        onToggleFavorite={vi.fn()}
        onSetMastery={onSetMastery}
        onOpen={vi.fn()}
      />,
    );

    const doneButton = screen.getByRole("button", { name: `将「${first.title}」标记为已掌握` });
    expect(doneButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: `将「${first.title}」标记为未掌握` }));
    expect(onSetMastery).toHaveBeenCalledWith(first.id, "unmastered");
  });
});
