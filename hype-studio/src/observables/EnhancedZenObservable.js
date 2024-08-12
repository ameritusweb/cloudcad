import ZenObservable from 'zen-observable';
import { computeDiff as computeDiffUtil, computeArrayDiff as computeArrayDiffUtil } from '../utils/observableUtils';

class EnhancedSubscription {
  constructor(model, subscribe) {
    this._zenObservable = new ZenObservable(subscribe);
    this._subscriptions = new Map();
    this._parentObservable = null;
    this._model = model;
  }

  subscribe(observerOrNext, error, complete) {
    let observer;
    if (typeof observerOrNext === 'function') {
      observer = {
        next: observerOrNext,
        error: error || (() => {}),
        complete: complete || (() => {})
      };
    } else {
      observer = observerOrNext;
    }

    const subscription = this._zenObservable.subscribe(observer);
    this._subscriptions.set(subscription, observer);

    return {
      then: this,
      unsubscribe: () => {
        subscription.unsubscribe();
        this._subscriptions.delete(subscription);
      }
    };
  }

  map(project) {
    const mapped = new EnhancedSubscription(observer => 
      this._zenObservable.subscribe({
        next: value => observer.next(project(value)),
        error: error => observer.error(error),
        complete: () => observer.complete()
      })
    );
    mapped._parentObservable = this;
    return mapped;
  }

  filter(predicate) {
    const filtered = new EnhancedSubscription(observer => 
      this._zenObservable.subscribe({
        next: value => predicate(value) && observer.next(value),
        error: error => observer.error(error),
        complete: () => observer.complete()
      })
    );
    filtered._parentObservable = this;
    return filtered;
  }

  notify(value) {
    this._subscriptions.forEach((observer) => {
      observer.next(value);
    });
  }

  notifyError(error) {
    this._subscriptions.forEach((observer) => {
      observer.error(error);
    });
  }

  notifyComplete() {
    this._subscriptions.forEach((observer) => {
      observer.complete();
    });
  }
}

class HistoryModel {
  constructor() {
    this.past = [];
    this.future = [];
  }

  push(state) {
    this.past.push(state);
    this.future = [];
  }

  undo(currentState) {
    if (this.canUndo()) {
      const pastState = this.past.pop();
      this.future.unshift(currentState);
      return pastState;
    }
    return null;
  }

  redo(currentState) {
    if (this.canRedo()) {
      const nextState = this.future.shift();
      this.past.push(currentState);
      return nextState;
    }
    return null;
  }

  canUndo() {
    return this.past.length > 0;
  }

  canRedo() {
    return this.future.length > 0;
  }

  clear() {
    this.past = [];
    this.future = [];
  }
}

class EnhancedZenObservable {
  constructor(initialState = {}) {
    this.state = initialState;
    this.historyModel = new HistoryModel();
    this.currentIndex = 0;
    this.observables = new Map();
    this.diffObservables = new Map();
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
    if (this.observables.has(key)) {
      const observable = this.observables.get(key);
      observable.notify(value);
    }
    if (this.diffObservables.has(key)) {
      const diffObservable = this.diffObservables.get(key);
      diffObservable.notify(diff);
    }

    // Notify partial matches
    for (const [observerKey, observable] of this.observables.entries()) {
      if (key.startsWith(observerKey) && key !== observerKey) {
        observable.notify(this.getState(observerKey));
      }
    }
    for (const [observerKey, diffObservable] of this.diffObservables.entries()) {
      if (key.startsWith(observerKey) && key !== observerKey) {
        diffObservable.notify({
          type: 'nested',
          path: key.slice(observerKey.length + 1),
          value: diff
        });
      }
    }
  }

  computeDiff(oldObj, newObj) {
    return computeDiffUtil(oldObj, newObj);
  }

  computeArrayDiff(oldArray, newArray) {
    return computeArrayDiffUtil(oldArray, newArray);
  }

  subscribe(key, callback, useDiff = false, callerLocation = 'Unknown') {
    if (typeof key !== 'string') {
      console.error('Invalid key for subscribe method');
      return new EnhancedSubscription(this, () => {}).subscribe(() => {});
    }

    const observables = useDiff ? this.diffObservables : this.observables;

    // Create observables for all parts of the path
    const parts = key.split('.');
    let currentKey = '';
    for (const part of parts) {
      currentKey = currentKey ? `${currentKey}.${part}` : part;
      if (!observables.has(currentKey)) {
        observables.set(currentKey, new EnhancedSubscription(this, () => {}));
      }
    }

    const subscription = observables.get(key);
    return subscription.subscribe(traceCallback(callback, `Subscription to ${key}`, callerLocation));
  }

  setState(updater, recordHistory = true) {
    try {
      const prevState = JSON.parse(JSON.stringify(this.state));
      const newState = typeof updater === 'function' ? updater(this.state) : updater;
      const prevVersion = prevState.stateVersion;
      newState.stateVersion = this.generateNewVersion();
      const diff = this.computeDiff(this.state, newState);
      if (Object.keys(diff).length === 1) {
        newState.stateVersion = prevVersion;
        return; // no changes except for state version
      }
      this.applyDiff(diff);

      if (recordHistory) {
        this.historyModel.push(prevState);
      }

    } catch (error) {
      console.error('Error setting state:', error);
    }
  }

  undo() {
    const currentState = JSON.parse(JSON.stringify(this.state));
    const previousState = this.historyModel.undo(currentState);
    if (previousState) {
      this.setState(() => previousState, false);
    }
  }

  redo() {
    const currentState = JSON.parse(JSON.stringify(this.state));
    const nextState = this.historyModel.redo(currentState);
    if (nextState) {
      this.setState(() => nextState, false);
    }
  }

  canUndo() {
    return this.historyModel.canUndo();
  }

  canRedo() {
    return this.historyModel.canRedo();
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

   generateNewVersion() {
     const timestamp = Date.now().toString(36);
     const randomStr = Math.random().toString(36).substr(2, 5);
     return `${timestamp}-${randomStr}`;
  }
}

export default EnhancedZenObservable;