import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NOTES_KEY, useNotes } from "./useNotes";

describe("useNotes", () => {
  it("创建独立笔记并持久化", () => {
    const { result } = renderHook(() => useNotes());

    act(() => {
      result.current.addNote({ content: "  一个产品想法  " });
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0].content).toBe("一个产品想法");
    expect(JSON.parse(window.localStorage.getItem(NOTES_KEY) ?? "[]")).toHaveLength(1);
  });

  it("创建关联新闻的笔记", () => {
    const { result } = renderHook(() => useNotes());

    act(() => {
      result.current.addNote({
        content: "这条新闻可以用于面试表达",
        link: {
          itemId: "openai-1",
          title: "OpenAI 发布新模型",
          sourceLabel: "OpenAI",
          sourceUrl: "https://example.com/openai",
          date: "2026-09-16",
        },
      });
    });

    expect(result.current.notes[0].link?.itemId).toBe("openai-1");
  });

  it("编辑和删除笔记", () => {
    const { result } = renderHook(() => useNotes());

    act(() => {
      result.current.addNote({ content: "原始内容" });
    });
    const id = result.current.notes[0].id;
    act(() => {
      result.current.updateNote(id, "更新后的内容");
    });
    expect(result.current.notes[0].content).toBe("更新后的内容");

    act(() => {
      result.current.removeNote(id);
    });
    expect(result.current.notes).toHaveLength(0);
  });

  it("从本地存储恢复笔记", () => {
    window.localStorage.setItem(
      NOTES_KEY,
      JSON.stringify([
        {
          id: "note-1",
          content: "恢复的想法",
          createdAt: 1,
          updatedAt: 2,
        },
      ]),
    );
    const { result } = renderHook(() => useNotes());

    expect(result.current.notes[0].content).toBe("恢复的想法");
  });
});
