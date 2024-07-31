import Observable from 'zen-observable';

class EnhancedZenObservable {
  constructor(initialState = {}) {
    this.state = initialState;
    this.regularObservables = new Map();
    this.diffObservables = new Map();
    this.history = [JSON.parse(JSON.stringify(initialState))];
    this.currentIndex = 0;
    this.initializeObservables(this.state);
  }

  initializeObservables(state, prefix = '') {
    for (const key in state) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (!this.regularObservables.has(fullKey)) {
        this.regularObservables.set(fullKey, new Observable(() => {}));
      }
      if (!this.diffObservables.has(fullKey)) {
        this.diffObservables.set(fullKey, new Observable(() => {}));
      }
      if (typeof state[key] === 'object' && state[key] !== null) {
        this.initializeObservables(state[key], fullKey);
      }
    }
  }

  setState(updater, recordHistory = true) {
    try {
      const newState = typeof updater === 'function' ? updater(this.state) : updater;
      const diff = this.computeDiff(this.state, newState);
      this.applyDiff(diff);

      if (recordHistory) {
        this.currentIndex++;
        this.history = this.history.slice(0, this.currentIndex);
        this.history.push(JSON.parse(JSON.stringify(this.state)));
      }
    } catch (error) {
      console.error('Error setting state:', error);
    }
  }

  applyDiff(diff, currentState = this.state, prefix = '') {
    for (const key in diff) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (diff[key].type === 'replace') {
        currentState[key] = diff[key].value;
        this.notifyObservers(fullKey, currentState[key], diff[key]);
      } else if (diff[key].type === 'object') {
        if (typeof currentState[key] !== 'object') {
          currentState[key] = {};
        }
        this.applyDiff(diff[key].value, currentState[key], fullKey);
      } else if (diff[key].type === 'array') {
        if (!Array.isArray(currentState[key])) {
          currentState[key] = [];
        }
        this.applyArrayDiff(diff[key].value, currentState[key], fullKey);
      }
    }
  }

  applyArrayDiff(arrayDiff, currentArray, prefix) {
    arrayDiff.removed.forEach(({ index }) => {
      currentArray.splice(index, 1);
    });
    arrayDiff.added.forEach(({ index, value }) => {
      currentArray.splice(index, 0, value);
    });
    arrayDiff.changed.forEach(({ index, value }) => {
      this.applyDiff(value, currentArray[index], `${prefix}.${index}`);
    });
    this.notifyObservers(prefix, currentArray, arrayDiff);
  }

  notifyObservers(key, value, diff) {
    const regularObservable = this.regularObservables.get(key);
    const diffObservable = this.diffObservables.get(key);
    
    if (regularObservable) {
      regularObservable.next(value);
    }
    if (diffObservable) {
      diffObservable.next(diff);
    }
  }

  computeDiff(oldObj, newObj) {
    const diff = {};
    for (const key in newObj) {
      if (!(key in oldObj)) {
        diff[key] = { type: 'replace', value: newObj[key] };
      } else if (typeof newObj[key] === 'object' && newObj[key] !== null) {
        if (Array.isArray(newObj[key])) {
          diff[key] = { type: 'array', value: this.computeArrayDiff(oldObj[key], newObj[key]) };
        } else {
          const nestedDiff = this.computeDiff(oldObj[key], newObj[key]);
          if (Object.keys(nestedDiff).length > 0) {
            diff[key] = { type: 'object', value: nestedDiff };
          }
        }
      } else if (oldObj[key] !== newObj[key]) {
        diff[key] = { type: 'replace', value: newObj[key] };
      }
    }
    for (const key in oldObj) {
      if (!(key in newObj)) {
        diff[key] = { type: 'replace', value: undefined };
      }
    }
    return diff;
  }

  computeArrayDiff(oldArray, newArray) {
    const diff = { removed: [], added: [], changed: [] };
    const maxLength = Math.max(oldArray.length, newArray.length);
    for (let i = 0; i < maxLength; i++) {
      if (i >= oldArray.length) {
        diff.added.push({ index: i, value: newArray[i] });
      } else if (i >= newArray.length) {
        diff.removed.push({ index: i });
      } else if (JSON.stringify(oldArray[i]) !== JSON.stringify(newArray[i])) {
        diff.changed.push({ index: i, value: this.computeDiff(oldArray[i], newArray[i]) });
      }
    }
    return diff;
  }

  subscribe(key, callback, useDiff = false) {
    let observable = useDiff ? this.diffObservables.get(key) : this.regularObservables.get(key);
    
    if (!observable) {
      console.warn(`Warning: No observable found for key: '${key}'. Creating a new observable.`);
      observable = new Observable(() => {});
      if (useDiff) {
        this.diffObservables.set(key, observable);
      } else {
        this.regularObservables.set(key, observable);
      }
      
      // Initialize the state for this key if it doesn't exist
      if (this.getState(key) === undefined) {
        console.warn(`Warning: Initializing state for '${key}' with undefined value.`);
        this.setState((state) => {
          const keys = key.split('.');
          let current = state;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = undefined;
          return state;
        });
      }
    }
  
    return observable.subscribe({
      next: callback,
      error: (err) => console.error(`Subscription error for key '${key}':`, err),
      complete: () => console.log(`Subscription to '${key}' completed`)
    });
  }

  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.setState(() => this.history[this.currentIndex], false);
    }
  }

  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.setState(() => this.history[this.currentIndex], false);
    }
  }

  getState(key) {
    if (!key) return JSON.parse(JSON.stringify(this.state));
    const keys = key.split('.');
    let value = this.state;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (value === undefined || value === null) {
        console.warn(`Warning: Property '${keys.slice(0, i + 1).join('.')}' is undefined in the state object. Consider adding it to the initial state.`);
        return undefined;
      }
      value = value[k];
    }
    if (value === undefined) {
      console.warn(`Warning: Property '${key}' is undefined in the state object. Consider adding it to the initial state.`);
    }
    return value !== undefined ? JSON.parse(JSON.stringify(value)) : undefined;
  }
}

export default EnhancedZenObservable;
