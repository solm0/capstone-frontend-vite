export interface CorpusFragment {
  lines: string[]
}

export interface LayoutData {
  type: 'corpusFragment' | 'lemmaExpansion' | 'clozeTask' // 등등
  content: CorpusFragment
}

export interface SubToken {
  isRoot: boolean
  chars: string
}