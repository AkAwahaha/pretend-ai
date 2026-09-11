import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TODAY_DIGEST } from "../data/mock";
import { DeepCard } from "./DeepCard";

const item = TODAY_DIGEST.items[0];

describe("DeepCard", () => {
  it("渲染来源、标题与摘要", () => {
    render(
      <DeepCard item={item} favorite={false} onToggleFavorite={() => undefined} onOpen={() => undefined} />,
    );

    expect(screen.getByText(item.sourceLabel)).toBeInTheDocument();
    expect(screen.getByText(item.title)).toBeInTheDocument();
    expect(screen.getByText(item.summary)).toBeInTheDocument();
  });

  it("点击书签会触发收藏回调", () => {
    const onToggleFavorite = vi.fn();
    render(
      <DeepCard item={item} favorite={false} onToggleFavorite={onToggleFavorite} onOpen={() => undefined} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "收藏" }));

    expect(onToggleFavorite).toHaveBeenCalledWith(item.id);
  });
});
