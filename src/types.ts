// user
export type User = {
  id: number
  email: string
}

// desk

export interface LayoutData {
  id: string; // 'cf', 'умирать'
  type: 'corpusFragment' | 'lemmaExpansion'
  author?: string;
  title?: string;
  content: CorpusFragment[] | LemmaExpansion
}

export interface Token {
  lemma: string;
  pos: string;
  surface: string;
  dep: string;
}

export interface CorpusFragment {
  date: string;
  text?: string;
  tokens: Token[]
}

export interface CorpusFragmentData {
  history: {
    date: string;
    lines: {
      poem_id: number;
      line_id: number;
      line_index: number;
      subline_index: number;
      text: string;
      complexity: number;
      tokens: {
        dep: string;
        lemma: string;
        pos: string;
        surface: string;
      }[]
      pos: string[];
      dep: string[];
      lemmas: string[];
      pattern: {num_clauses: number; has_obj: boolean};
    }[]
  }[]
}

export interface LemmaExpansion {
  lemma: string,
  pos: string,
  expansions: [
    // 1. relationships
    {
      type: string,
      content: {
        related_words: string[];
        antonyms: string[];
      }
    },
    // 2. kwic
    {
      type: string,
      content: { line_id:number, tokens:any[] }[];
    },
    // 3. hints
    {
      type: string,
      content: string[];
    }
  ],
}

// breadcrumb

export interface TreeNode {
  lemma: string;
  children?: TreeNode[];
}