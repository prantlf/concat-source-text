const { readFileSync } = require('fs')
const { SourceMapGenerator, SourceMapConsumer } = require('source-map')
const {
  fromObject, fromComment, fromMapFileComment, generateMapFileComment,
  removeComments, removeMapFileComments, commentRegex2, mapFileCommentRegex
} = require('@prantlf/convert-source-map')

function readSourceMap(path) {
  return readFileSync(path, 'utf8')
}

function parseSource(text, source, mapDir, locateSourceMap) {
  // let match = text.match(commentRegex2)
  let match = commentRegex2.exec(text)
  if (match) {
    return {
      text: text.substring(0, match.index),
      map: fromComment(match[0]).sourcemap
    }
  }
  match = mapFileCommentRegex.exec(text)
  if (match) {
    let dir
    if (locateSourceMap) {
      const mapFile = match[1] || match[2]
      dir = locateSourceMap(mapFile, source)
    }
    /* c8 ignore next */
    if (!dir) dir = mapDir || '.'
    return {
      text: text.substring(0, match.index),
      map: fromMapFileComment(match[0], dir, readSourceMap).sourcemap
    }
  }
  return { text }
}

function joinTexts(texts, separator, readSourceMaps) {
  const chunks = []
  for (let { contents } of texts) {
    if (readSourceMaps) contents = removeMapFileComments(removeComments(contents))
    // Last empty string means that the contents ended with a line break
    const lines = contents.split('\n')
    const lineBreak = !lines[lines.length - 1]
    // Ensure line breaks after every chunk to keep line numbering correct
    if (!lineBreak) contents += '\n'
    chunks.push(contents)
  }
  return { text: chunks.join(separator) }
}

function addToSourceMap(generator, contents, source, lineOffset, sourcesContent) {
  // Lines of the chunk will add to the total length
  const lines = contents.split('\n')
  let lineCount = lines.length
  // Add line mappings to the source map, line numbers are based on one
  for (let i = 1; i <= lineCount; ++i) {
    generator.addMapping({
      generated: { line: lineOffset + i, column: 0 },
      original: { line: i, column: 0 },
      source
    })
  }
  // Store the content of the original in the source map
  if (sourcesContent) generator.setSourceContent(source, contents)
  // Last empty string means that the contents ended with a line break
  return { lineCount, lineBreak: !lines[lineCount - 1] }
}

function mergeSourceMap(generator, contents, map, lineOffset, sourcesContent) {
  const consumer = new SourceMapConsumer(map)
  // Clone the mappings from the input source map shifted by the current
  // line count of the output text
  consumer.eachMapping(mapping => {
    const newMapping = {
      generated: {
        line: lineOffset + mapping.generatedLine,
        column: mapping.generatedColumn
      }
    }
    if (mapping.source != null) {
      if (mapping.originalLine != null) {
        newMapping.source = mapping.source
        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        }
      }
      /* c8 ignore next */
      if (mapping.name != null) newMapping.name = mapping.name
    }
    generator.addMapping(newMapping)
  })
  // If there were more sources of the single source, transfer them
  // to the source maps of the output text
  if (sourcesContent) {
    for (const source of consumer.sources) {
      const contents = consumer.sourceContentFor(source)
      if (contents) generator.setSourceContent(source, contents)
    }
  }
  // Lines of the chunk will add to the total length
  const lines = contents.split('\n')
  let lineCount = lines.length
  // Last empty string means that the contents ended with a line break
  return { lineCount, lineBreak: !lines[lineCount - 1] }
}

function joinWithMap(texts, separator, { outputFile, sourcesContent, readSourceMaps, mapDir, locateSourceMap }) {
  const generator = new SourceMapGenerator({ file: outputFile })
  const separatorLen = separator.length
  const chunks = []
  let totalLen = 0
  for (let { contents, source } of texts) {
    // Separator is not before the first chunk
    if (totalLen) totalLen += separatorLen
    let { text, map } = readSourceMaps ? parseSource(contents, source, mapDir, locateSourceMap) : { text: contents }
    const { lineCount, lineBreak } = map
      ? mergeSourceMap(generator, text, map, totalLen, sourcesContent)
      : addToSourceMap(generator, text, source, totalLen, sourcesContent)
    totalLen += lineCount
    // Ensure line breaks after every chunk to keep line numbering correct
    if (!lineBreak) text += '\n'
    chunks.push(text)
  }
  return { text: chunks.join(separator), map: generator.toJSON() }
}

function prepareResult(text, map, { inline = true, external, outputFile, mapFile, multilineComment }) {
  if (external) {
    if (!mapFile) mapFile = `${outputFile}.map`
    const comment = generateMapFileComment(mapFile, { multiline: multilineComment })
    return { text: `${text}${comment}`, map }
  }
  if (inline) {
    const comment = fromObject(map).toComment({ multiline: multilineComment })
    return { text: `${text}${comment}` }
  }
  return { text, map }
}

exports.SourceTextConcatenator = class SourceTextConcatenator {
  #texts = []

  append(contents, source) {
    this.#texts.push({ contents, source })
  }

  join({ separator = '', sourceMap } = {}) {
    if (sourceMap) {
      if (sourceMap === true) sourceMap = { inline: true }
      const { inline, external, separate } = sourceMap
      if (!(inline !== false || external || separate !== false)) {
        return joinTexts(this.#texts, separator, sourceMap.readSourceMaps)
      }
      const { text, map } = joinWithMap(this.#texts, separator, sourceMap)
      return prepareResult(text, map, sourceMap)
    }
    return joinTexts(this.#texts, separator)
  }
}
