# [2.0.0](https://github.com/prantlf/concat-source-text/compare/v1.0.0...v2.0.0) (2022-05-01)

### Features

* Support nested source maps ([8994998](https://github.com/prantlf/concat-source-text/commit/8994998a9bdcb1de99adc5af3183c98eefeacb34))

### BREAKING CHANGES

* If you used the `outputFile` parameter, move it from
the options passed to `join` to the `sourceMap` object inside the
options:

    - concatenator.join({ outputFile: '...', sourceMap: true })
    + concatenator.join({ sourceMap: { outputFile: '...' } })

# 1.0.0 (2022-04-30)

Initial release
