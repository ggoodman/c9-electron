'use strict';

require("./c9sdk/node_modules/amd-loader");


const Async = require('async');
const Child = require('child_process');
const Configstore = require('configstore');
const Electron = require('electron');
const Fs = require('fs');
const Menu = require('./menu');
const Os = require('os');
const Package = require('./package.json');
const Path = require('path');

const BrowserWindow = Electron.BrowserWindow;
const Dialog = Electron.dialog;


const config = new Configstore(Package.name, {
    port: 3231,
    x: undefined,
    y: undefined,
    width: 1024,
    height: 768,
});
const app = Electron.app;


// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform != 'darwin') {
        app.quit();
    }
});


Async.waterfall([
    (next) => initializeElectron(next),
    (next) => setWorkspaceRoot(next),
    // (next) => installC9(next),
    // (next) => updateC9(next),
    (next) => startC9(next),
    (server, next) => openWindow(server, next),
], err => {
    if (err) {
        console.error(err.stack);
        app.quit(1);
    }
    app.quit();
});


function initializeElectron(cb) {
    app.on('ready', e => {
        cb();
    });
}

function setWorkspaceRoot(cb) {
    const dirname = config.get('workspaceRoot') || Dialog.showOpenDialog({
        title: 'Select your workspace root',
        defaultPath: Os.homedir(),
        properties: ['openDirectory'],
    })[0];
    
    config.set('workspaceRoot',  dirname || Os.homedir());
    
    return cb();
}

// function installC9(cb) {
//     Fs.stat(Path.join(__dirname, 'c9sdk'), (err, stats) => {
//         if (!err) {
//             return process.argv.indexOf('--update') !== -1
//                 ?   updateC9(cb)
//                 :   cb();
//         }
//         if (err.code !== 'ENOENT') return cb(err);
        
//         Child.exec('git clone https://github.com/c9/core.git c9sdk', {
//             cwd: __dirname,
//         }, (err, stdio, stderr) => {
//             if (err) return cb(err);
            
//             return updateC9(cb);
//         });
//     });
// }

// function updateC9(cb) {
//     Child.exec('./scripts/install-sdk.sh', {
//         cwd: Path.join(__dirname, 'c9sdk'),
//         silent: true,
//     }, (err) => {
//         if (err) return cb(err);
        
//         cb();
//     });
// }

function startC9(cb) {
    const Architect = require('./c9sdk/node_modules/architect');
    const Config = require('./c9sdk/configs/standalone');
    const Optimist = require('./c9sdk/node_modules/optimist');
    const Settings = require('./c9sdk/settings/standalone');
    
    const argv = [
        '--listen', '127.0.0.1',
        '--port', config.get('port'),
        '-w', config.get('workspaceRoot'),
    ];
    const options = Optimist(argv)
        .default("settings", 'devel');
    const manifest = require('./c9sdk/package.json');
    manifest.revision = Package.version;
    const settings = Settings(manifest);
    const plugins = Config(settings, options);
    
    return Architect.resolveConfig(plugins, __dirname + "/c9sdk/plugins", (err, config) => {
        if (err) return cb(err);
        
        Fs.writeFileSync('/Users/ggoodman/Projects/c9-electron.json', JSON.stringify(plugins, null, 2), 'utf-8');
        
        const app = Architect.createApp(config, (err, c9) => {
            if (err) return cb(err);
            
            cb(null, c9);
        });
        
        app.on("service", (name, plugin) => {
            if (typeof plugin !== "function")
                plugin.name = name; 
        });
    });
}

function openWindow(c9, cb) {
    let mainWindow = createWindow();
    
    Menu.installFor(app);
    
    app.on('activate', e => {
        if (mainWindow === null) {
            mainWindow = createWindow()
        }
    })
        
    app.on('will-quit', e => {
        // console.log('application will quit', e);
        
        c9.destroy();
    });
    
    function createWindow() {
        const window = new BrowserWindow({
            x: config.get('x'),
            y: config.get('y'),
            width: config.get('width'),
            height: config.get('height'),
            webPreferences: {
                nodeIntegration: false,
            },
        });
        
        window.loadURL(`http://127.0.0.1:${config.get('port')}`);
    
        // Emitted when the window is closed.
        window.once('closed', e => {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            window.removeAllListeners('resize');
            
            mainWindow = null;
        });
        
        window.on('resize', e => {
            const bounds = window.getBounds();
            
            config.set('x',bounds.x);
            config.set('y',bounds.y);
            config.set('width',bounds.width);
            config.set('height',bounds.height);
        });
        
        return window;
    }
}