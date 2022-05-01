# concat-source-text

[![Latest version](https://img.shields.io/npm/v/concat-source-text)
 ![Dependency status](https://img.shields.io/librariesio/release/npm/concat-source-text)
](https://www.npmjs.com/package/concat-source-text)
[![Code coverage](https://codecov.io/gh/prantlf/concat-source-text/branch/master/graph/badge.svg?token=qLsarhf7g7)](https://codecov.io/gh/prantlf/concat-source-text)

Concatenates text source files and generates a source map for the text output. Can be used to concatenate stylesheets and show the original source stylesheets in the debugger. Supports nested source maps and merges them to the final output.

## Synopsis

Let us concatenate text content of two source files:

```js
import { SourceTextConcatenator } from 'concat-source-text'

const concatenator = new SourceTextConcatenator
concatenator.append('first content', 'first.txt')
concatenator.append('second content', 'second.txt')
const { text } = concatenator.join({ sourceMap: true })
console.log(text)
```

The console output will be:

    first content
    second content
    //# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpcnN0LnR4dCIsInNlY29uZC50eHQiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSJ9

And the decoded source map content:

```json
{"version":3,"sources":["first.txt","second.txt"],"names":[],"mappings":"AAAA;ACAA"}
```

## Installation

This module can be installed in your project using [NPM], [PNPM] or [Yarn]. Make sure, that you use [Node.js] version 12 or newer.

```sh
npm i concat-source-text
pnpm i concat-source-text
yarn add concat-source-text
```

## API

### constructor()

Creates a new empty instance of the concatenator.

### append(contents: string, source: string): void

Appends a text file to the output.

* `contents`: the contents of the file
* `source`: the name of the file

### join(options?: Options): Output

Concatenates the appended files and returns the complete text with the source map. A line break will be appended after each source text, if the source text does not already end with a line break.

#### Options

* `separator?`: inserts a string between two source files (an empty string (`''`) by default)
* `sourceMap?`: enables generating the source map (`false` by default)

If `sourceMap` is set to `true` or to `{}`, it will be converted to `{ inline: true }`. Otherwise an object is expected with the following properties:

#### SourceMap

* `inline?`: appends the source map as a comment to the output text (`true` by default, if `external` is not `true`)
* `external?`: appends a comment to the output text pointing to an external file with the source map (`false` by default)
* `separate?`: disables source map generation if set to `false` together with `inline`
* `outputFile?`: sets a name of the output file to the source map
* `mapFile?`: set the name of the external source map file in the comment
* `sourcesContent?`: includes the content of the source files in the source map
* `multilineComment?`: uses the multi-line comment (`/**# ... */`) instead of the single-line one (`//# ...`), which is the default
* `readSourceMaps?`: checks existence and reads source maps from input sources if detected
* `mapDir?`: directory to read a source map file from
* `locateSourceMap?`: returns directory to read a source map file from

If both `inline` and `external` are set to `true`, `external` will be chosen and `inline` considered unset. If `inline` is set to `false` and `external` unset or set to `false`, a separate source map will be returned, but no comment will be appended to the output text.

If `mapFile` is not provided and it is needed for the comment, it will be computed from `outputFile` by appending ".map" to it.

Setting `separate` can be used to strip source maps from the source files, if they are expected there: `{ inline: false, separate: false, readSourceMaps: true }`.

If the source map file is lot located on the path stored in the comment, usually resolved from the current directory, you can supply the directory by `mapDir`, or by a callback `locateSourceMap(mapFile: string, source: string): string | undefined`:

* `mapFile`: the name of the source map file parsed from the comment
* `source`: the name of the source, which the source map belongs to

#### Output

* `text`: the concatenated text
* `map?`: the source map, if `sourceMap` was set and was not `false`

## Example - CSS

Let us concatenate two stylesheets:

base.css:

```css
body { padding: 1rem }
```

widget.css:

```css
.container { display: flex }
```

By the following script:

```js
import { readFile, writeFile } from 'fs/promises'
import { SourceTextConcatenator } from 'concat-source-text'

const concatenator = new SourceTextConcatenator
concatenator.append(await readFile('base.css', 'utf8'), 'base.css')
concatenator.append(await readFile('widget.css', 'utf8'), 'widget.css')
const { text, map } = concatenator.join({
  separator: '\n',
  sourceMap: {
    external: true,
    mapFile: 'main.css.map',
    sourcesContent: true,
    multilineComment: true
  }
})
await writeFile('main.css', text)
await writeFile('main.css.map', JSON.stringify(map))
```

Then the result will be:

main.css:

```css
body { padding: 1rem }

.container { display: flex }
/*# sourceMappingURL=main.css.map */
```

main.css.map:

```json
{
  "version": 3,
  "sources": ["base.css", "widget.css"],
  "names": [],
  "mappings": "AAAA;AACA;;ACDA",
  "sourcesContent": ["body { padding: 1rem }\n", ".container { display: flex }"]
}
```

## Example - LESS

Let us concatenate two stylesheets:

base.css:

```css
body { padding: 1rem }
```

widget.css:

```less
.widget {
  background-color: #ddd;
}
.widget-active {
  background-color: #888;
}
/*# sourceMappingURL=widget.css.map */
```

widget.css.map:

```json
{
  "version": 3,
  "sources": ["widget.less"],
  "names": [],
  "mappings": "AAGA;EACE,sBAAA;;AAEA,OAAC;EACC,sBAAA",
  "file": "widget.css",
  "sourcesContent": ["@color-normal: #ddd;\n@color-active: #888;\n\n.widget {\n  background-color: @color-normal;\n\n  &-active {\n    background-color: @color-active;\n  }\n}\n"]
}
```

By the following script:

```js
import { readFile, writeFile } from 'fs/promises'
import { SourceTextConcatenator } from 'concat-source-text'

const concatenator = new SourceTextConcatenator
concatenator.append(await readFile('base.css', 'utf8'), 'base.css')
concatenator.append(await readFile('widget.css', 'utf8'), 'widget.css')
const { text, map } = concatenator.join({
  separator: '\n',
  sourceMap: {
    external: true,
    outputFile: 'main.css',
    sourcesContent: true,
    multilineComment: true,
    readSourceMaps: true
  }
})
await writeFile('main.css', text)
await writeFile('main.css.map', JSON.stringify(map))
```

Then the result will be:

main.css:

```css
body { padding: 1rem }

.widget {
  background-color: #ddd;
}
.widget-active {
  background-color: #888;
}
/*# sourceMappingURL=main.css.map */
```

main.css.map:

```json
{
  "version": 3,
  "sources": ["base.css", "widget.less"],
  "names": [],
  "mappings": "AAAA;;ACGA;EACE,sBAAA;;AAEA,OAAC;EACC,sBAAA",
  "file": "main.css",
  "sourcesContent": ["body { padding: 1rem }","@color-normal: #ddd;\n@color-active: #888;\n\n.widget {\n  background-color: @color-normal;\n\n  &-active {\n    background-color: @color-active;\n  }\n}\n"]
}
```

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Lint and test your code.

## License

Copyright (c) 2022 Ferdinand Prantl

Licensed under the MIT license.

[Node.js]: http://nodejs.org/
[NPM]: https://www.npmjs.com/
[PNPM]: https://pnpm.io/
[Yarn]: https://yarnpkg.com/
[@prantlf/convert-source-map]: https://www.npmjs.com/package/@prantlf/convert-source-map
