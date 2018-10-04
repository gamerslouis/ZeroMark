class Listener {
    constructor() {
        this.listeners = [];
    }
    addListener(listener) {
        this.listeners.push(listener.bind(this));
    }

    removeListener(listener) {
        for (let i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i] == listener) {
                delete this.listeners[i];
            }
        }
    }

    fire(args) {
        this.listeners.forEach(listener => {
            listener(args);
        });
    }
}
