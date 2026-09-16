import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractLinks, parseFeed, stripHtml } from "../src/rss.js";

describe("parseFeed", () => {
  it("解析 RSS 2.0 条目", () => {
    const xml = '<?xml version="1.0"?><rss><channel><item><title>Hello &amp; World</title><link>https://example.com/a</link><description><![CDATA[<p>Summary text</p>]]></description><pubDate>Mon, 01 Sep 2026 00:00:00 GMT</pubDate></item></channel></rss>';
    const items = parseFeed(xml);
    assert.equal(items.length, 1);
    assert.equal(items[0].title, "Hello & World");
    assert.equal(items[0].url, "https://example.com/a");
    assert.equal(items[0].summary, "Summary text");
  });

  it("解析 Atom 条目并取 alternate 链接", () => {
    const xml = '<?xml version="1.0"?><feed><entry><title>Atom Title</title><link rel="alternate" href="https://example.com/atom"/><summary>Atom summary</summary><updated>2026-09-01T00:00:00Z</updated></entry></feed>';
    const items = parseFeed(xml);
    assert.equal(items.length, 1);
    assert.equal(items[0].url, "https://example.com/atom");
    assert.equal(items[0].publishedAt, "2026-09-01T00:00:00Z");
  });

  it("从 enclosure 提取图片", () => {
    const xml = '<?xml version="1.0"?><rss><channel><item><title>With image</title><link>https://example.com/a</link><enclosure url="https://example.com/a.jpg" type="image/jpeg"/></item></channel></rss>';
    const items = parseFeed(xml);
    assert.equal(items[0].image, "https://example.com/a.jpg");
  });

  it("从正文 img 提取图片", () => {
    const xml = '<?xml version="1.0"?><rss><channel><item><title>With img</title><link>https://example.com/b</link><description><![CDATA[<p><img src="https://example.com/b.png"/></p>]]></description></item></channel></rss>';
    const items = parseFeed(xml);
    assert.equal(items[0].image, "https://example.com/b.png");
  });

  it("没有图片时返回空字符串", () => {
    const xml = '<?xml version="1.0"?><rss><channel><item><title>No image</title><link>https://example.com/c</link></item></channel></rss>';
    const items = parseFeed(xml);
    assert.equal(items[0].image, "");
  });

  it("过滤缺少标题或链接的条目", () => {
    const xml = "<?xml version=\"1.0\"?><rss><channel><item><title>只有标题</title></item></channel></rss>";
    assert.deepEqual(parseFeed(xml), []);
  });
});

describe("stripHtml", () => {
  it("去掉标签并解码常见实体", () => {
    assert.equal(stripHtml("<p>A&nbsp;B &amp; C</p>"), "A B & C");
  });
});

describe("extractLinks", () => {
  it("按规则提取去重后的链接", () => {
    const html = '<a href="/news/first">First article title</a><a href="/news/first">Duplicated title</a><a href="/about">About</a>';
    const links = extractLinks(html, "https://www.anthropic.com/news", "/news/", 5);
    assert.equal(links.length, 1);
    assert.equal(links[0].url, "https://www.anthropic.com/news/first");
  });
});