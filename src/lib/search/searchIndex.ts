export interface SearchDoc {
  id: string;
  type: "image" | "text";
  title: string;
  tags: string[];
  note?: string;
  captions?: string[];
  sourceUrl?: string;
  boardNames?: string[];
  textContent?: string;
  createdAt: number;
}

export interface SearchResult {
  id: string;
  score: number;
  doc: SearchDoc;
  matchedFields: string[];
}

export function tokenize(text: string): string[] {
  if (!text) return [];
  // Split on whitespace and non-alphanumeric punctuation
  const rawTokens = text.toLowerCase().split(/[\s,._\-/:;!?"'()[\]{}#@&+=]+/);
  return rawTokens.filter((t) => t.length > 0);
}

export class LocalSearchIndex {
  private docs = new Map<string, SearchDoc>();
  // Token -> Map of DocId -> FieldScores
  private invertedIndex = new Map<string, Map<string, number>>();

  public size(): number {
    return this.docs.size;
  }

  public clear(): void {
    this.docs.clear();
    this.invertedIndex.clear();
  }

  public addOrUpdateDoc(doc: SearchDoc): void {
    this.removeDoc(doc.id);
    this.docs.set(doc.id, doc);

    const indexField = (text: string | undefined, weight: number) => {
      if (!text) return;
      const tokens = tokenize(text);
      for (const tok of tokens) {
        let postings = this.invertedIndex.get(tok);
        if (!postings) {
          postings = new Map();
          this.invertedIndex.set(tok, postings);
        }
        const currentScore = postings.get(doc.id) || 0;
        postings.set(doc.id, currentScore + weight);
      }
    };

    // Weight allocations:
    // Tags: 12 (highest priority)
    for (const tag of doc.tags || []) {
      indexField(tag, 12);
    }

    // Title: 10
    indexField(doc.title, 10);

    // Captions: 7
    for (const cap of doc.captions || []) {
      indexField(cap, 7);
    }

    // Note: 6
    indexField(doc.note, 6);

    // Text Content (for text elements): 6
    indexField(doc.textContent, 6);

    // Source URL / domain: 4
    indexField(doc.sourceUrl, 4);

    // Board Names: 3
    for (const bName of doc.boardNames || []) {
      indexField(bName, 3);
    }
  }

  public removeDoc(id: string): void {
    if (!this.docs.has(id)) return;
    this.docs.delete(id);

    for (const postings of this.invertedIndex.values()) {
      postings.delete(id);
    }
  }

  public rebuild(docs: SearchDoc[]): void {
    this.clear();
    for (const doc of docs) {
      this.addOrUpdateDoc(doc);
    }
  }

  /**
   * Fast full-text, prefix, and substring search with relevance ranking.
   * Responsive from the very first character (active when qTok.length >= 1).
   * Runs in under 10ms for 5,000+ items.
   */
  public search(query: string): SearchResult[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    // Support #tag search
    const isTagSearch = trimmed.startsWith("#");
    const cleanQuery = isTagSearch ? trimmed.slice(1).trim() : trimmed;

    // If query is simply "#", return all tagged items
    if (isTagSearch && !cleanQuery) {
      const results: SearchResult[] = [];
      for (const doc of this.docs.values()) {
        if (doc.tags && doc.tags.length > 0) {
          results.push({
            id: doc.id,
            score: 10,
            doc,
            matchedFields: ["tag"],
          });
        }
      }
      return results;
    }

    const qTokens = tokenize(cleanQuery);
    if (qTokens.length === 0 && cleanQuery) {
      qTokens.push(cleanQuery);
    }
    if (qTokens.length === 0) return [];

    const scores = new Map<string, number>();
    const matchedTokensByDoc = new Map<string, Set<string>>();

    const recordScore = (docId: string, weight: number, token: string) => {
      scores.set(docId, (scores.get(docId) || 0) + weight);
      let set = matchedTokensByDoc.get(docId);
      if (!set) {
        set = new Set();
        matchedTokensByDoc.set(docId, set);
      }
      set.add(token);
    };

    for (const qTok of qTokens) {
      // 1. Exact token match (highest priority)
      const exactPostings = this.invertedIndex.get(qTok);
      if (exactPostings) {
        for (const [docId, weight] of exactPostings.entries()) {
          recordScore(docId, weight * 1.5, qTok);
        }
      }

      // 2. Prefix & Substring matching across inverted index (active from the 1st character!)
      for (const [indexTok, postings] of this.invertedIndex.entries()) {
        if (indexTok === qTok) continue;

        if (indexTok.startsWith(qTok)) {
          // Token starts with query (e.g. "p" -> "paper")
          const prefixMultiplier = qTok.length === 1 ? 0.7 : 0.9;
          for (const [docId, weight] of postings.entries()) {
            recordScore(docId, weight * prefixMultiplier, indexTok);
          }
        } else if (qTok.length >= 2 && indexTok.includes(qTok)) {
          // Token contains query as substring (e.g. "tab" -> "papertab")
          const subMultiplier = 0.4;
          for (const [docId, weight] of postings.entries()) {
            recordScore(docId, weight * subMultiplier, indexTok);
          }
        }
      }
    }

    // Direct fallback for titles, notes, text, and tags containing query substring
    for (const doc of this.docs.values()) {
      if (!scores.has(doc.id)) {
        if (doc.title && doc.title.toLowerCase().includes(cleanQuery)) {
          recordScore(doc.id, 5, cleanQuery);
        } else if (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(cleanQuery))) {
          recordScore(doc.id, 8, cleanQuery);
        } else if (doc.textContent && doc.textContent.toLowerCase().includes(cleanQuery)) {
          recordScore(doc.id, 4, cleanQuery);
        } else if (doc.captions && doc.captions.some((c) => c.toLowerCase().includes(cleanQuery))) {
          recordScore(doc.id, 5, cleanQuery);
        }
      }
    }

    const results: SearchResult[] = [];
    for (const [docId, score] of scores.entries()) {
      const doc = this.docs.get(docId);
      if (!doc) continue;

      const matchedFields: string[] = [];
      const terms = Array.from(matchedTokensByDoc.get(docId) || []);

      if (doc.tags?.some((t) => terms.some((term) => t.toLowerCase().includes(term)))) {
        matchedFields.push("tag");
      }
      if (terms.some((term) => doc.title.toLowerCase().includes(term))) {
        matchedFields.push("title");
      }
      if (doc.captions?.some((c) => terms.some((term) => c.toLowerCase().includes(term)))) {
        matchedFields.push("caption");
      }
      if (doc.note && terms.some((term) => doc.note!.toLowerCase().includes(term))) {
        matchedFields.push("note");
      }
      if (doc.textContent && terms.some((term) => doc.textContent!.toLowerCase().includes(term))) {
        matchedFields.push("text");
      }
      if (doc.boardNames?.some((b) => terms.some((term) => b.toLowerCase().includes(term)))) {
        matchedFields.push("board");
      }

      results.push({
        id: docId,
        score,
        doc,
        matchedFields,
      });
    }

    // Rank descending by score, tie-break by newer createdAt
    results.sort((a, b) => b.score - a.score || b.doc.createdAt - a.doc.createdAt);
    return results;
  }
}

export const searchIndex = new LocalSearchIndex();

export interface HighlightSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Splits text into highlighted and non-highlighted segments for UI rendering.
 */
export function highlightMatches(text: string, query: string): HighlightSegment[] {
  if (!text) return [];
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [{ text, isMatch: false }];

  // Build regex matching any of the query tokens
  const escaped = qTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");

  const parts = text.split(regex);
  return parts.filter(Boolean).map((part) => ({
    text: part,
    isMatch: qTokens.some((tok) => tok.toLowerCase() === part.toLowerCase()),
  }));
}
