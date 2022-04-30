const test = require('tehanu')(__filename)
const { readFile } = require('fs/promises')
const { join } = require('path')
const { removeComments } = require('@prantlf/convert-source-map')
const { strictEqual, deepStrictEqual } = require('assert')
const { SourceTextConcatenator } = require('../lib')

let less, cssWithInlineMap, cssWithMapUrl, cssAlone, concatenator

test.before(async () => {
  less = await readFile(join(__dirname, 'widget.less'), 'utf8')
  cssWithInlineMap = await readFile(join(__dirname, 'widget-inline.css'), 'utf8')
  cssWithMapUrl = await readFile(join(__dirname, 'widget.css'), 'utf8')
  cssAlone = removeComments(cssWithInlineMap)
})

test.beforeEach(() => concatenator = new SourceTextConcatenator)

test('can strip input source map', () => {
  concatenator.append('1', '1.txt')
  const out = concatenator.join({
    sourceMap: { inline: false, separate: false, readSourceMaps: true }
  })
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, '1\n')
  strictEqual(map, undefined)
})

test('read from inline map', () => {
  concatenator.append('body { padding: 1rem }', 'base.css')
  concatenator.append(cssWithInlineMap, 'widget-inline.css')
  const out = concatenator.join({
    sourceMap: { inline: false, sourcesContent: true, readSourceMaps: true }
  })
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, `body { padding: 1rem }\n${cssAlone}`)
  deepStrictEqual(map, {
    version: 3,
    sources: ['base.css', 'widget.less'],
    names: [],
    mappings: 'AAAA;ACGA;EACE,sBAAA;;AAEA,OAAC;EACC,sBAAA',
    sourcesContent: ['body { padding: 1rem }', less]
  })
})

test('read from external map', () => {
  concatenator.append('body { padding: 1rem }', 'base.css')
  concatenator.append(cssWithMapUrl, 'widget.css')
  const out = concatenator.join({
    sourceMap: {
      inline: false,
      sourcesContent: true,
      readSourceMaps: true,
      mapDir: __dirname
    }
  })
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, `body { padding: 1rem }\n${cssAlone}`)
  deepStrictEqual(map, {
    version: 3,
    sources: ['base.css', 'widget.less'],
    names: [],
    mappings: 'AAAA;ACGA;EACE,sBAAA;;AAEA,OAAC;EACC,sBAAA',
    sourcesContent: ['body { padding: 1rem }', less]
  })
})

test('read from external map with dir callback', () => {
  concatenator.append('body { padding: 1rem }', 'base.css')
  concatenator.append(cssWithMapUrl, 'widget.css')
  const out = concatenator.join({
    separator: '\n',
    sourceMap: {
      inline: false,
      outputFile: 'main.css',
      sourcesContent: true,
      readSourceMaps: true,
      locateSourceMap(mapFile, source) {
        strictEqual(mapFile, 'widget.css.map')
        strictEqual(source, 'widget.css')
        return __dirname
      }
    }
  })
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, `body { padding: 1rem }\n\n${cssAlone}`)
  deepStrictEqual(map, {
    version: 3,
    sources: ['base.css', 'widget.less'],
    names: [],
    file: 'main.css',
    mappings: 'AAAA;;ACGA;EACE,sBAAA;;AAEA,OAAC;EACC,sBAAA',
    sourcesContent: ['body { padding: 1rem }', less]
  })
})
