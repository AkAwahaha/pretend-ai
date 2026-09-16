import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TODAY_DIGEST } from "../data/mock";
import { ItemCard } from "./ItemCard";

const item = { ...TODAY_DIGEST.items[0], heat: 88 };

describe("ItemCard", () => {
  it("渲染来源、热度、标题与摘要", () => {
    render(
      <ItemCard item={item} favorite={false} onToggleFavorite={() => undefined} onOpen={() => undefined} />,
    );

    expect(screen.getByText(item.sourceLabel)).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    expect(screen.getByText(item.title)).toBeInTheDocument();
    expect(screen.getByText(item.summary)).toBeInTheDocument();
  });

  it("点击书签会触发收藏回调", () => {
    const onToggleFavorite = vi.fn();
    render(
      <ItemCard item={item} favorite={false} onToggleFavorite={onToggleFavorite} onOpen={() => undefined} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "收藏" }));

    expect(onToggleFavorite).toHaveBeenCalledWith(item.id);
  });
});