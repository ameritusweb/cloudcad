class ModelManager {
    constructor() {
      this.parts = [];
      this.history = [];
    }
  
    addPart(part) {
      this.parts.push(part);
      this.history.push({ action: 'add', part });
    }
  
    removePart(partId) {
      const index = this.parts.findIndex(p => p.id === partId);
      if (index !== -1) {
        const removedPart = this.parts.splice(index, 1)[0];
        this.history.push({ action: 'remove', part: removedPart });
      }
    }
  
    modifyPart(partId, modification) {
      const part = this.parts.find(p => p.id === partId);
      if (part) {
        const oldState = { ...part };
        Object.assign(part, modification);
        this.history.push({ action: 'modify', partId, oldState, newState: { ...part } });
      }
    }
  
    undo() {
      const lastAction = this.history.pop();
      if (lastAction) {
        switch (lastAction.action) {
          case 'add':
            this.removePart(lastAction.part.id);
            break;
          case 'remove':
            this.parts.push(lastAction.part);
            break;
          case 'modify':
            const part = this.parts.find(p => p.id === lastAction.partId);
            if (part) {
              Object.assign(part, lastAction.oldState);
            }
            break;
        }
      }
    }
  
    exportModel() {
      return JSON.stringify(this.parts);
    }
  
    importModel(jsonString) {
      this.parts = JSON.parse(jsonString);
      this.history = [];
    }
  }
  
  export default ModelManager;