const test = require('tehanu')(__filename)
const { ok, strictEqual } = require('assert')
const exported = require('../lib')

test('exports a named class', () => {
  ok(typeof exported, 'object')
  strictEqual(typeof exported, 'object')
  strictEqual(typeof exported.SourceTextConcatenator, 'function')
})
