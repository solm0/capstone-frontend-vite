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

// 아 근데... 나중에는 string만 가져오는게 아니라 빈도같은 gpu그래픽에 필요한
// 정보들도 다 같이 가져와야겠다 두번 왔다갔다할 필요 없잖아.

export interface CorpusFragment {
  lines: string[]
}

export interface LemmaExpansion {
  lemma: string,
  kwic: {
    rank: number;
    sentence: string;
  }[],
  relationships: {
    synonyms: string[];
    antonyms: string[];
  },
  hints: string[];
}

// breadcrumb

export interface TreeNode {
  lemma: string;
  children?: TreeNode[];
}