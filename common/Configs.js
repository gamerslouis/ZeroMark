import Listener from './Listener.js';

export default class Configs {
    constructor($default = {}, logger = null) {
        this.$default = $default;
        this.logger = logger || (() => { });
        this.appliedValues = {};
        this.onConfigChange = new Listener();
        this.loaded = false;

        this._applyValues($default);
    }

    tryLoad() {
        try {
            chrome.storage.local.get('configs', (e) => {
                let localConfigs = e.configs;
                if (localConfigs != undefined) this._applyValues(localConfigs);
                else this.logger('No local configs, apply defualt configs:',this.appliedValues);
            });
        }
        catch (error) {
            this.logger('Fail to load local configs');
        }
        
        this.loaded = true;
    }

    trySave(key, value) {
        try {
            chrome.storage.local.get('configs', (e) => {
                let localConfigs = e.configs;
                localConfigs[key] = value;
                chrome.storage.local.set({ 'configs': localConfigs });
            });
        } catch (error) {
            this.logger(`Fail to write local storage with ${key}:${value}`);
        }
    }

    _applyValues(valuePairs) {
        if (this.loaded) this.logger('Applied values:', valuePairs);
        for (const [key, value] of Object.entries(valuePairs)) {
            this.appliedValues[key] = value;
            if (this.loaded) this.onConfigChange.fire({ 'key': key, 'value': value });
            if (key in this) continue;
            Object.defineProperty(this, key, {
                get: () => this.appliedValues[key],
                set: (value) => { this.setValue(key, value); }
            });
        }
    }

    setValue(key, value) {
        if (key in this) {
            this._applyValues({ [key]: value });
            this.trySave(key, value);
        }
        else {
            this.logger(`Fail to set config because ${key} is not aviable property`);
        }
    }

    reset() {
        this.appliedValues(this.$default);
        this.trySave(this.$default);
    }
}
