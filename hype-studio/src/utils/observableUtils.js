export const computeDiff = (oldObj, newObj) => {
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
          diff[key] = { type: 'array', value: computeArrayDiff(oldValue, newValue) };
        } else {
          const nestedDiff = computeDiff(oldValue, newValue);
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

  export const computeArrayDiff = (oldArray, newArray) => {
    const diff = { removed: [], added: [], changed: [] };
    const maxLength = Math.max(oldArray.length, newArray.length);
    for (let i = 0; i < maxLength; i++) {
      if (i >= oldArray.length) {
        diff.added.push({ index: i, value: newArray[i] });
      } else if (i >= newArray.length) {
        diff.removed.push({ index: i });
      } else if (JSON.stringify(oldArray[i]) !== JSON.stringify(newArray[i])) {
        diff.changed.push({ index: i, value: computeDiff(oldArray[i], newArray[i]) });
      }
    }
    return diff;
  }