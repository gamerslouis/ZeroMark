class Listener {
    constructor() {
        this.listeners = [];
        this.addListener = (listener) => {
            this.listeners.push(listener);
        };

        this.removeListener = (listener) => {
            for (let i = 0; i < this.listeners.length; i++) {
                if (this.listeners[i] == listener) {
                    delete this.listeners[i];
                }
            }
        };
        
        this.fire = (sender, args) => {
            this.listeners.forEach(listener => {
                listener(sender, args);
            });
        };
    }
}
