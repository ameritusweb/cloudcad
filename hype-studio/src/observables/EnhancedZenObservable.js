import Observable from 'zen-observable';

class EnhancedZenObservable {
  constructor(initialState = {}) {
    this.state = initialState;
    this.regularObservers = new Map();
    this.diffObservers = new Map();
    this.history = [JSON.parse(JSON.stringify(initialState))];
    this.currentIndex = 0;
    this.initializeObservables(this.state);
  }

  initializeObservables(state, prefix = '') {
    for (const key in state) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (!this.regularObservers.has(fullKey)) {
        this.regularObservers.set(fullKey, []);
      }
      if (!this.diffObservers.has(fullKey)) {
        this.diffObservers.set(fullKey, []);
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
    // Notify exact matches
    this.notifyExactObservers(key, value, diff);

    // Notify partial matches
    this.notifyPartialObservers(key, value, diff);
  }

  notifyExactObservers(key, value, diff) {
    const regularObservers = this.regularObservers.get(key);
    const diffObservers = this.diffObservers.get(key);

    if (regularObservers) {
      regularObservers.forEach(observer => observer.next(value));
    }
    if (diffObservers) {
      diffObservers.forEach(observer => observer.next(diff));
    }
  }

  notifyPartialObservers(key, value, diff) {
    for (const [observerKey, observers] of this.regularObservers.entries()) {
      if (key.startsWith(observerKey) && key !== observerKey) {
        observers.forEach(observer => observer.next(this.getState(observerKey)));
      }
    }

    for (const [observerKey, observers] of this.diffObservers.entries()) {
      if (key.startsWith(observerKey) && key !== observerKey) {
        observers.forEach(observer => observer.next({
          type: 'nested',
          path: key.slice(observerKey.length + 1),
          value: diff
        }));
      }
    }
  }

  computeDiff(oldObj, newObj) {
    const diff = {};
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      if (oldValue === newValue) continue;

      if (oldValue === null || newValue === null) {
        diff[key] = { type: 'replace', value: newValue };
      } else if (typeof oldValue !== typeof newValue) {
        diff[key] = { type: 'replace', value: newValue };
      } else if (typeof newValue === 'object') {
        if (Array.isArray(newValue)) {
          diff[key] = { type: 'array', value: this.computeArrayDiff(oldValue, newValue) };
        } else {
          const nestedDiff = this.computeDiff(oldValue, newValue);
          if (Object.keys(nestedDiff).length > 0) {
            diff[key] = { type: 'object', value: nestedDiff };
          }
        }
      } else {
        diff[key] = { type: 'replace', value: newValue };
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
    const observer = {
      next: callback,
      error: (err) => console.error(`Subscription error for key '${key}':`, err),
      complete: () => console.log(`Subscription to '${key}' completed`)
    };

    if (useDiff) {
      if (!this.diffObservers.has(key)) {
        this.diffObservers.set(key, []);
      }
      this.diffObservers.get(key).push(observer);
    } else {
      if (!this.regularObservers.has(key)) {
        this.regularObservers.set(key, []);
      }
      this.regularObservers.get(key).push(observer);
    }

    return {
      unsubscribe: () => {
        if (useDiff) {
          this.diffObservers.set(key, this.diffObservers.get(key).filter(obs => obs !== observer));
        } else {
          this.regularObservers.set(key, this.regularObservers.get(key).filter(obs => obs !== observer));
        }
      }
    };
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
