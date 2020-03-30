# minimist-string

`minimist-string` is a [minimist](https://github.com/substack/minimist) wrapper that is able to pasrse command line sentences as strings. The problem with `minimist` is that you need to give the arguments in an array with every argument in separated strings (as in node's `process.argv`). The following wouldn't work:

```javascript
console.log(minimist(['foo --bar "Hello!"']));
// { _: [ 'foo --bar "Hello!"' ] } wich is not what we want
```

The next logical step is doing:

```javascript
console.log(minimist('foo --bar "Hello!"'.split(' ')));
// { _: [ 'foo' ], bar: '"Hello!"' }
```

That actually returns what we expect. The problem comes when the user-defined string has spaces:

```javascript
console.log(minimist('foo --bar "Hello world!"'.split(' ')));
// { _: [ 'foo', 'world!"' ], bar: '"Hello' }
```
 Only `"Hello` gets to the `bar` parameter, while the rest of it gets to `argv._`, wich is a disaster. `minimist-string` solves this problem:

### Usage

```sh
npm install --save minimist-string
```

```javascript
const parseSentence = require('minimist-string');

console.log(parseSentence('foo --bar "Hello world!"'));
// { _: [ 'foo' ], bar: 'Hello world!' }
```

It even works with escaped quotes!

```javascript
console.log(parseSentence('foo --bar "Hello \\"world\\"!"'));
// { _: [ 'foo' ], bar: 'Hello "world"!' }
```