interface SourceMap {
  inline?: boolean /*= true*/
  external?: boolean
  separate?: boolean
  outputFile?: string
  mapFile?: string
  sourcesContent?: boolean
  multilineComment?: boolean,
  readSourceMaps?: boolean,
  mapDir?: string
  locateSourceMap?: (mapFile: string, source: string) => string | undefined
}

interface Options {
  separator?: string /*= ''*/
  sourceMap?: SourceMap | boolean
}

interface Map {
  version: 3
  sources: string[]
  names: []
  file?: string
  mappings: string
  sourcesContent?: string[]
}

interface Output {
  text: string
  map?: Map
}

declare class SourceTextConcatenator {
  append(contents: string, source: string): void
  join(options?: Options): Output
}
