import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NotesPage } from "./NotesPage";

describe("NotesPage", () => {
  it("创建独立笔记", () => {
    const onCreate = vi.fn();
    render(
      <NotesPage
        notes={[]}
        onCreate={onCreate}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("现在在想什么？"), {
      target: { value: "记录一个面试表达" },
    });
    fireEvent.click(screen.getByRole("button", { name: "收进灵感" }));

    expect(onCreate).toHaveBeenCalledWith("记录一个面试表达");
  });

  it("显示关联新闻并支持编辑删除", () => {
    const onUpdate = vi.fn();
    const onRemove = vi.fn();
    render(
      <NotesPage
        notes={[
          {
            id: "note-1",
            content: "我的判断",
            createdAt: 1,
            updatedAt: 2,
            link: {
              itemId: "item-1",
              title: "一条 AI 新闻",
              sourceLabel: "OpenAI",
              sourceUrl: "https://example.com/item",
              date: "2026-09-16",
            },
          },
        ]}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByText(/OpenAI · 一条 AI 新闻/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("编辑灵感"), { target: { value: "更新后的判断" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(onUpdate).toHaveBeenCalledWith("note-1", "更新后的判断");

    fireEvent.click(screen.getByRole("button", { name: "删除这条灵感" }));
    expect(onRemove).toHaveBeenCalledWith("note-1");
  });
});
