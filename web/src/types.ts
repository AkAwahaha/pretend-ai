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
  sourceCategory?: string;
  title: string;
  summary: string;
  what: string;
  highlights: string;
  productView: string;
  sourceUrl: string;
  readTime: string;
  terms?: Term[];
  heat?: number;
  image?: string;
  featured: boolean;
}

export interface Term {
  term: string;
  explain: string;
}

export interface SearchEntry {
  id: string;
  date: string;
  title: string;
  summary: string;
  category: string;
  source: string;
  sourceKey?: SourceKey;
  heat: number;
  url: string;
}

export interface DailyDigest {
  date: string;
  label: string;
  headline: string;
  kicker: string;
  mainline?: string;
  takeaways?: string[];
  items: DigestItem[];
}
