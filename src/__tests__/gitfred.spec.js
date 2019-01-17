global.diff_match_patch = require('../vendor/diff-match-patch');

const gitfred = require('../gitfred');

const isEmpty = obj => Object.keys(obj).length === 0 && obj.constructor === Object;

let git;

describe('Given the gitfred library', () => {
  beforeEach(() => {
    git = gitfred();
  });

  /* ************************************************************************************** .save */

  describe('when using the `.save` method', () => {
    it('should throw an error if the required fields are missing or wrong type', () => {
      expect(() => git.save()).toThrowError();
      expect(() => git.save({}, { content: 'bar' })).toThrowError();
      expect(() => git.save('foo', { content: 'bar' })).not.toThrowError();
    });
    it('should store a file in the working directory', () => {
      const f = git.save('script.js', { content: 'let a = 10;' });
      expect(f).toStrictEqual({ content: 'let a = 10;' });
      expect(git.get('script.js')).toStrictEqual({ content: 'let a = 10;' });
    });
    it('should modify the file if it is already staged', () => {
      git.save('script.js', { content: 'let a = 10;' });
      git.save('script.js', { content: 'let a = 20;' });
      expect(git.get('script.js')).toStrictEqual({ content: 'let a = 20;' });
    });
    it('should append and not replace a file', () => {
      git.save('script.js', { content: 'let a = 10;', flag: true });
      git.save('script.js', { content: 'let b = 20;' });
      expect(git.get('script.js')).toStrictEqual({ content: 'let b = 20;', flag: true });
    });
    it('should allow storing meta data', () => {
      git.save('script.js', { content: 'let a = 10;', flag: true });
      expect(git.get('script.js')).toStrictEqual({ content: 'let a = 10;', flag: true });
    });
    describe('when using the `.batchSave` method', () => {
      it('should changing multiple files at once', () => {
        git.save({
          'a.js': { foo: 'bar' },
          'b.js': { bar: 'foo' }
        });
        git.save({
          'a.js': { a: 'b' },
          'b.js': { c: 'd' }
        });
  
        expect(git.get('a.js')).toStrictEqual({
          "a": "b",
          foo: 'bar'
        });
        expect(git.get('b.js')).toStrictEqual({
          "c": "d",
          bar: 'foo'
        });
      });
    });
    describe('when using the `.saveAll` method', () => {
      it('should amend all the files in the working directory', () => {
        git.save('a.js', { foo: 'bar' });
        git.save('b.js', { bar: 'foo' });
        git.saveAll({ x: 'y' });
        git.save('b.js', { x: 'z' });

        expect(git.get('a.js')).toStrictEqual({
          "foo": "bar",
          "x": "y"
        });
        expect(git.get('b.js')).toStrictEqual({
          "bar": "foo",
          "x": "z"
        });
      });
    });
  });

  /* ************************************************************************************** .discard */
  describe('when using the `.discard` method', () => {
    it('should clean up the working directory', () => {
      git.save('script.js', { content: 'let a = 10;', flag: true });
      git.add();
      git.commit('first');
      expect(git.getAll()).toStrictEqual([
        [ "script.js", { "content": "let a = 10;", "flag": true } ]
      ]);
      git.save('script.js', { content: 'let a = 20;', flag: false });
      git.discard();
      expect(git.getAll()).toStrictEqual([
        [ "script.js", { "content": "let a = 10;", "flag": true } ]
      ]);
    });
  });

  /* ************************************************************************************** .delete */

  describe('when using the `.delete` method', () => {
    it('should delete a file from the working directory', () => {
      git.save('script.js', { content: 'let a = 10;', flag: true });
      git.del('script.js');
      expect(git.get('script.js')).toEqual(undefined);
    });
    it('should delete a file even if we pass the file directly', () => {
      const f = git.save('script.js', { content: 'let a = 10;', flag: true });

      git.del(f);
      expect(git.get('script.js')).toEqual(undefined);
    });
    it('should throw an error if we try to delete a file that does not exists', () => {
      git.save('script.js', { content: 'let a = 10;', flag: true });
      expect(() => git.del('a.js'))
        .toThrowError(new Error('There is no file with path a.js.'));
    });
  });

  /* ************************************************************************************** .rename */

  describe('when using the `.rename` method', () => {
    it('should rename a file from the working directory', () => {
      git.save('script.js', { content: 'let a = 10;', flag: true });
      git.rename('script.js', 'foo.js');
      expect(git.get('foo.js')).toStrictEqual({
        "content": "let a = 10;",
        "flag": true
      })
    });
  });

  /* ************************************************************************************** other utility methods */

  describe('when using the `.get` method', () => {
    it('should return a file by provided filename', () => {
      git.save('script.js', { content: 'let a = 10;', flag: true });
      git.save('foo.js', { content: 'xxx' });
      expect(git.get('script.js')).toStrictEqual({ content: 'let a = 10;', flag: true });
    });
  });
  describe('when using the `.getAll` method', () => {
    it('should return all the files in the working directory', () => {
      git.save('script.js', { content: 'let a = 10;', flag: true });
      git.save('foo.js', { content: 'xxx' });
      expect(git.getAll()).toStrictEqual([
        [
          "script.js",
          { "content": "let a = 10;", "flag": true }
        ],
        [
          "foo.js",
          { "content": "xxx" }
        ]
      ]);
    });
  });
  describe('when using the `.getFilepath` method', () => {
    it('should return a filepath by provided file', () => {
      const file = git.save('script.js', { foo: 'bar' });
      git.save('foo.js', { content: 'xxx' });
      expect(git.getFilepath(file)).toEqual('script.js');
    });
  });
  describe('when using the `.exists` method', () => {
    it('should return a boolean indicating if the file exists or not', () => {
      git.save('script.js', { foo: 'bar' });
      expect(git.exists('foo.js')).toEqual(false);
      expect(git.exists('script.js')).toEqual(true);
    });
  });
  describe('when using the `.logAsTree` method', () => {
    it('should return a list of the commits but in a tree format', () => {
      expect(git.logAsTree()).toEqual(null);
      const hash = (git.save('script.js', { foo: '1' }), git.add(), git.commit('first'));
      git.save('script.js', { foo: '2' }); git.add(); git.commit('second');
      git.save('script.js', { foo: '3' }); git.add(); git.commit('third');
      git.checkout(hash);
      git.save('script.js', { foo: '4' }); git.add(); git.commit('fourth');

      expect(git.logAsTree()).toStrictEqual({
        "message": "first",
        "parent": null,
        "files": "[[\"script.js\",{\"foo\":\"1\"}]]",
        "hash": "_1",
        "derivatives": [
          {
            "message": "second",
            "parent": "_1",
            "files": "@@ -19,9 +19,9 @@\n o\":\"\n-1\n+2\n \"}]]\n",
            "hash": "_2",
            "derivatives": [
              {
                "message": "third",
                "parent": "_2",
                "files": "@@ -19,9 +19,9 @@\n o\":\"\n-2\n+3\n \"}]]\n",
                "hash": "_3",
                "derivatives": []
              }
            ]
          },
          {
            "message": "fourth",
            "parent": "_1",
            "files": "@@ -19,9 +19,9 @@\n o\":\"\n-1\n+4\n \"}]]\n",
            "hash": "_4",
            "derivatives": []
          }
        ]
      })
    });
  });
  describe('when using the `.calcDiff` method', () => {
    it('should return a diff object', () => {
const a = `
  hello world
  third line
`;
const b = `
  Hello world, and this is a text
  on multiple
  lines.
  third line`;
      // console.log(JSON.stringify(git.calcStrDiff(a, b), null, 2));
      expect(git.calcStrDiff(a, b)).toStrictEqual({
        "text": "@@ -1,12 +1,12 @@\n %0A  \n-h\n+H\n ello wor\n@@ -7,16 +7,59 @@\n lo world\n+, and this is a text%0A  on multiple%0A  lines.\n %0A  third\n@@ -63,9 +63,8 @@\n ird line\n-%0A\n",
        "html": "<span><br />  </span><del>h</del><ins>H</ins><span>ello wor</span><hr /><span>lo world</span><ins>, and this is a text<br />  on multiple<br />  lines.</ins><span><br />  third</span><hr /><span>ird line</span><del><br /></del>"
      });
      expect(git.calcStrDiff('a', 'a')).toEqual(null);
    });
  });

  /* ************************************************************************************** .add */

  describe('when using the `.add` method', () => {
    it('should throw an error if we pass a filepath that does not exists in the working directory', () => {
      expect(() => git.add('foo.js')).toThrowError();
    });
    it('should store a cloned file from the working directory to the staging area', () => {
      git.save('script.js', { content: 'let a = 10;', flag: true });
      git.add('script.js');
      expect(git.staged().get('script.js')).toStrictEqual({ content: 'let a = 10;', flag: true });
    });
    it('the working directory should contain a cloned data', () => {
      git.save('script.js', { content: 'let a = 10;', flag: true });
      git.add('script.js');
      git.save('script.js', { content: 'let b = 20;' });
      expect(git.staged().get('script.js')).toStrictEqual({ content: 'let a = 10;', flag: true });
    });
    it('should stage all the files from the working directory if called with no arguments', () => {
      git.save('bar.js', { content: 'let a = 10;', flag: true });
      git.save('foo.js', { content: '// comment here\n// and there' });
      git.add();
      expect(git.get('bar.js')).toStrictEqual({ content: 'let a = 10;', flag: true });
      git.save('bar.js', { content: 'foo', flag: true });
      expect(git.get('bar.js')).toStrictEqual({ content: 'foo', flag: true });
      expect(git.staged().get('foo.js')).toStrictEqual({ content: '// comment here\n// and there' });
    });
  });

  /* ************************************************************************************** .commit */

  describe('when using the `.commit` method', () => {
    it('should throw NOTHING_TO_COMMIT if there is nothing staged', () => {
      git.save('script.js', { content: 'let a = 10;' });
      expect(() => git.commit('foo')).toThrowError(new Error('NOTHING_TO_COMMIT'));
    });
    describe('and there are no other commits', () => {
      it(`should create one commit with no parent
          should point the head to that new commit
          should clear the staged items`, () => {
        git.save('script.js', { content: 'let a = 10;' });
        git.add();

        expect(isEmpty(git.log())).toEqual(true);

        const hash = git.commit('my first commit');
        
        expect(isEmpty(git.log())).not.toEqual(true);
        expect(git.staged().length()).toEqual(0);
        expect(git.head()).toEqual(hash);
        expect(git.log()[hash]).toStrictEqual({
          files: '[[\"script.js\",{\"content\":\"let a = 10;\"}]]',
          message: 'my first commit',
          parent: null
        });
      });
    });
    describe('and there ARE other commits', () => {
      it(`should point the head to the new commit
          should set a parent of the new commit
          should store only the diff between the commits`, () => {
        const dmp = new diff_match_patch();
        const hash1 = (git.save('foo.js', { content: 'let a = 10;' }), git.add(), git.commit('first'));
        const hash2 = (git.save('foo.js', { content: 'let a = 20;' }), git.add(), git.commit('second'));

        const commit1 = git.log()[hash1];
        const commit2 = git.log()[hash2];

        expect(git.head()).toEqual(hash2);
        expect(commit2.parent).toEqual(hash1);

        expect(git.export().commits._2.files).toEqual("@@ -28,9 +28,9 @@\n a = \n-1\n+2\n 0;\"}\n")

        expect(JSON.parse(dmp.patch_apply(dmp.patch_fromText(commit2.files), commit1.files).shift())).toStrictEqual(
          [['foo.js', { content: 'let a = 20;' }]]
        );
      });
    });
    it('should allow storing meta along side every commit', () => {
      const hash = (git.save('script.js', { content: 'let a = 10;' }), git.add(), git.commit('com', { meta: true }));

      expect(git.show(hash).meta).toStrictEqual({ meta: true });
    });
    it('should allow empty commits', () => {
      (git.save('a', { content: 'b' }), git.add(), git.commit('first'));
      const hash = (git.save('a', { content: 'b' }), git.add(), git.commit('second'));
      (git.save('a', { content: 'c' }), git.add(), git.commit('third'));
      git.checkout(hash);
      (git.save('a', { content: 'd' }), git.add(), git.commit('fourth'));

      expect(Object.keys(git.log()).length).toEqual(4);
    });
    it('should deal with texts that contain %', () => {
      git.save('a', { content: 'b' });
      git.add();
      git.commit('first');
      git.save('b', { content: '50%' })
      git.add();
      git.commit('second');
      git.save('b', { content: 'it should wor' });
      git.add();
      git.commit('third');

      expect(Object.keys(git.log()).length).toEqual(3);
    });
  });

  /* ************************************************************************************** .checkout */

  describe('when using `.checkout` method', () => {
    it('should throw an error UNCOMMITED_CHANGES if there are files which are not commited', () => {
      const hash = (git.save('x', { content: 'A' }), git.add(), git.commit('first'));
      (git.save('x', { content: 'C' }), git.add());
      expect(() => git.checkout(hash)).toThrowError(new Error('UNCOMMITED_CHANGES'));
    });
    it('should throw an error UNSTAGED_FILES if there are files which are not staged', () => {
      const hash = (git.save('x', { content: 'A' }), git.add(), git.commit('first'));
      (git.save('x', { content: 'B' }), git.add(), git.commit('second'));
      git.save('x', { content: 'C' });
      expect(() => git.checkout(hash)).toThrowError(new Error('UNSTAGED_FILES'));
    });
    it('should set the working directory to specific commit', () => {
      const hash1 = (git.save('x', { content: 'let a = 10;' }), git.add(), git.commit('first'));
      const hash2 = (git.save('x', { content: 'let a = 20;' }), git.add(), git.commit('second'));
      const hash3 = (git.save('x', { content: 'let a = 40;' }), git.add(), git.commit('third'));

      expect(git.head()).toEqual(hash3);

      git.checkout(hash2);

      expect(git.head()).toEqual(hash2);
      expect(git.get('x')).toStrictEqual({ content: 'let a = 20;' });
      expect((git.checkout(hash1), git.get('x'))).toStrictEqual({ content: 'let a = 10;' });
      expect((git.checkout(hash3), git.get('x'))).toStrictEqual({ content: 'let a = 40;' });

      const hash4 = (git.checkout(hash2), git.save('y', { content: 'console.log("hello world");' }), git.add(), git.commit('fourth'));

      expect(git.get('x')).toStrictEqual({ content: 'let a = 20;' });
      expect(git.get('y')).toStrictEqual({ content: 'console.log("hello world");' });
      expect((git.checkout(hash3), git.get('x'))).toStrictEqual({ content: 'let a = 40;' });
      expect((git.checkout(hash4), git.get('x'))).toStrictEqual({ content: 'let a = 20;' });
      expect((git.checkout(hash4), git.get('y'))).toStrictEqual({ content: 'console.log("hello world");' });
    });
    describe('when calling `.checkout` with no argument', () => {
      it('should checkout the latest head', () => {
        const hash1 = (git.save('x', { content: 'let a = 10;' }), git.add(), git.commit('first'));
        const hash2 = (git.save('x', { content: 'let a = 20;' }), git.add(), git.commit('second'));
        const hash3 = (git.save('x', { content: 'let a = 40;' }), git.add(), git.commit('third'));

        expect(git.head()).toEqual(hash3);
        git.checkout(hash1);
        expect(git.head()).toEqual(hash1);
        expect(git.get('x').content).toEqual('let a = 10;');
        git.checkout(hash3);
        git.checkout();
        expect(git.head()).toEqual(hash3);
        expect(git.get('x').content).toEqual('let a = 40;');
      });
    });
  });

  /* ************************************************************************************** .diff */

  describe('when using the `.diff` method', () => {
    it('should return the diff between the working directory and the commit which the head points to', () => {
      git.save('a', { c: 'foo' }); git.add(); git.commit('first');
      expect(git.diff()).toEqual(null);
      git.save('a', { c: 'foo bar' });

      expect(git.diff()).toStrictEqual({
        "text": "@@ -8,12 +8,16 @@\n \"c\":\"foo\n+ bar\n \"}]]\n",
        "html": "<span>\"c\":\"foo</span><ins> bar</ins><span>\"}]]</span>"
      });
    });
  });

  /* ************************************************************************************** .show */

  describe('when using the `.show` method', () => {
    it('should return a specific commit or if used with no arguments the commit which the head points to', () => {
      git.save('a', { c: 'a' }); git.add(); git.commit('first');
      git.save('a', { c: 'b' }); git.add(); git.commit('second');
      git.save('a', { c: 'c' }); git.add(); git.commit('third');
      
      expect(git.show('_2')).toStrictEqual({
        "message": "second",
        "parent": "_1",
        "files": [ [ "a", { "c": "b" } ] ]
      });
      expect(git.show()).toStrictEqual({
        "message": "third",
        "parent": "_2",
        "files": [ [ "a", { "c": "c" } ] ]
      });
    });
  });

  /* ************************************************************************************** .adios */

  describe('when using the `.adios` method', () => {
    describe('and there are no commits', () => {
      it('should do nothing', () => {
        git.adios('xxx');
        expect(git.log()).toStrictEqual({});
      });
    });
    describe('and there is only one commit and we delete it', () => {
      it('leave the data with no commits', () => {
        const hash1 = (git.save('a', { c: 'a' }), git.add(), git.commit('first'));
        const hash2 = (git.save('a', { c: 'b' }), git.add(), git.commit('second'));
        const hash3 = (git.save('a', { c: 'c' }), git.add(), git.commit('third'));
        const hash4 = (git.save('a', { c: 'd' }), git.add(), git.commit('fourth'));
        git.adios(hash4);
        git.adios(hash3);
        git.adios(hash2);
        git.adios(hash1);
        expect(git.log()).toStrictEqual({});
        // expect(git.getAll()).toStrictEqual([["a", {"c": "a"}]])
      });
    });
    describe('and we want to remove the first commit of a series of commits', () => {
      it('should delete the commit set correct parent and diff for the following commits', () => {
        const hash = (git.save('a', { c: 'function a() { return 42; }' }), git.add(), git.commit('first'));
        git.save('a', { c: 'function a() { return "hello"; }' }); git.add(); git.commit('second');
        git.save('a', { c: 'import "foo.js"' }); git.add(); git.commit('third');
        git.checkout(hash);
        git.save('a', { c: 'var a, b = 50;' }); git.add(); git.commit('fourth');

        git.checkout(hash);
        git.adios(hash);

        expect(git.export()).toStrictEqual({
          "i": 4,
          "commits": {
            "_2": {
              "message": "second",
              "parent": null,
              "files": "[[\"a\",{\"c\":\"function a() { return \\\"hello\\\"; }\"}]]"
            },
            "_3": {
              "message": "third",
              "parent": "_2",
              "files": "@@ -9,42 +9,25 @@\n c\":\"\n-function a() { return \\\"hello\\\"; }\n+import \\\"foo.js\\\"\n \"}]]\n"
            },
            "_4": {
              "message": "fourth",
              "parent": "_2",
              "files": "@@ -9,42 +9,22 @@\n c\":\"\n-function a() { return \\\"hello\\\"; }\n+var a, b = 50;\n \"}]]\n"
            }
          },
          "stage": [],
          "working": [
            [
              "a",
              {
                "c": "function a() { return \"hello\"; }"
              }
            ]
          ],
          "head": "_2"
        });
        expect(git.logAccumulatedFiles()).toStrictEqual({
          "_2": {
            "message": "second",
            "parent": null,
            "files": [
              [
                "a",
                {
                  "c": "function a() { return \"hello\"; }"
                }
              ]
            ]
          },
          "_3": {
            "message": "third",
            "parent": "_2",
            "files": [
              [
                "a",
                {
                  "c": "import \"foo.js\""
                }
              ]
            ]
          },
          "_4": {
            "message": "fourth",
            "parent": "_2",
            "files": [
              [
                "a",
                {
                  "c": "var a, b = 50;"
                }
              ]
            ]
          }
        });
      });
    });
    describe('and we want to remove the a middle commit', () => {
      it('should delete the commit set correct parent and diff for the following commits', () => {
        (git.save('a', { c: 'hello world' }), git.add(), git.commit('first'));
        (git.save('a', { c: 'hello world' }), git.add(), git.commit('second'));
        const hash2 = (git.save('a', { c: 'hello winter' }), git.add(), git.commit('third'));
        (git.save('a', { c: 'xxx' }), git.add(), git.commit('fourth'));
        (git.save('a', { c: 'xx2' }), git.add(), git.commit('fifth'));

        git.adios(hash2);

        expect(git.export()).toStrictEqual({
          "i": 5,
          "commits": {
            "_1": {
              "message": "first",
              "parent": null,
              "files": "[[\"a\",{\"c\":\"hello world\"}]]"
            },
            "_2": {
              "message": "second",
              "parent": "_1",
              "files": ""
            },
            "_4": {
              "message": "fourth",
              "parent": "_2",
              "files": "@@ -9,19 +9,11 @@\n c\":\"\n-hello world\n+xxx\n \"}]]\n"
            },
            "_5": {
              "message": "fifth",
              "parent": "_4",
              "files": "@@ -7,13 +7,13 @@\n {\"c\":\"xx\n-x\n+2\n \"}]]\n"
            }
          },
          "stage": [],
          "working": [
            [
              "a",
              {
                "c": "xx2"
              }
            ]
          ],
          "head": "_5"
        });
      });
      describe('and there are more then one derivatives', () => {
        it('should delete the commit set correct parent and diff for the following commits', () => {
          (git.save('a', { c: 'hello world' }), git.add(), git.commit('first'));
          const hash2 = (git.save('a', { c: 'hello winter' }), git.add(), git.commit('second'));
          (git.save('a', { c: 'xxx' }), git.add(), git.commit('third'));
  
          git.checkout(hash2);
          (git.save('a', { c: 'nnn' }), git.add(), git.commit('fourth'));
          git.checkout(hash2);

          git.adios(hash2);

          expect(git.export()).toStrictEqual({
            "i": 4,
            "commits": {
              "_1": {
                "message": "first",
                "parent": null,
                "files": "[[\"a\",{\"c\":\"hello world\"}]]"
              },
              "_3": {
                "message": "third",
                "parent": "_1",
                "files": "@@ -9,19 +9,11 @@\n c\":\"\n-hello world\n+xxx\n \"}]]\n"
              },
              "_4": {
                "message": "fourth",
                "parent": "_1",
                "files": "@@ -9,19 +9,11 @@\n c\":\"\n-hello world\n+nnn\n \"}]]\n"
              }
            },
            "stage": [],
            "working": [
              [
                "a",
                {
                  "c": "hello world"
                }
              ]
            ],
            "head": "_1"
          })
        });
      });
      describe('and the head points to the commit that we want to delete', () => {
        it('should checkout the last derivatives in the list', () => {
          const hash1 = (git.save('a', { c: 'hello world' }), git.add(), git.commit('first'));
          const hash2 =(git.save('a', { c: 'hello winter' }), git.add(), git.commit('second'));
          (git.save('a', { c: 'xxx' }), git.add(), git.commit('third'));
  
          git.checkout(hash2);
          git.adios(hash2);

          expect(git.head()).toEqual(hash1);
          expect(git.get('a').c).toEqual('hello world');
        });
        describe('and there are more then one derivatives', () => {
          it('should checkout the last derivatives in the list', () => {
            (git.save('a', { c: 'hello world' }), git.add(), git.commit('first'));
            const hash2 = (git.save('a', { c: 'hello winter' }), git.add(), git.commit('second'));
            (git.save('a', { c: 'xxx' }), git.add(), git.commit('third'));
    
            git.checkout(hash2);
            (git.save('a', { c: 'nnn' }), git.add(), git.commit('fourth'));
            git.checkout(hash2);

            git.adios(hash2);
  
            expect(git.head()).toEqual('_1');
            expect(git.get('a').c).toEqual('hello world');
          });
        });
      });
    });
    describe('and we want to remove the last commit', () => {
      it('should delete the commit', () => {
        (git.save('a', { c: 'hello world' }), git.add(), git.commit('first'));
        (git.save('a', { c: 'hello winter' }), git.add(), git.commit('second'));
        const hash3 = (git.save('a', { c: 'xxx' }), git.add(), git.commit('third'));

        git.adios(hash3);

        expect(git.export().commits).toStrictEqual({
          "_1": {
            "message": "first",
            "parent": null,
            "files": "[[\"a\",{\"c\":\"hello world\"}]]"
          },
          "_2": {
            "message": "second",
            "parent": "_1",
            "files": "@@ -16,12 +16,13 @@\n lo w\n-orld\n+inter\n \"}]]\n"
          }
        });
      });
      describe('and the head points to the commit that we want to delete', () => {
        it('should checkout the parent', () => {
          (git.save('a', { c: 'hello world' }), git.add(), git.commit('first'));
          const hash2 =(git.save('a', { c: 'hello winter' }), git.add(), git.commit('second'));
          const hash3 = (git.save('a', { c: 'xxx' }), git.add(), git.commit('third'));
  
          git.adios(hash3);

          expect(git.head()).toEqual(hash2);
          expect(git.get('a').c).toEqual('hello winter');
        });
      });
    });
  });

  /* ************************************************************************************** .listen */
  describe('when using the `.listen` method', () => {
    it('should trigger a callback every time when we change stuff', () => {
      const spy = jest.fn();

      git.listen(spy);
      git.checkout((git.save('x', { content: 'let a = 10;' }), git.add(), git.commit('first')));

      expect(spy).toBeCalledWith(git.ON_CHANGE);
      expect(spy).toBeCalledWith(git.ON_ADD);
      expect(spy).toBeCalledWith(git.ON_COMMIT);
      expect(spy).toBeCalledWith(git.ON_CHECKOUT);
    });
    it('should trigger a callback every time when we delete stuff', () => {
      const spy = jest.fn();

      git.listen(spy);

      git.save('x', { content: 'let a = 10;' });
      git.del('x');

      expect(spy).toBeCalledWith(git.ON_CHANGE);
      expect(spy).toBeCalledTimes(2);
    });
  });

  /* ************************************************************************************** .export */
  describe('when using the `.export` method', () => {
    it('should dump all the data', () => {
      (git.save('x', { content: 'let a = 10;' }), git.add(), git.commit('first'));
      (git.save('y', { content: 'boo' }), git.add('y'));
      (git.save('x', { content: 'let a = 20;' }), git.add(), git.commit('second'));

      expect(git.export()).toStrictEqual({
        "i": 2,
        "commits": {
          "_1": {
            "message": "first",
            "parent": null,
            "files": "[[\"x\",{\"content\":\"let a = 10;\"}]]"
          },
          "_2": {
            "message": "second",
            "parent": "_1",
            "files": "@@ -23,11 +23,35 @@\n a = \n-1\n+2\n 0;\"}]\n+,[\"y\",{\"content\":\"boo\"}]\n ]\n"
          }
        },
        "stage": [],
        "working": [
          [
            "x",
            {
              "content": "let a = 20;"
            }
          ],
          [
            "y",
            {
              "content": "boo"
            }
          ]
        ],
        "head": "_2"
      });
    });
  });

  /* ************************************************************************************** .import */
  
  describe('when using the `.import` method', () => {
    it('should import all the data', () => {
      git.import({
        "i": 1,
        "commits": {
          "_1": {
            "message": "first",
            "parent": null,
            "files": "[[\"x\",{\"content\":\"let a = 10;\"}]]"
          }
        },
        "stage": [
          ["y", { "content": "boo" } ]
        ],
        "working": [
          ["x", { "content": "let a = 10;"} ],
          ["y", { "content": "boo" } ]
        ],
        "head": "_1"
      });
      
      expect(git.head()).toEqual('_1');
      expect(git.get('x').content).toEqual('let a = 10;');
    });
    describe('when missing some of the major props', () => {
      it('should be robust and polyfill the missing props', () => {
        git.import({
          "commits": {
            "_1": {
              "message": "first",
              "parent": null,
              "files": "[[\"x\",{\"content\":\"let a = 10;\"}]]"
            }
          },
          "head": "_1"
        });
        (git.save('y', { content: 'hello' }), git.add(), git.commit('new commit'));

        expect(git.export()).toStrictEqual({
          "commits": {
            "_1": {
              "message": "first",
              "parent": null,
              "files": "[[\"x\",{\"content\":\"let a = 10;\"}]]"
            },
            "_2": {
              "message": "new commit",
              "parent": "_1",
              "files": "@@ -25,9 +25,35 @@\n = 10;\"}]\n+,[\"y\",{\"content\":\"hello\"}]\n ]\n"
            }
          },
          "head": "_2",
          "i": 2,
          "stage": [],
          "working": [
            [
              "x",
              {
                "content": "let a = 10;"
              }
            ],
            [
              "y",
              {
                "content": "hello"
              }
            ]
          ]
        })
      });
    });
    describe('when with pass just a working directory', () => {
      it('should be robust and polyfill the missing props', () => {
        git.import({
          working: [ 'code.js', {
              content: 'let a = 10;',
              editing: false,
              entry: true
            }
          ]
        });
        expect(git.export()).toStrictEqual({
          "working": [
            "code.js",
            {
              "content": "let a = 10;",
              "editing": false,
              "entry": true
            }
          ],
          "head": null,
          "i": 0,
          "stage": [],
          "commits": {}
        });
      });
    });  
  });

  /* ************************************************************************************** .commitDiffToHTML */

  describe('when using `.commitDiffToHTML` method', () => {
    it('should provide a html of the changes', () => {
      (git.save('a', { c: 'hello world' }), git.add(), git.commit('first'));
      const hash = (git.save('a', { c: 'hello mr. Gitfred' }), git.add(), git.commit('first'));

      expect(git.commitDiffToHTML(hash)).toEqual('<span>llo </span><del>worl</del><ins>mr. Gitfre</ins><span>d\"}]</span>');
    });
  });

  /* ************************************************************************************** .amend */

  describe('when using `.amend` method', () => {
    it('should allow us to change a commit', () => {
      git.save('a', { c: 'hello world' }); git.add();
      const hash = git.commit('first', { flag: true });
      
      const hashSecond = (git.save('a', { c: 'hello winter' }), git.add(), git.commit('second'));
      git.checkout(hash);
      const hashThird = (git.save('a', { c: 'xxx' }), git.add(), git.commit('third'));
      const hashFourth = (git.save('d', { c: 'var a = 20;' }), git.add(), git.commit('fourth'));

      git.amend(hash, {
        message: 'better message',
        meta: { flag: false, foo: 'bar' },
        files: {
          'a': { c: 'Wow, that indeed works' },
          'b': { c: 'and a new file' }
        }
      });
      git.amend(hashSecond, {
        message: 'second second',
        files: {
          'c': 'hello winter!'
        }
      });
      git.amend(hashThird, {
        files: {
          'c': 'yyy'
        }
      });
      git.amend(hashFourth, {
        files: {
          'e': 'foo bar'
        }
      });

      expect(git.export()).toStrictEqual({
        "i": 4,
        "commits": {
          "_1": {
            "message": "better message",
            "parent": null,
            "files": "[[\"a\",{\"c\":\"Wow, that indeed works\"}],[\"b\",{\"c\":\"and a new file\"}]]",
            "meta": {
              "flag": false,
              "foo": "bar"
            }
          },
          "_2": {
            "message": "second second",
            "parent": "_1",
            "files": "@@ -1,67 +1,23 @@\n [[\"\n-a\",{\"c\":\"Wow, that indeed works\"}],[\"b\",{\"c\":\"and a new file\"}\n+c\",\"hello winter!\"\n ]]\n"
          },
          "_3": {
            "message": "third",
            "parent": "_1",
            "files": "@@ -1,67 +1,13 @@\n [[\"\n-a\",{\"c\":\"Wow, that indeed works\"}],[\"b\",{\"c\":\"and a new file\"}\n+c\",\"yyy\"\n ]]\n"
          },
          "_4": {
            "message": "fourth",
            "parent": "_3",
            "files": "@@ -1,13 +1,17 @@\n [[\"\n-c\n+e\n \",\"\n-yyy\n+foo bar\n \"]]\n"
          }
        },
        "stage": [],
        "working": [
          [
            "a",
            {
              "c": "xxx"
            }
          ],
          [
            "d",
            {
              "c": "var a = 20;"
            }
          ]
        ],
        "head": "_4"
      });
      expect(git.logAccumulatedFiles()).toStrictEqual({
        "_1": {
          "message": "better message",
          "parent": null,
          "files": [
            [
              "a",
              {
                "c": "Wow, that indeed works"
              }
            ],
            [
              "b",
              {
                "c": "and a new file"
              }
            ]
          ],
          "meta": {
            "flag": false,
            "foo": "bar"
          }
        },
        "_2": {
          "message": "second second",
          "parent": "_1",
          "files": [
            [
              "c",
              "hello winter!"
            ]
          ]
        },
        "_3": {
          "message": "third",
          "parent": "_1",
          "files": [
            [
              "c",
              "yyy"
            ]
          ]
        },
        "_4": {
          "message": "fourth",
          "parent": "_3",
          "files": [
            [
              "e",
              "foo bar"
            ]
          ]
        }
      });
    });
    describe('and we use the method with no arguments', () => {
      it('should update the files of the commit where the head points to by getting the working directory', () => {
        git.save('a', { c: 'foo' }); git.add(); git.commit('first');
        git.save('a', { c: 'bar' }); git.add(); git.commit('second');
        git.checkout('_1'); git.save('b', { c: 'zoo' }); git.del('a');
        git.amend();
        git.checkout('_2'); git.save('a', { c: 'hello' }); git.add(); git.commit('third');
        git.checkout('_2'); git.del('a');
        git.amend();

        expect(git.logAccumulatedFiles()).toStrictEqual({
          "_1": {
            "message": "first",
            "parent": null,
            "files": [
              [
                "b",
                {
                  "c": "zoo"
                }
              ]
            ]
          },
          "_2": {
            "message": "second",
            "parent": "_1",
            "files": []
          },
          "_3": {
            "message": "third",
            "parent": "_2",
            "files": [
              [
                "a",
                {
                  "c": "hello"
                }
              ]
            ]
          }
        });
        expect(git.export()).toStrictEqual({
          "i": 3,
          "commits": {
            "_1": {
              "message": "first",
              "parent": null,
              "files": "[[\"b\",{\"c\":\"zoo\"}]]"
            },
            "_2": {
              "message": "second",
              "parent": "_1",
              "files": "@@ -1,19 +1,2 @@\n [\n-[\"b\",{\"c\":\"zoo\"}]\n ]\n"
            },
            "_3": {
              "message": "third",
              "parent": "_2",
              "files": "@@ -1,2 +1,21 @@\n [\n+[\"a\",{\"c\":\"hello\"}]\n ]\n"
            }
          },
          "stage": [],
          "working": [],
          "head": "_2"
        });
      });
    });
  });

  /* ************************************************************************************** integration */

  describe('when doing the example code', () => {
    it('should work :)', () => {
      git.save('foo.js', { content: "hello winter" });
      git.add('foo.js');
      git.commit('first commit');

      git.save('foo.js', { content: "winter is comming" });
      git.add('foo.js');
      git.commit('second commit');

      git.save('foo.js', { content: "winter is comming!" });
      git.add('foo.js');
      git.commit('second commit', { flag: true }); 

      git.checkout('_1');
    });
    it('should work #1', () => {
      git.import(require('./fixtures/01.json'));

      git.adios('_3');

      expect(git.show()).toStrictEqual({
        "message": "here we go",
        "parent": "_4",
        "files": [
          [
            "code.js",
            {
              "c": "console.log('hello a');"
            }
          ]
        ]
      });
    });
    it('should work #2', () => {
      git.import(require('./fixtures/02.json'));

      git.adios('_5');

      expect(git.export()).toStrictEqual({
        "working": [
          [
            "code.js",
            {
              "c": "console.log('hello a');"
            }
          ]
        ],
        "head": null,
        "i": 5,
        "stage": [],
        "commits": {}
      });
    });
    it('should work #3', () => {
      git.import(require('./fixtures/03.json'));

      git.add();
      git.commit('test');

      expect(git.get('markup.html')).toStrictEqual({
        "c": "<div>\n  <p id=\"text\">Hello</p>\n</div>",
        "en": false
      });
    });
    it('should work #4', () => {
      git.import(require('./fixtures/04.json'));
      git.checkout('_18');

      expect(git.get('styles.css')).toStrictEqual({
        "c": ".test {\n  margin: 0;\n  padding: 3em 6em;\n  font-family: tahoma, arial, sans-serif;\n  color: #000;\n}"
      });
    });
    it('should work #5', () => {
      git.import(require('./fixtures/05.json'));
      git.show();

      expect(git.get('styles.css')).toStrictEqual({
        "c": "p {\n  padding: 1em;\n}"
      });
    });
    it('should work #6', () => {
      git.import(require('./fixtures/06.json'));
      git.amend('_3', { message: 'third commit'});

      expect(git.show('_3')).toStrictEqual({
        "message": "third commit",
        "parent": "_2",
        "files": [
          [
            "foo.js",
            {
              "content": "winter is comming!"
            }
          ]
        ],
        "meta": {
          "flag": true
        }
      });
    });
  });
  
});