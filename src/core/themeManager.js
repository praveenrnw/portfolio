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
    link.href = `/src/themes/${name}/styles.css`;
    link.id = this._linkId;
    document.head.appendChild(link);

    // dynamic import of components
    const mod = await import(`/src/themes/${name}/components.js`);
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
