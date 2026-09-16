import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractOgImage } from "../src/images.js";

describe("extractOgImage", () => {
  it("解析 og:image", () => {
    const html = '<html><head><meta property="og:image" content="https://example.com/a.jpg" /></head></html>';
    assert.equal(extractOgImage(html), "https://example.com/a.jpg");
  });

  it("属性顺序颠倒也能解析", () => {
    const html = '<meta content="https://example.com/b.png" name="twitter:image">';
    assert.equal(extractOgImage(html), "https://example.com/b.png");
  });

  it("没有图片时返回空字符串", () => {
    assert.equal(extractOgImage("<html><head><title>x</title></head></html>"), "");
    assert.equal(extractOgImage(""), "");
  });
});