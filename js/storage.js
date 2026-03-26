// storage.js - Handles all localStorage persistence for game progress

const Storage = {
  KEY: 'geometryKids_v1',

  _defaults() {
    return { unlockedLevel: 1, stars: {}, selectedChar: 'cube' };
  },

  get() {
    try {
      const data = localStorage.getItem(this.KEY);
      return data ? Object.assign(this._defaults(), JSON.parse(data)) : this._defaults();
    } catch (e) {
      return this._defaults();
    }
  },

  save(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); } catch (e) {}
  },

  completeLevel(levelId, deaths) {
    const d = this.get();
    const earned = this.calcStars(deaths);
    // Only update if better score
    if (!d.stars[levelId] || earned > d.stars[levelId]) {
      d.stars[levelId] = earned;
    }
    // Unlock next level
    if (levelId >= d.unlockedLevel) {
      d.unlockedLevel = levelId + 1;
    }
    this.save(d);
    return earned;
  },

  calcStars(deaths) {
    if (deaths === 0) return 5;
    if (deaths === 1) return 4;
    if (deaths <= 4) return 3;
    if (deaths <= 9) return 2;
    return 1;
  },

  getStars(levelId) {
    return this.get().stars[levelId] || 0;
  },

  isUnlocked(levelId) {
    return levelId <= this.get().unlockedLevel;
  },

  saveChar(charId) {
    const d = this.get();
    d.selectedChar = charId;
    this.save(d);
  },

  getChar() {
    return this.get().selectedChar || 'cube';
  },

  reset() {
    localStorage.removeItem(this.KEY);
  }
};
