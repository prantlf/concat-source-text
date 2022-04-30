const { SourceMapGenerator } = require('source-map');
const { fromObject, generateMapFileComment } = require('@prantlf/convert-source-map')

function joinTexts(texts, separator) {
  const chunks = []
  for (let { contents } of texts) {
    // Last empty string means that the contents ended with a line break
    const lines = contents.split('\n')
    const lineBreak = !lines[lines.length - 1]
    // Ensure line breaks after every chunk to keep line numbering correct
    if (!lineBreak) contents += '\n'
    chunks.push(contents)
  }
  return { text: chunks.join(separator) }
}

function addToSourceMap(generator, contents, source, lineOffset) {
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
  // Last empty string means that the contents ended with a line break
  return { lineCount, lineBreak: !lines[lineCount - 1] }
}

function joinWithMap(texts, separator, outputFile, { sourcesContent }) {
  const generator = new SourceMapGenerator({ file: outputFile })
  const separatorLen = separator.length
  const chunks = []
  let totalLen = 0
  for (let { contents, source } of texts) {
    // Separator is not before the first chunk
    if (totalLen) totalLen += separatorLen
    const { lineCount, lineBreak } = addToSourceMap(generator, contents, source, totalLen)
    totalLen += lineCount
    // Store the content of the original in the source map
    if (sourcesContent) generator.setSourceContent(source, contents)
    // Ensure line breaks after every chunk to keep line numbering correct
    if (!lineBreak) contents += '\n'
    chunks.push(contents)
  }
  return { text: chunks.join(separator), map: generator.toJSON() }
}

function prepareResult(text, map, outputFile, { inline = true, external, mapFile, multilineComment }) {
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

  join({ separator = '', outputFile, sourceMap } = {}) {
    if (sourceMap) {
      if (sourceMap === true) sourceMap = { inline: true }
      const { text, map } = joinWithMap(this.#texts, separator, outputFile, sourceMap)
      return prepareResult(text, map, outputFile, sourceMap)
    }
    return joinTexts(this.#texts, separator)
  }
}
