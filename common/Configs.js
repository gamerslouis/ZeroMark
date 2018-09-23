import Listner from './Listener.js';

export default class Configs {
    constructor($default = {}, logger = null) {
        this.$default = $default;
        this.logger = logger || (() => { });
        this.appliedValues = {};
        this.listner = new Listner();
        this.available = false;

        this.applyValues($default);
    }

    tryLoad() {
        try {
            let localConfigs = chrome.storage.local.get('configs');
            this.applyValues(localConfigs);
        }
        catch(error){
            this.logger('Fail to load local configs');
        }
        finally {
            this.available = true;
        }
    }

    trySave(valuePairs) {
        try {
            chrome.storage.local.set({ 'configs': valuePairs });
        } catch (error) {
            this.logger(`Fail to write local storage with ${valuePairs}`);
        }
    }

    applyValues(valuePairs) {
        if(this.available) this.logger('Applied values:', valuePairs);
        for (const [key, value] of Object.entries(valuePairs)) {
            this.appliedValues[key] = value;
            if(this.available) this.listner.fire({ 'key': key, 'value': value });
            if (key in this) continue;
            Object.defineProperty(this, key, {
                get: () => this.appliedValues[key],
                set: (value) => { this.setValue(key, value); }
            });
        }
    }

    setValue(key, value) {
        if (key in this) {
            this.applyValues({ [key]: value });
            this.trySave({ [key]: value });
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
