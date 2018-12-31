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
      ON_SAVE: 's',
      ON_ADD: 'a',
      ON_COMMIT: 'c',
      ON_CHECKOUT: 'co'
    }
    let git = {
      i: 0, // index used for achieving unique commit hashes
      commits: {},
      stage: {},
      working: {},
      head: null
    };
    const createDMP = () => dmpInstance ? dmpInstance : (dmpInstance = new diff_match_patch());
    const createHash = () => '_' + (++git.i);
    const clone = source => JSON.parse(JSON.stringify(source));
    const isEmpty = obj => Object.keys(obj).length === 0 && obj.constructor === Object;
    const validateChange = change => {
      if (!change) throw new Error('No `change` provided.');
      if (!change.filepath) throw new Error('`filepath` is required.');
      if (typeof change.filepath !== 'string') throw new Error('`filepath` must be a string.');
    }
    const toText = obj => JSON.stringify(obj);
    const toObj = text => JSON.parse(text);
    const applyPatch = (source, patch) => {
      const dmp = createDMP();

      return dmp.patch_apply(dmp.patch_fromText(patch), source).shift()
    }
    const accumulate = (hash, diffs = []) => {
      const commit = api.log()[hash];

      if (!commit) {
        throw new Error(`There is no commit with hash "${ hash }".`);
      }
      if (commit.parent === null) {
        return diffs.reduce((result, patch) => {
          return applyPatch(result, patch);
        }, commit.files);
      } else {
        return accumulate(commit.parent, [commit.files].concat(diffs));
      }
    }
    const findDiff = (newContent, parent) => {
      const dmp = createDMP();
      const parentContent = accumulate(parent);
      const diff = dmp.diff_main(parentContent, newContent, true);

      if (diff.length > 2) {
        dmp.diff_cleanupSemantic(diff);
      }
      return dmp.patch_toText(dmp.patch_make(parentContent, newContent, diff));
    }
    const notify = event => listeners.forEach(cb => cb(event));

    api.save = function (change) {
      validateChange(change)
      const { filepath, ...rest } = change;
      git.working[filepath] = Object.assign({}, git.working[filepath], rest);
      notify(api.ON_SAVE);
      return api;
    }
    api.add = function (filepath) {
      if (typeof filepath === 'undefined') {
        Object.keys(git.working).forEach(this.add);
      } else {
        if (!git.working[filepath]) {
          throw new Error(`There is no '${ filepath }' in the working directory.`);
        }
        git.stage[filepath] = clone(git.working[filepath]);
      }
      notify(api.ON_ADD);
      return api;
    }
    api.commit = function (message, meta) {
      if (isEmpty(git.stage)) {
        throw new Error('NOTHING_TO_COMMIT');
      }
      const hash = createHash();
      const head = this.head();
      const files = head !== null ? findDiff(toText(this.staged()), head) : toText(this.staged());

      git.commits[hash] = {
        message,
        parent: head,
        files: files
      }
      if (meta) git.commits[hash].meta = meta;
      git.head = hash;
      git.stage = {};
      notify(api.ON_COMMIT);
      return hash;
    }
    api.amend = function (hash, message, meta) {
      const commit = this.show(hash);

      commit.message = message;
      if (meta) commit.meta = meta;
      return hash;
    }
    api.show = function (hash) {
      const commit = api.log()[hash];

      if (!commit) {
        throw new Error(`There is no commit with hash "${ hash }".`);
      }
      return commit;
    }
    api.checkout = function (hash, force = false) {
      if (!isEmpty(this.staged()) && !force) {
        throw new Error('UNSTAGED_FILES');
      }
      if (findDiff(toText(this.working()), this.head()) !== '' && !force) {
        throw new Error('UNSTAGED_FILES');
      }
      if (typeof hash === 'undefined') {
        hash = this.head();
      }
      git.head = hash;
      git.working = toObj(accumulate(hash));
      notify(api.ON_CHECKOUT);
      return api;
    }
    api.staged = function () {
      return git.stage;
    }
    api.working = function () {
      return git.working;
    }
    api.head = function () {
      return git.head;
    }
    api.log = function () {
      return git.commits;
    }
    api.export = function () {
      return git;
    }
    api.listen = function (cb) {
      listeners.push(cb);
    }
    api.import = function (state) {
      git = state;
      if (!git.head) git.head = null;
      if (!git.i) git.i = git.head ? parseInt(git.head.replace('_', '')) : 0;
      if (!git.stage) git.stage = {};
      if (!git.working) {
        git.working = {};
        this.checkout(this.head(), true);
      }
      if (!git.commits) git.commits = {};
    }
    api.commitDiffToHTML = function (hash) {
      if (!git.commits[hash]) throw new Error(`There is no commit with hash ${ hash }.`);
      if (git.commits[hash].files.indexOf('@@') === -1) return '';
      return createDMP().patch_fromText(git.commits[hash].files).reduce((result, patch) => {
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
    }

    return api;
  }
}));
