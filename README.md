![Gitfred](./alfred.png)

# Gitfred

In-memory git-like library for managing textual content

[Demo](https://demoit.app/e/ZLXBJMGKxiP)

## Installation

`npm install gitfred` / `yarn add gitfred`

or directly using [https://unpkg.com/gitfred](https://unpkg.com/gitfred)

## Usage

```js
const git = gitfred();

git.save({ filepath: "foo.js", content: "hello world" });
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
git.save({ filepath: "foo.js", content: "winter is coming" });
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

*Methods:*

* `save({ filepath:<string>, ...whatever })`
* `add(filepath:<string>)`
* `commit(message:<string>, meta:<any>`)`
* `show(hash:<string>)`
* `checkout(hash:<string>)`
* `staged():<staging area>`
* `working():<working directory>`
* `head():<hash>`
* `log():<all commits>`
* `export():<all data>`
* `import(data:<all data>)`
* `listen(callback:<function>)`

*Static vars:*

* `git.NOTHING_TO_COMMIT` - returned by `commit` method if there is nothing staged or there is no diff.
* `git.ON_SAVE` - send to the listener passed to `listen` method
* `git.ON_ADD` - send to the listener passed to `listen` method
* `git.ON_COMMIT` - send to the listener passed to `listen` method
* `git.ON_CHECKOUT` - send to the listener passed to `listen` method
