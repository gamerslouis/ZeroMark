import configs from '/common/realConfigs.js';
function log(module, ...args) {
    if (configs) {
        let logContent = (configs.LogTime ? (`[${(new Date()).toString()}] `) : '')
            + (configs.showModuleName ? `${module}:` : JSON.stringify(args.shift()));
        while (args.length > 0)
        {
            let arg = args.shift();
            logContent += '\n';
            logContent += JSON.stringify(arg);
        }
        
        if (configs.useConsoleLog) console.log(logContent);
    }
}

export { log };