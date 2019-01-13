(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory);
  } else if (typeof module === 'object' && module.exports) {
      module.exports = factory();
  } else {
    root.gitfred = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {  
  return function () {
    let dmpInstance;
    const listeners = [];
    const api = {
      ON_CHANGE: 's',
      ON_ADD: 'a',
      ON_COMMIT: 'c',
      ON_CHECKOUT: 'co'
    }
    let git = {
      i: 0, // index used for achieving unique commit hashes
      commits: {},
      stage: [],
      working: [],
      head: null
    };
    const createDMP = () => dmpInstance ? dmpInstance : (dmpInstance = new diff_match_patch());
    const createHash = () => '_' + (++git.i);
    const clone = source => JSON.parse(JSON.stringify(source));
    const isEmpty = obj => Object.keys(obj).length === 0 && obj.constructor === Object;
    const validateFile = (filepath, file) => {
      if (!filepath) throw new Error('`filepath` is required.');
      if (!file) throw new Error('`file` object is required.');
      if (typeof filepath !== 'string') throw new Error('`filepath` must be a string.');
      if (typeof file !== 'object') throw new Error('`file` must be an object.');
    }
    const toText = obj => JSON.stringify(obj);
    const toObj = text => JSON.parse(text);
    const applyPatch = (source, patch) => {
      const dmp = createDMP();

      return dmp.patch_apply(dmp.patch_fromText(patch), source).shift();
    }
    const accumulate = (hash, diffs = [], commits = false) => {
      const commit = (commits || api.log())[hash];

      if (!commit) {
        throw new Error(`There is no commit with hash "${ hash }".`);
      }
      if (commit.parent === null) {
        return diffs.reduce((result, patch) => {
          return applyPatch(result, patch);
        }, commit.files);
      } else {
        return accumulate(commit.parent, [commit.files].concat(diffs), commits);
      }
    }
    const getPatch = (parentContent, newContent) => {
      const dmp = createDMP();
      const diff = dmp.diff_main(parentContent, newContent, true);

      if (diff.length > 2) {
        dmp.diff_cleanupSemantic(diff);
      }
      return dmp.patch_toText(dmp.patch_make(parentContent, newContent, diff));
    }
    const findDiff = (newContent, parent) => {      
      return decodeURI(getPatch(accumulate(parent), newContent));
    }
    const notify = event => listeners.forEach(cb => cb(event));
    const arrayAsStorage = storage => ({
      length() { return storage.length; },
      save(key, value) {
        validateFile(key, value);
        let i = 0, l = this.length();
        while(i < l) {
          if (storage[i][0] === key) return storage[i][1] = Object.assign({}, storage[i][1], value);
          i++;
        }
        storage.push([key, value]);
      },
      saveAll(value) {
        let i = 0, l = this.length();
        while(i < l) {
          storage[i][1] = Object.assign({}, storage[i][1], value);
          i++;
        }
      },
      get(key) {
        let i = 0, l = this.length();
        while(i < l) {
          if (storage[i][0] === key) return storage[i][1];
          i++;
        }
      },
      del(key) {
        let i = 0, l = this.length();
        while(i < l) {
          if (storage[i][0] === key || storage[i][1] === key) {
            storage.splice(i, 1);
            return;
          }
          i++;
        }
        throw new Error(`There is no file with path ${ key }.`);
      },
      getKey(value) {
        let i = 0, l = this.length();
        while(i < l) {
          if (storage[i][1] === value) return storage[i][0];
          i++;
        }
      },
      rename(keyA, keyB) {
        let i = 0, l = this.length();
        while(i < l) {
          if (storage[i][0] === keyA) return storage[i][0] = keyB;
          i++;
        }
        throw new Error(`There is no file with path ${ key }.`);
      },
      clone() {
        return clone(storage);
      },
      replaceStorage(newStorage) {
        storage = newStorage;
      }
    });
    const diffToHTML = diff => createDMP().patch_fromText(diff).reduce((result, patch) => {
      if (!patch.diffs) return result;
      result += patch.diffs.reduce((result, diff) => {
        let text = diff[1].replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '&para;<br />');
        if (diff[0] === 1) result += '<ins>' + text + '</ins>';
        if (diff[0] === -1) result += '<del>' + text + '</del>';
        if (diff[0] === 0) result += '<span>' + text + '</span>';
        return result;
      }, '');
      return result;
    }, '');

    const working = arrayAsStorage(git.working);
    const stage = arrayAsStorage(git.stage);

    api.save = function (filepath, file) {
      if (typeof filepath === 'object' && typeof file === 'undefined') {
        Object.keys(filepath).forEach(f => working.save(f, filepath[f]));
        notify(api.ON_CHANGE);
        return api;
      } else {
        working.save(filepath, file);
        notify(api.ON_CHANGE);
        return file;
      }
    }
    api.saveAll = function(file) {
      working.saveAll(file);
      notify(api.ON_CHANGE);
      return api;
    }
    api.discard = function () {
      this.checkout(undefined, true);
      return api;
    }
    api.del = function (filepath) {
      working.del(filepath);
      notify(api.ON_CHANGE);
      return api;
    }
    api.rename = function (oldName, newName) {
      working.rename(oldName, newName);
      notify(api.ON_CHANGE);
      return git.working;
    }
    api.get = function (filepath) {
      return working.get(filepath);
    }
    api.exists = function (filepath) {
      return !!working.get(filepath);
    }
    api.getAll = function () {
      return git.working;
    }
    api.getFilepath = function(file) {
      return working.getKey(file);
    }
    api.add = function (filepath) {
      if (typeof filepath === 'undefined') {
        stage.replaceStorage(git.stage = working.clone());
      } else {
        const file = working.get(filepath);

        if (!file) throw new Error(`There is no '${ filepath }' in the working directory.`);
        stage.save(filepath, clone(file));
      }
      notify(api.ON_ADD);
      return api;
    }
    api.commit = function (message, meta) {
      if (stage.length() === 0) throw new Error('NOTHING_TO_COMMIT');
      const hash = createHash();
      const head = this.head();
      const files = head !== null ? findDiff(toText(git.stage), head) : toText(git.stage);

      git.commits[hash] = {
        message,
        parent: head,
        files: files
      }
      if (meta) git.commits[hash].meta = meta;
      git.head = hash;
      stage.replaceStorage(git.stage = []);
      notify(api.ON_COMMIT);
      return hash;
    }
    api.amend = function (hash, message, meta) {
      const commit = this.log()[hash];

      if (!commit) {
        throw new Error(`There is no commit with hash "${ hash }".`);
      }

      commit.message = message;
      if (meta) commit.meta = meta;
      notify(api.ON_COMMIT);
      return commit;
    }
    api.show = function (hash) {
      hash = hash || this.head();

      const commit = api.log()[hash];

      if (!commit) {
        throw new Error(`There is no commit with hash "${ hash }".`);
      }
      const c = clone(commit);
      c.files = toObj(accumulate(hash));
      return c;
    }
    api.checkout = function (hash, force = false) {
      if (!force && stage.length() > 0) {
        throw new Error('UNCOMMITED_CHANGES');
      }
      if (!force && findDiff(toText(git.working), this.head()) !== '') {
        throw new Error('UNSTAGED_FILES');
      }
      if (typeof hash === 'undefined') {
        hash = this.head();
      }
      git.head = hash;
      working.replaceStorage(git.working = toObj(accumulate(hash)));
      notify(api.ON_CHECKOUT);
      return api;
    }
    api.staged = function () {
      return stage;
    }
    api.head = function () {
      return git.head;
    }
    api.log = function () {
      return git.commits;
    }
    api.logAsTree = function () {
      const all = clone(git.commits);
      return (function process(hash) {
        if (!hash) return null;

        const c = all[hash];
        delete all[hash];

        c.hash = hash;
        c.derivatives = Object.keys(all).filter(h => all[h].parent === hash).map(process);

        return c;        
      })(Object.keys(all).find(hash => all[hash].parent === null));
    }
    api.adios = function (hash) {
      let all = clone(this.log());
      let hashes = Object.keys(all);
      
      if (hashes.length === 0) return;
      
      const newParent = all[hash].parent;

      hashes.forEach(h => (all[h].files = toObj(accumulate(h))));

      const toBeDeleted = all[hash];
      delete all[hash];
      hashes = Object.keys(all);

      hashes.reduce((compareWith, h, i) => {
        if (i === 0) {
          compareWith = all[h].files;
          all[h].files = toText(all[h].files);
        } else {
          const tmp = all[h].files;
          all[h].files = decodeURI(getPatch(toText(compareWith), toText(all[h].files)));
          compareWith = tmp;
        }
        if (all[h].parent === hash) all[h].parent = newParent;
        return compareWith;
      }, null);
      
      if (this.head() === hash) {
        if (isEmpty(all)) {
          git.head = null;
        } else {
          this.checkout(newParent === null ? Object.keys(all).shift() : newParent);
        }
      }
      
      git.commits = all;

      notify(api.ON_COMMIT);
      return toBeDeleted;
    }
    api.diff = function () {
      const diff = findDiff(toText(git.working), this.head());

      if (diff === '') return null;
      return {
        text: diff,
        html: diffToHTML(diff)
      }
    }
    api.export = function () {
      return clone(git);
    }
    api.listen = function (cb) {
      listeners.push(cb);
    }
    api.import = function (state) {
      git = state;
      if (!git.head) git.head = null;
      if (!git.i) git.i = git.head ? parseInt(git.head.replace('_', '')) : 0;
      if (!git.stage) git.stage = [];
      if (!git.working) {
        git.working = [];
        this.checkout(this.head(), true);
      }
      if (!git.commits) git.commits = {};
      working.replaceStorage(git.working);
      stage.replaceStorage(git.stage);
      return api;
    }
    api.commitDiffToHTML = function (hash) {
      if (!git.commits[hash]) throw new Error(`There is no commit with hash ${ hash }.`);
      if (git.commits[hash].files.indexOf('@@') === -1) return '';
      return diffToHTML(git.commits[hash].files);
    }
    api.calcStrDiff = function(a, b) {
      const patch = getPatch(a, b);

      if (patch === '') return null;
      return {
        text: patch,
        html: diffToHTML(patch)
      }
    }

    return api;
  }
}));
