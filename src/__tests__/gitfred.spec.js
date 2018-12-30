global.diff_match_patch = require('diff-match-patch');

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
      expect(() => git.save({})).toThrowError();
      expect(() => git.save({filepath: 'foo'})).toThrowError();
      expect(() => git.save({filepath: 'foo', content: 'bar'})).not.toThrowError();
      expect(() => git.save({filepath: {}, content: 'bar'})).toThrowError();
      expect(() => git.save({filepath: 'foo', content: function() {} })).toThrowError();
    });
    it('should store a file in the working directory', () => {
      git.save({ filepath: 'script.js', content: 'let a = 10;' });
      expect(git.working()).toStrictEqual({
        'script.js': { content: 'let a = 10;' }
      })
    });
    it('should modify the file if it is already staged', () => {
      git.save({ filepath: 'script.js', content: 'let a = 10;' });
      git.save({ filepath: 'script.js', content: 'let a = 20;' });
      expect(git.working()).toStrictEqual({
        'script.js': { content: 'let a = 20;' }
      });
    });
    it('should append and not replace a file', () => {
      git.save({ filepath: 'script.js', content: 'let a = 10;', flag: true });
      git.save({ filepath: 'script.js', content: 'let b = 20;' });
      expect(git.working()).toStrictEqual({
        'script.js': { content: 'let b = 20;', flag: true }
      });
    });
    it('should allow storing meta data', () => {
      git.save({ filepath: 'script.js', content: 'let a = 10;', flag: true });
      expect(git.working()).toStrictEqual({
        'script.js': { content: 'let a = 10;', flag: true }
      });
    });
  });

  /* ************************************************************************************** .add */

  describe('when using the `.add` method', () => {
    it('should throw an error if we pass a filepath that does not exists in the working directory', () => {
      expect(() => git.add('foo.js')).toThrowError();
    });
    it('should store a file from the working directory to the staging area', () => {
      git.save({ filepath: 'script.js', content: 'let a = 10;', flag: true });
      git.add('script.js');
      expect(git.staged()).toStrictEqual({
        'script.js': { content: 'let a = 10;', flag: true }
      });
    });
    it('the working directory should contain a cloned data', () => {
      git.save({ filepath: 'script.js', content: 'let a = 10;', flag: true });
      git.add('script.js');
      git.save({ filepath: 'script.js', content: 'let b = 20;' });
      expect(git.staged()).toStrictEqual({
        'script.js': { content: 'let a = 10;', flag: true }
      });
    });
    it('should stage all the files from the working directory if called with no arguments', () => {
      git.save({ filepath: 'bar.js', content: 'let a = 10;', flag: true });
      git.save({ filepath: 'foo.js', content: '// comment here\n// and there' });
      git.add();
      expect(git.staged()).toStrictEqual({
        'bar.js': { content: 'let a = 10;', flag: true },
        'foo.js': { content: '// comment here\n// and there' }
      });
    });
  });

  /* ************************************************************************************** .commit */

  describe('when using the `.commit` method', () => {
    it('should throw NOTHING_TO_COMMIT if there is nothing staged', () => {
      git.save({ filepath: 'script.js', content: 'let a = 10;' });
      expect(() => git.commit('foo')).toThrowError(new Error('NOTHING_TO_COMMIT'));
    });
    describe('and there are no other commits', () => {
      it(`should create one commit with no parent
          should point the head to that new commit
          should clear the staged items`, () => {
        git
          .save({ filepath: 'script.js', content: 'let a = 10;' })
          .add();

        expect(isEmpty(git.log())).toEqual(true);

        const hash = git.commit('my first commit');
        
        expect(isEmpty(git.log())).not.toEqual(true);
        expect(isEmpty(git.staged())).toEqual(true);
        expect(git.head()).toEqual(hash);
        expect(git.log()[hash]).toStrictEqual({
          files: '{\"script.js\":{\"content\":\"let a = 10;\"}}',
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
        const hash1 = git.save({ filepath: 'foo.js', content: 'let a = 10;' }).add().commit('first');
        const hash2 = git.save({ filepath: 'foo.js', content: 'let a = 20;' }).add().commit('second');

        const commit1 = git.log()[hash1];
        const commit2 = git.log()[hash2];

        expect(git.head()).toEqual(hash2);
        expect(commit2.parent).toEqual(hash1);

        expect(JSON.parse(dmp.patch_apply(dmp.patch_fromText(commit2.files), commit1.files).shift())).toStrictEqual({
          'foo.js': { content: 'let a = 20;' }
        });
      });
    });
    it('should allow storing meta along side every commit', () => {
      const hash = git.save({ filepath: 'script.js', content: 'let a = 10;' }).add().commit('com', { meta: true });

      expect(git.show(hash).meta).toStrictEqual({ meta: true });
    });
    it('should allow empty commits', () => {
      git.save({ filepath: 'a', content: 'b' }).add().commit('first');
      const hash = git.save({ filepath: 'a', content: 'b' }).add().commit('second');
      git.save({ filepath: 'a', content: 'c' }).add().commit('third');
      git.checkout(hash);
      git.save({ filepath: 'a', content: 'd' }).add().commit('fourth');

      expect(Object.keys(git.log()).length).toEqual(4)
    });
  });

  /* ************************************************************************************** .checkout */

  describe('when using `.checkout` method', () => {
    it('should throw an error UNSTAGED_FILES if there are files which are not commited', () => {
      const hash = git.save({ filepath: 'x', content: 'A' }).add().commit('first');
      git.save({ filepath: 'x', content: 'B' }).add().commit('second');
      git.save({ filepath: 'x', content: 'C' }).add();
      expect(() => git.checkout(hash)).toThrowError(new Error('UNSTAGED_FILES'));
    });
    it('should throw an error UNSTAGED_FILES if there are files which are not staged', () => {
      const hash = git.save({ filepath: 'x', content: 'A' }).add().commit('first');
      git.save({ filepath: 'x', content: 'B' }).add().commit('second');
      git.save({ filepath: 'x', content: 'C' });
      expect(() => git.checkout(hash)).toThrowError(new Error('UNSTAGED_FILES'));
    });
    it('should set the working directory to specific commit', () => {
      const hash1 = git.save({ filepath: 'x', content: 'let a = 10;' }).add().commit('first');
      const hash2 = git.save({ filepath: 'x', content: 'let a = 20;' }).add().commit('second');
      const hash3 = git.save({ filepath: 'x', content: 'let a = 40;' }).add().commit('third');

      expect(git.head()).toEqual(hash3);

      git.checkout(hash2);

      expect(git.head()).toEqual(hash2);
      expect(git.working()).toStrictEqual({ 'x': { content: 'let a = 20;' }});
      expect(git.checkout(hash1).working()).toStrictEqual({ 'x': { content: 'let a = 10;' }});
      expect(git.checkout(hash3).working()).toStrictEqual({ 'x': { content: 'let a = 40;' }});

      const hash4 = git.checkout(hash2).save({ filepath: 'y', content: 'console.log("hello world");' }).add().commit('fourth');

      expect(git.working()).toStrictEqual({
        x: { content: 'let a = 20;' },
        y: { content: 'console.log("hello world");' }
      });
      expect(git.checkout(hash3).working()).toStrictEqual({ 'x': { content: 'let a = 40;' }});
      expect(git.checkout(hash4).working()).toStrictEqual({
        x: { content: 'let a = 20;' },
        y: { content: 'console.log("hello world");' }
      });
    });
    describe('when calling `.checkout` with no argument', () => {
      it('should checkout the latest head', () => {
        const hash1 = git.save({ filepath: 'x', content: 'let a = 10;' }).add().commit('first');
        const hash2 = git.save({ filepath: 'x', content: 'let a = 20;' }).add().commit('second');
        const hash3 = git.save({ filepath: 'x', content: 'let a = 40;' }).add().commit('third');

        expect(git.head()).toEqual(hash3);
        git.checkout(hash1);
        expect(git.head()).toEqual(hash1);
        expect(git.working()['x'].content).toEqual('let a = 10;');
        git.checkout(hash3);
        git.checkout();
        expect(git.head()).toEqual(hash3);
        expect(git.working()['x'].content).toEqual('let a = 40;');
      });
    });
  });

  /* ************************************************************************************** .listen */
  describe('when using the `.listen` method', () => {
    it('should trigger a callback every time when we change stuff', () => {
      const spy = jest.fn();

      git.listen(spy);
      git.checkout(git.save({ filepath: 'x', content: 'let a = 10;' }).add().commit('first'));

      expect(spy).toBeCalledWith(git.ON_SAVE);
      expect(spy).toBeCalledWith(git.ON_ADD);
      expect(spy).toBeCalledWith(git.ON_COMMIT);
      expect(spy).toBeCalledWith(git.ON_CHECKOUT);
    });
  });

  /* ************************************************************************************** .export */
  describe('when using the `.export` method', () => {
    it('should dump all the data', () => {
      git.save({ filepath: 'x', content: 'let a = 10;' }).add().commit('first');
      git.save({ filepath: 'y', content: 'boo' }).add('y');

      expect(git.export()).toStrictEqual({
        "i": 1,
        "commits": {
          "_1": {
            "message": "first",
            "parent": null,
            "files": "{\"x\":{\"content\":\"let a = 10;\"}}"
          }
        },
        "stage": {
          "y": {
            "content": "boo"
          }
        },
        "working": {
          "x": {
            "content": "let a = 10;"
          },
          "y": {
            "content": "boo"
          }
        },
        "head": "_1"
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
            "files": "{\"x\":{\"content\":\"let a = 10;\"}}"
          }
        },
        "stage": {
          "y": {
            "content": "boo"
          }
        },
        "working": {
          "x": {
            "content": "let a = 10;"
          },
          "y": {
            "content": "boo"
          }
        },
        "head": "_1"
      });

      expect(git.head()).toEqual('_1');
      expect(git.working().x.content).toEqual('let a = 10;');
    });
    describe('when missing some of the major props', () => {
      it('should be robust and polyfill the missing props', () => {
        git.import({
          "commits": {
            "_1": {
              "message": "first",
              "parent": null,
              "files": "{\"x\":{\"content\":\"let a = 10;\"}}"
            }
          },
          "head": "_1"
        });
        git.save({ filepath: 'y', content: 'hello' }).add().commit('new commit');
        expect(git.export()).toStrictEqual({
          "commits": {
            "_1": {
              "message": "first",
              "parent": null,
              "files": "{\"x\":{\"content\":\"let a = 10;\"}}"
            },
            "_2": {
              "message": "new commit",
              "parent": "_1",
              "files": "@@ -23,9 +23,33 @@\n  = 10;%22%7D\n+,%22y%22:%7B%22content%22:%22hello%22%7D\n %7D\n"
            }
          },
          "head": "_2",
          "i": 2,
          "stage": {},
          "working": {
            "x": {
              "content": "let a = 10;"
            },
            "y": {
              "content": "hello"
            }
          }
        })
      });
    });
  });

});