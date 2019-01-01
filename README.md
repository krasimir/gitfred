![Gitfred](./alfred.png)

# Gitfred <!-- omit in toc -->

> 24KB In-memory git-like library for managing textual content.

[Demo](https://demoit.app/e/ZLXBJMGKxiP)

- [Installation](#installation)
- [Usage](#usage)
- [API](#api)
  - [`save(filepath:<string>, file:<object>):<object>`](#savefilepathstring-fileobjectobject)
  - [`save(files:<object>):<object>`](#savefilesobjectobject)
  - [`saveAll(file:<object>):<object>`](#saveallfileobjectobject)
  - [`del(filepath:<string>):<object>`](#delfilepathstringobject)
  - [`rename(oldFilepath:<string>, newFilepath:<string>):<object>`](#renameoldfilepathstring-newfilepathstringobject)
  - [`getFile(filepath:<string>):<object>`](#getfilefilepathstringobject)
  - [`getFilepath(file:<object>):<string>`](#getfilepathfileobjectstring)
  - [`add(filepath:<string>):<object>`](#addfilepathstringobject)
  - [`add():<object>`](#addobject)
  - [`commit(message:<string>, meta:<object>):<string>`](#commitmessagestring-metaobjectstring)
  - [`amend(hash:<string>, message:<string>, meta:<object>):<object>`](#amendhashstring-messagestring-metaobjectobject)
  - [`show(hash:<string>):<object>`](#showhashstringobject)
  - [`checkout(hash:<string>, force:<boolean>):<object>`](#checkouthashstring-forcebooleanobject)
  - [`staged():<object>`](#stagedobject)
  - [`working():<object>`](#workingobject)
  - [`head():<string>`](#headstring)
  - [`log():<object>`](#logobject)
  - [`export():<object>`](#exportobject)
  - [`import(data:<object>):<object>`](#importdataobjectobject)
  - [`listen(callback:<function>):<nothing>`](#listencallbackfunctionnothing)
  - [`commitDiffToHTML(hash:<string>):<string>`](#commitdifftohtmlhashstringstring)
  - [Static variables:](#static-variables)
- [Scripts](#scripts)

## Installation

`npm install gitfred` / `yarn add gitfred`

or directly using [https://unpkg.com/gitfred](https://unpkg.com/gitfred)

## Usage

```js
const git = gitfred();

git.save("foo.js", { content: "hello world" });
```

We have no commits yet, but we have our file in the working directory. If we run `git.export()` we'll see the following:

```json
{
  "commits": {},
  "stage": {},
  "working": {
    "foo.js": {
      "content": "hello world"
    }
  },
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
  "stage": {
    "foo.js": {
      "content": "hello world"
    }
  },
  "working": {
    "foo.js": {
      "content": "hello world"
    }
  },
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
      "files": "{\"foo.js\":{\"content\":\"hello world\"}}"
    }
  },
  "stage": {},
  "working": {
    "foo.js": {
      "content": "hello world"
    }
  },
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
      "files": "{\"foo.js\":{\"content\":\"hello world\"}}"
    },
    "_2": {
      "message": "second commit",
      "parent": "_1",
      "files": "@@ -19,18 +19,24 @@\n t%22:%22\n-hello world\n+winter is coming\n %22%7D%7D\n"
    }
  },
  "stage": {},
  "working": {
    "foo.js": {
      "content": "winter is coming"
    }
  },
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
  "i": 2,
  "commits": {
    "_1": {
      "message": "first commit",
      "parent": null,
      "files": "{\"foo.js\":{\"content\":\"hello world\"}}"
    },
    "_2": {
      "message": "second commit",
      "parent": "_1",
      "files": "@@ -19,18 +19,24 @@\n t%22:%22\n-hello world\n+winter is coming\n %22%7D%7D\n"
    }
  },
  "stage": {},
  "working": {
    "foo.js": {
      "content": "hello world"
    }
  },
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
| returns       | `<object>`    | It returns the whole working directory which is basically a map with the same structure. |

### `saveAll(file:<object>):<object>`

Sometimes we need to update all the files at once with a single property. This method allows that.

|               | type          | description  |
| ------------- |:-------------:| -----|
| file       | `<object>`    | A file object (ex. `{ "content": "" }`) |
| returns       | `<object>`    | It returns the working directory. |

If we for example use `{ "content": "" }` all the files in the working directory will have empty `content` property.

### `del(filepath:<string>):<object>`

Deletes a file from the working directory.

|               | type          | description  |
| ------------- |:-------------:| -----|
| filepath       | `<string>`    | A file path (ex. `script.js`). |
| returns       | `<object>`    | It returns the working directory. |

### `rename(oldFilepath:<string>, newFilepath:<string>):<object>`

It renames a file or in other words updates a filepath but keeps the file object assign to it.

|               | type          | description  |
| ------------- |:-------------:| -----|
| oldFilepath       | `<string>`    | A file path (ex. `scriptA.js`). |
| newFilepath       | `<string>`    | A file path (ex. `scriptB.js`). |
| returns       | `<object>`    | It returns the working directory. |

### `getFile(filepath:<string>):<object>`

Gets a file behind a specific file path.

|               | type          | description  |
| ------------- |:-------------:| -----|
| filepath       | `<string>`    | A file path (ex. `script.js`). |
| returns       | `<object>`    | A file object. |

### `getFilepath(file:<object>):<string>`

Gets a file path which responds to a specific file object.

|               | type          | description  |
| ------------- |:-------------:| -----|
| file       | `<object>`    | A file object. |
| returns       | `<object>`    | A file path (ex. `script.js`) or `undefined` if the file object is not found. |

### `add(filepath:<string>):<object>`

Adds a file to the staging area.

|               | type          | description  |
| ------------- |:-------------:| -----|
| filepath       | `<string>`    | A file path (ex. `script.js`). |
| returns       | `<object>`    | It returns the staging area object which is map where the keys are filepaths and the values are file objects |

### `add():<object>`

Like the above one but it adds all the files from the working directory to the staging area.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<object>`    | It returns the staging area object which is map where the keys are filepaths and the values are file objects |

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

Gets a commit.

|               | type          | description  |
| ------------- |:-------------:| -----|
| hash       | `<string>`    | Hash of a commit. |
| returns       | `<object>`    | It returns a commit object. |

### `checkout(hash:<string>, force:<boolean>):<object>`

Sets the head to point to a specific commit.

|               | type          | description  |
| ------------- |:-------------:| -----|
| hash       | `<string>`    | Hash of a commit. |
| force       | `<boolean>`    | `false` by default. Gitfred throws an error if the staging area is empty or there is unstaged files. By setting this flag to `true` you are skipping those checks. |
| returns       | `<object>`    | It returns the updated working directory. |

### `staged():<object>`

Returns the staging area object which is map where the keys are filepaths and the values are file objects.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<object>`    | The staging area. |

### `working():<object>`

Returns the working directory object which is map where the keys are filepaths and the values are file objects.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<object>`    | The working directory. |

### `head():<string>`

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<string>`    |Returns a hash of a commit or `null`. |

### `log():<object>`

Get all the commits.

|               | type          | description  |
| ------------- |:-------------:| -----|
| returns       | `<object>`    | It returns all the commits. |

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

### Static variables:

* `git.ON_CHANGE` - send to the listener passed to `listen` method. Fired when something in the working directory is changed.
* `git.ON_ADD` - send to the listener passed to `listen` method
* `git.ON_COMMIT` - send to the listener passed to `listen` method
* `git.ON_CHECKOUT` - send to the listener passed to `listen` method

## Scripts

* `yarn release` - building the library
* `yarn test` - running the tests once
* `yarn dev` - running the tests in a *watch* mode
