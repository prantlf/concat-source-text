const test = require('tehanu')(__filename)
const { strictEqual, deepStrictEqual } = require('assert')
const exported = require('.')
const { SourceTextConcatenator } = exported

let concatenator

test.beforeEach(() => concatenator = new SourceTextConcatenator)

test('exports a named class', () => {
  strictEqual(typeof exported, 'object')
  strictEqual(typeof SourceTextConcatenator, 'function')
})

test('concatenates one source with no map', () => {
  concatenator.append('1\n', '1.txt')
  const out = concatenator.join()
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, '1\n')
  strictEqual(map, undefined)
})

test('appends line break with no map', () => {
  concatenator.append('1', '1.txt')
  const out = concatenator.join()
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, '1\n')
  strictEqual(map, undefined)
})

test('concatenates two sources with an inline map', () => {
  concatenator.append('1\n', '1.txt')
  concatenator.append('2\n', '2.txt')
  const out = concatenator.join({ sourceMap: true })
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, '1\n2\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjEudHh0IiwiMi50eHQiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQ0RBO0FBQ0EifQ==')
  strictEqual(map, undefined)
})

test('inserts inline map as a multiline comment', () => {
  concatenator.append('1', '1.txt')
  const out = concatenator.join({ sourceMap: { multilineComment: true} })
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, '1\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIjEudHh0Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBIn0= */')
  strictEqual(map, undefined)
})

test('appends line break with a separate map', () => {
  concatenator.append('1', '1.txt')
  concatenator.append('2', '2.txt')
  const out = concatenator.join({ sourceMap: { inline: false }})
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, '1\n2\n')
  deepStrictEqual(map, {
    version: 3,
    sources: ['1.txt', '2.txt'],
    names: [],
    mappings: 'AAAA;ACAA'
  })
})

test('allows custom separator with an external map', () => {
  concatenator.append('1', '1.txt')
  concatenator.append('2', '2.txt')
  const out = concatenator.join({ separator: '\n',
    sourceMap: { external: true, mapFile: 'out.txt.map' } })
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, '1\n\n2\n//# sourceMappingURL=out.txt.map')
  deepStrictEqual(map, {
    version: 3,
    sources: ['1.txt', '2.txt'],
    names: [],
    mappings: 'AAAA;;ACAA'
  })
})

test('inserts a multiline comment pointing to an external map', () => {
  concatenator.append('1', '1.txt')
  const out = concatenator.join(
    { sourceMap: { external: true, mapFile: 'out.txt.map', multilineComment: true } })
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, '1\n/*# sourceMappingURL=out.txt.map */')
  deepStrictEqual(map, {
    version: 3,
    sources: ['1.txt'],
    names: [],
    mappings: 'AAAA'
  })
})

test('allows target file name with sources content', () => {
  concatenator.append('1', '1.txt')
  concatenator.append('2', '2.txt')
  const out = concatenator.join({ outputFile: 'out.txt',
    sourceMap: { external: true, sourcesContent: true } })
  strictEqual(typeof out, 'object')
  const { text, map } = out
  strictEqual(text, '1\n2\n//# sourceMappingURL=out.txt.map')
  deepStrictEqual(map, {
    version: 3,
    file: 'out.txt',
    sources: ['1.txt', '2.txt'],
    names: [],
    mappings: 'AAAA;ACAA',
    sourcesContent: ['1','2']
  })
})
