const Architect = require('./c9sdk/node_modules/architect');
const Config = require('./c9sdk/configs/standalone');
const Configstore = require('configstore');
const Optimist = require('./c9sdk/node_modules/optimist');
const Package = require('./package.json');
const Path = require('path');
const Settings = require('./c9sdk/settings/standalone');

const config = new Configstore(Package.name, {
    port: 3231,
});
const argv = [
    '--listen', '127.0.0.1',
    '--port', config.get('port'),
    '-w', config.get('workspaceRoot'),
];
const options = Optimist(argv)
    .default("settings", 'devel');
const settings = Settings();
const plugins = Config(settings, options);

process.cwd(Path.join(__dirname, 'c9sdk'));


Architect.resolveConfig(plugins, __dirname + "/c9sdk/plugins", (err, config) => {
    if (err) return error(err);
    
    const app = Architect.createApp(config, (err, c9) => {
        if (err) return error(err);
        
        console.log('started c9 server');
        
        process.send('ready');
        
        process.on('exit', e => {
            console.log('stopping c9 server');
            c9.destroy();
        });
    });
        
    app.on("service", (name, plugin) => {
        if (typeof plugin !== "function")
            plugin.name = name; 
    });
});

function error(e) {
    console.error(e.message);
    console.error(e.stack);
    
    process.exit(1);
}
