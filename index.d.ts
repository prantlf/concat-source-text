interface SourceMap {
  inline?: boolean /*= true*/
  external?: boolean
  mapFile?: string
  sourcesContent?: boolean
  multilineComment?: boolean
}

interface Options {
  outputFile?: string
  separator?: string /*= ''*/
  sourceMap?: SourceMap | boolean
}

interface Output {
  text: string
  map?: object
}

declare class SourceTextConcatenator {
  append(contents: string, source: string): void
  join(options?: Options): Output
}
