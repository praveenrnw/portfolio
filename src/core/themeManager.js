class ThemeManager {
  constructor() {
    this.current = null;
    this.components = null;
    this._listeners = [];
    this._linkId = 'theme-style';
  }

  async setTheme(name) {
    if (this.current === name) return this.components;
    // remove previous stylesheet
    const prev = document.getElementById(this._linkId);
    if (prev) prev.remove();

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    // href should be relative to the page (index.html) so browsers can load it
    link.href = `./src/themes/${name}/styles.css`;
    link.id = this._linkId;
    document.head.appendChild(link);

    // dynamic import of components
    // Use a relative import path from this module's location so native ESM can resolve it.
    // themeManager.js lives in /src/core/, so themes are at ../themes/
    const mod = await import(`../themes/${name}/components.js`);
    this.components = mod;
    this.current = name;
    this._listeners.forEach((cb) => cb(name));
    return mod;
  }

  getComponents() {
    return this.components;
  }

  onThemeChange(cb) {
    this._listeners.push(cb);
  }
}

export const themeManager = new ThemeManager();
