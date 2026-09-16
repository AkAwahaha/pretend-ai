import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TODAY_DIGEST } from "../data/mock";
import { DetailPage } from "./DetailPage";

describe("DetailPage", () => {
  it("把灵感关联到当前新闻", () => {
    const item = TODAY_DIGEST.items[0];
    const onCreateNote = vi.fn();
    render(
      <DetailPage
        item={item}
        favorite={false}
        onToggleFavorite={vi.fn()}
        onBack={vi.fn()}
        onCreateNote={onCreateNote}
      />,
    );

    expect(screen.getByRole("button", { name: "存入 Obsidian" })).toBeInTheDocument();
    expect(screen.getByText("在 Obsidian 中打开（手机可用）")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("这条内容让你想到什么？"), {
      target: { value: "这条可以用于面试回答" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存灵感" }));

    expect(onCreateNote).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "这条可以用于面试回答",
        link: expect.objectContaining({
          itemId: item.id,
          title: item.title,
          sourceUrl: item.sourceUrl,
        }),
      }),
    );
  });
});
