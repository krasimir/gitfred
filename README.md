![Gitfred](./alfred.png)

# Gitfred <!-- omit in toc -->

> In-memory git-like library for managing textual content.

I've made the library as part of my work on [demoit.app](https://demoit.app/) where I need to store multiple files and their different versions. Storing all the content every time simply doesn't scale so I needed a smarter approach. Something like Git but running in the browser. It needed to be lightweight and to provide similar diff/patch experience. That's what Gitfred is.

[Demo](https://demoit.app/e/ZLXBJMGKxiP)

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`save(filepath:<string>, file:<object>):<object>`](#savefilepathstring-fileobjectobject)
  - [`save(files:<object>):<object>`](#savefilesobjectobject)
  - [`discard():<object>`](#discardobject)
  - [`saveAll(file:<object>):<object>`](#saveallfileobjectobject)
  - [`del(filepath:<string>):<object>`](#delfilepathstringobject)
  - [`get(filepath:<string>):<object>`](#getfilepathstringobject)
  - [`getAll():<array>`](#getallarray)
  - [`rename(oldFilepath:<string>, newFilepath:<string>):<object>`](#renameoldfilepathstring-newfilepathstringobject)
  - [`getFilepath(file:<object>):<string>`](#getfilepathfileobjectstring)
  - [`exists(filepath:<string>):<boolean>`](#existsfilepathstringboolean)
  - [`add(filepath:<string>):<object>`](#addfilepathstringobject)
  - [`add():<object>`](#addobject)
  - [`commit(message:<string>, meta:<object>):<string>`](#commitmessagestring-metaobjectstring)
  - [`amend(hash:<string>, message:<string>, meta:<object>):<object>`](#amendhashstring-messagestring-metaobjectobject)
  - [`show(hash:<string>):<object>`](#showhashstringobject)
  - [`diff():<object>`](#diffobject)
  - [`adios(hash):<object>`](#adioshashobject)
  - [`checkout(hash:<string>, force:<boolean>):<object>`](#checkouthashstring-forcebooleanobject)
  - [`head():<string>`](#headstring)
  - [`log():<object>`](#logobject)
  - [`logAsTree():<object>`](#logastreeobject)
  - [`export():<object>`](#exportobject)
  - [`import(data:<object>):<object>`](#importdataobjectobject)
  - [`listen(callback:<function>):<nothing>`](#listencallbackfunctionnothing)
  - [`commitDiffToHTML(hash:<string>):<string>`](#commitdifftohtmlhashstringstring)
  - [`calcStrDiff(a:<string>, b:string):<object>`](#calcstrdiffastring-bstringobject)
  - [Static variables:](#static-variables)
- [Scripts](#scripts)

## Installation

`npm install gitfred` / `yarn add gitfred`

or directly using [https://unpkg.com/gitfred](https://unpkg.com/gitfred)

## Usage

```js
const git = gitfred();

git.save("foo.js", { content: "hello winter" });
```

We have no commits yet, but we have our file in the working directory. If we run `git.export()` we'll see the following:

```json
{
  "commits": {},
  "stage": [],
  "working": [
    [
      "foo.js",
      { "content": "hello winter" }
    ]
  ],
  "head": null
}
```

Let's stage our file.

```js
git.add('foo.js');
```

No we have our file staged. The working directory and our staging area contain the same information.

```json
{
  "commits": {},
  "stage": [
    [
      "foo.js",
      { "content": "hello winter" }
    ]
  ],
  "working": [
    [
      "foo.js",
      { "content": "hello winter" }
    ]
  ],
  "head": null
}
```

Let's make our first commit:

```js
git.commit('first commit');
```

We just created a new commit with a hash equal to `_1`. There is nothing in our staging area and `head` now points to our first commit.

```json
{
  "commits": {
    "_1": {
      "message": "first commit",
      "parent": null,
      "files": "[[\"foo.js\",{\"content\":\"hello winter\"}]]"
    }
  },
  "stage": [],
  "working": [
    [
      "foo.js",
      { "content": "hello winter" }
    ]
  ],
  "head": "_1"
}
```

We'll continue by editing our file and making another commit.

```js
git.save("foo.js", { content: "winter is coming" });
git.add('foo.js');
git.commit('second commit');
```

There are two commits now and `head` points to the second one (with a hash of `_2`).

```json
{
  "commits": {
    "_1": {
      "message": "first commit",
      "parent": null,
      "files": "[[\"foo.js\",{\"content\":\"hello winter\"}]]"
    },
    "_2": {
      "message": "second commit",
      "parent": "_1",
      "files": "@@ -20,20 +20,25 @@\n t\":\"\n-hello \n winter\n+ is comming\n \"}]]\n"
    }
  },
  "stage": [],
  "working": [
    [
      "foo.js",
      { "content": "winter is comming" }
    ]
  ],
  "head": "_2"
}
```

Also notice that the second commit does not contain the whole file but a patch on top of the first commit.

We may now go back to our first commit:

```js
git.checkout('_1');
```

The head again points to `_1` and our working directory contains also the files from that first commit.

```json
{
  "commits": {
    "_1": {
      "message": "first commit",
      "parent": null,
      "files": "[[\"foo.js\",{\"content\":\"hello winter\"}]]"
    },
    "_2": {
      "message": "second commit",
      "parent": "_1",
      "files": "@@ -20,20 +20,25 @@\n t\":\"\n-hello \n winter\n+ is comming\n \"}]]\n"
    }
  },
  "stage": [],
  "working": [
    [
      "foo.js",
      { "content": "hello winter" }
    ]
  ],
  "head": "_1"
}
```

## API

### `save(filepath:<string>, file:<object>):<object>`

Saves a file in the working directory.

|               | type          | description  |
| ------------- |:-------------:| -----|
| filepath       | `<string>`    | A file path (ex. `script.js`). |
| file       | `<object>`    | A file object (ex. `{ "content": "let foo = 'bar';" }`). |
| returns       | `<object>`    | A file object. |

### `save(files:<object>):<object>`

Saves multiple files in the working directory.

|               | type          | description  |
| ------------- |:-------------:| -----|
| files       | `<object>`    | A map where the keys are filepaths and the values are file objects. (ex. `{ "script.js": { content: "let foo = 'bar';" } }`) |
| returns       | `<object>`    | Gitfred instance. |

### `discard():<object>`

Cleans up the working directory.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<object>`    | Gitfred instance. |

### `saveAll(file:<object>):<object>`

Sometimes we need to update all the files at once with a single property. This method allows that.

|               | type          | description  |
| ------------- |:-------------:| -----|
| file       | `<object>`    | A file object (ex. `{ "content": "" }`) |
| returns       | `<object>`    | Gitfred instance. |

If we for example use `{ "content": "" }` all the files in the working directory will have empty `content` property.

### `del(filepath:<string>):<object>`

Deletes a file from the working directory.

|               | type          | description  |
| ------------- |:-------------:| -----|
| filepath       | `<string>`    | A file path (ex. `script.js`). |
| returns       | `<object>`    | Gitfred instance. |

### `get(filepath:<string>):<object>`

Gets a file (from the working directory) behind a specific file path.

|               | type          | description  |
| ------------- |:-------------:| -----|
| filepath       | `<string>`    | A file path (ex. `script.js`). |
| returns       | `<object>`    | A file object or `undefined` if the file is not found. |

### `getAll():<array>`

Gets all the files in the working directory.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<array>`    | An array with all the files. |

### `rename(oldFilepath:<string>, newFilepath:<string>):<object>`

It renames a file or in other words updates a filepath but keeps the file object assign to it.

|               | type          | description  |
| ------------- |:-------------:| -----|
| oldFilepath       | `<string>`    | A file path (ex. `scriptA.js`). |
| newFilepath       | `<string>`    | A file path (ex. `scriptB.js`). |
| returns       | `<object>`    | Gitfred instance. |

### `getFilepath(file:<object>):<string>`

Gets a file path which responds to a specific file object.

|               | type          | description  |
| ------------- |:-------------:| -----|
| file       | `<object>`    | A file object. |
| returns       | `<object>`    | A file path (ex. `script.js`) or `undefined` if the file object is not found. |

### `exists(filepath:<string>):<boolean>`

Checks if the file exists in the current working directory.

|               | type          | description  |
| ------------- |:-------------:| -----|
| filepath       | `<string>`    | A file path. |
| returns       | `<boolean>`    | `true` or `false`. |

### `add(filepath:<string>):<object>`

Adds a file to the staging area.

|               | type          | description  |
| ------------- |:-------------:| -----|
| filepath       | `<string>`    | A file path (ex. `script.js`). |
| returns       | `<object>`    | Gitfred instance. |

### `add():<object>`

Like the above one but it adds all the files from the working directory to the staging area.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<object>`    | Gitfred instance. |

### `commit(message:<string>, meta:<object>):<string>`

Registers a commit, cleans the staging area and sets the head to point to the new commit.

|               | type          | description  |
| ------------- |:-------------:| -----|
| message       | `<string>`    | The message of the commit |
| meta       | `<object>`    | Optional. A meta data that could be attached to the commit. (ex. `{ flag: true }`) |
| returns       | `<string>`    | The hash of the commit which is nothing fancy but `_<number>` |

### `amend(hash:<string>, message:<string>, meta:<object>):<object>`

Amends an already existing commit. (only the message and the meta)

|               | type          | description  |
| ------------- |:-------------:| -----|
| hash       | `<string>`    | Hash of the commit that needs to be amended. |
| message       | `<string>`    | The message of the commit |
| meta       | `<object>`    | Optional. A meta data that could be attached to the commit. (ex. `{ flag: true }`) |
| returns       | `<object>`    | It returns the commit object. |

### `show(hash:<string>):<object>`

Gets a commit behind a specific hash. If used with no arguments returns the commit where the head points to.

|               | type          | description  |
| ------------- |:-------------:| -----|
| hash       | `<string>`    | Hash of a commit. |
| returns       | `<object>`    | It returns a commit object. |

### `diff():<object>`

Shows the diff between the current working directory and the commit which the head points to.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<object>`    | It returns `null` if there's no diff or an object `{ text:<string>, html:<string> }`. |

### `adios(hash):<object>`

You probably wonder why I picked such a method name right? This method deletes a specific commit. There is no such a thing in Git. We have `revert` and `rebase` but that's not really deleting. Gitfred has ridicules simple structure and it is quite easy to implement such functionality. 

|               | type          | description  |
| ------------- |:-------------:| -----|
| hash       | `<string>`    | Hash of a commit. |
| returns       | `<object>`    | It returns the commit which is deleted. |

### `checkout(hash:<string>, force:<boolean>):<object>`

Sets the head to point to a specific commit.

|               | type          | description  |
| ------------- |:-------------:| -----|
| hash       | `<string>`    | Hash of a commit. |
| force       | `<boolean>`    | `false` by default. Gitfred throws an error if the staging area is empty or there is unstaged files. By setting this flag to `true` you are skipping those checks. |
| returns       | `<object>`    | Gitfred instance. |

### `head():<string>`

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<string>`    |Returns a hash of a commit or `null`. |

### `log():<object>`

Get all the commits.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<object>`    | It returns all the commits in a single object where the commit hash is a key and the commit object a value. |

### `logAsTree():<object>`

Get all the commits.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<object>`    | It returns all the commits in a tree of objects. |

### `export():<object>`

It dumps all the data of Gitfred.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<object>`    | All the data of Gitfred. |

### `import(data:<object>):<object>`

The opposite of `export` method.

|               | type          | description  |
| ------------- |:-------------:| -----|
| data       | `<object>`    | Gitfred data. |
| returns       | `<object>`    | The working directory object. |

### `listen(callback:<function>):<nothing>`

Send a listener function which will be called when the working tree is changed (`ON_CHANGE` event), when the staging area is changed (`ON_ADD` event), when a new commit is made (`ON_COMMIT` event) and when the head is updated (`ON_CHECKOUT` event).

|               | type          | description  |
| ------------- |:-------------:| -----|
| callback       | `<function>`    | Fired with either one of the following: `ON_CHANGE`, `ON_ADD`, `ON_COMMIT`, or `ON_CHECKOUT`. |
| returns       | `<nothing>`    |  |

### `commitDiffToHTML(hash:<string>):<string>`

It returns a HTML string containing the diff in a specific commit

|               | type          | description  |
| ------------- |:-------------:| -----|
| hash       | `<string>`    | Hash of a commit. |
| returns       | `<string>`    | HTML string. |

### `calcStrDiff(a:<string>, b:string):<object>`

Compares string `a` with string `b`. Returns either `null` or a diff object which contains `text` and `html` properties.

|               | type          | description  |
| ------------- |:-------------:| -----|
| a       | `<string>`    | Old Text |
| b       | `<string>`    | New text |
| returns       | `<string>`    | `null` or object `{ text:<string>, html:<string> }`. |

### Static variables:

* `git.ON_CHANGE` - send to the listener passed to `listen` method. Fired when something in the working directory is changed.
* `git.ON_ADD` - send to the listener passed to `listen` method
* `git.ON_COMMIT` - send to the listener passed to `listen` method
* `git.ON_CHECKOUT` - send to the listener passed to `listen` method

## Scripts

* `yarn release` - building the library
* `yarn test` - running the tests once
* `yarn dev` - running the tests in a *watch* mode
