export type SourceKey =
  | "openai"
  | "github"
  | "anthropic"
  | "deepmind"
  | "huggingface"
  | "tldr"
  | "a16z"
  | "menlo"
  | "arxiv"
  | "qbitai"
  | "aiera"
  | "infoq"
  | "techcrunch"
  | "theverge"
  | "arstechnica"
  | "hackernews"
  | "mittechreview"
  | "crunchbase"
  | "tmtpost"
  | "leiphone"
  | "ifanr";

export interface DigestItem {
  id: string;
  source: SourceKey;
  sourceLabel: string;
  category: string;
  title: string;
  summary: string;
  what: string;
  highlights: string;
  productView: string;
  sourceUrl: string;
  readTime: string;
  featured: boolean;
}

export interface DailyDigest {
  date: string;
  label: string;
  headline: string;
  kicker: string;
  items: DigestItem[];
}
