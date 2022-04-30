# concat-source-text

[![Latest version](https://img.shields.io/npm/v/concat-source-text)
 ![Dependency status](https://img.shields.io/librariesio/release/npm/concat-source-text)
](https://www.npmjs.com/package/concat-source-text)

Concatenates text source files and generates a source map for the text output. Can be used to concatenate stylesheets and show the original source stylesheets in the debugger.

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

* `outputFile?`: sets a name of the output file to the source map
* `separator?`: inserts a string between two source files (an empty string (`''`) by default)
* `sourceMap?`: enables generating the source map (`false` by default)

If `sourceMap` is set to `true` or to `{}`, it will be converted to `{ inline: true }`. Otherwise an object is expected with the following properties:

#### SourceMap

* `inline?`: appends the source map as a comment to the output text (`true` by default, if `external` is not `true`)
* `external?`: appends a comment to the output text pointing to an external file with the source map (`false` by default)
* `mapFile?`: set the name of the external source map file in the comment
* `sourcesContent?`: includes the content of the source files in the source map
* `multilineComment?`: uses the multi-line comment (`/**# ... */`) instead of the single-line one (`//# ...`), which is the default

If both `inline` and `external` are set to `true`, `external` will be chosen and `inline` considered unset. If `inline` is set to `false` and `external` unset or set to `false`, a separate source map will be returned, but no comment will be appended to the output text.

If `mapFile` is not provided and it is needed for the comment, it will be computed from `outputFile` by appending ".map" to it.

#### Output

* `text`: the concatenated text
* `map?`: the source map, if `sourceMap` was set and was not `false`

## Example

Let us concatenate two stylesheets:

base.css:

    body: { padding: 1rem }

widgets.css:

    .container { display: flex }

By the following script:

```js
import { readFile, writeFile } from 'fs/promises'
import { SourceTextConcatenator } from 'concat-source-text'

const concatenator = new SourceTextConcatenator
concatenator.append(await readFile('base.css', 'utf8'), 'base.css')
concatenator.append(await readFile('widgets.css', 'utf8'), 'widgets.css')
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

    body: { padding: 1rem }

    .container { display: flex }
    /*# sourceMappingURL=main.css.map */

main.css.map:

```json
{
  "version": 3,
  "sources": ["base.css", "widgets.css"],
  "names": [],
  "mappings": "AAAA;AACA;;ACDA",
  "sourcesContent": ["body: { padding: 1rem }\n", ".container { display: flex }"]
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
