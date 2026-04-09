// user
export type User = {
  id: number
  email: string
}

// desk

export interface LayoutData {
  id: string; // 'cf', 'умирать'
  type: 'corpusFragment' | 'lemmaExpansion' // 등등
  content: CorpusFragment | LemmaExpansion
}

export interface CorpusFragment {
  lines: {
    date: string;
    text: string;
  }[]
}

export interface LemmaExpansion {
  lemma: string,
  expansions: [
    // 1. relationships
    {
      type: string,
      content: {
        synonyms: string[];
        antonyms: string[];
      }
    },
    // 2. kwic
    {
      type: string,
      content: {
        rank: number;
        sentence: string;
      }[]
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