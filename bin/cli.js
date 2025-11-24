#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const HOME_DIR = os.homedir();
const DEFAULT_DATA_DIR = path.join(HOME_DIR, '.message-board');
const DEFAULT_PORT = 13478;

// Read version from package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const VERSION = packageJson.version;

function getPidFile(dataDir) {
    return path.join(dataDir, 'message-board.pid');
}

function getLogFile(dataDir) {
    return path.join(dataDir, 'message-board.log');
}

function ensureDataDir(dataDir) {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

function parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0] || 'start';
    const options = {
        port: DEFAULT_PORT,
        dataDir: DEFAULT_DATA_DIR,
        foreground: false
    };

    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--port' || args[i] === '-p') {
            options.port = parseInt(args[++i], 10);
        } else if (args[i] === '--data-dir' || args[i] === '-d') {
            options.dataDir = path.resolve(args[++i]);
        } else if (args[i] === '--foreground' || args[i] === '-f') {
            options.foreground = true;
        }
    }

    return { command, options };
}

function readPid(dataDir) {
    const pidFile = getPidFile(dataDir);
    if (!fs.existsSync(pidFile)) {
        return null;
    }
    try {
        const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
        // Check if process exists
        try {
            process.kill(pid, 0);
            return pid;
        } catch (e) {
            // Process doesn't exist, clean up stale PID file
            fs.unlinkSync(pidFile);
            return null;
        }
    } catch (e) {
        return null;
    }
}

function writePid(dataDir, pid) {
    const pidFile = getPidFile(dataDir);
    ensureDataDir(dataDir);
    fs.writeFileSync(pidFile, String(pid));
}

function removePid(dataDir) {
    const pidFile = getPidFile(dataDir);
    if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
    }
}

function startDaemon(options) {
    const existingPid = readPid(options.dataDir);
    if (existingPid) {
        console.log(`Message board is already running (PID: ${existingPid})`);
        console.log(`Access at http://localhost:${options.port}`);
        return;
    }

    ensureDataDir(options.dataDir);

    const serverPath = path.join(__dirname, '..', 'server.js');
    const env = {
        ...process.env,
        PORT: String(options.port),
        DATA_DIR: options.dataDir
    };

    if (options.foreground) {
        // Run in foreground
        console.log(`Starting message board on port ${options.port}...`);
        console.log(`Data directory: ${options.dataDir}`);
        const child = spawn(process.execPath, [serverPath], {
            env,
            stdio: 'inherit'
        });

        process.on('SIGINT', () => {
            child.kill('SIGINT');
            process.exit(0);
        });

        child.on('exit', (code) => {
            process.exit(code || 0);
        });
    } else {
        // Run as daemon
        const logFile = getLogFile(options.dataDir);
        // Open log file synchronously to ensure fd is ready for spawn
        const logFd = fs.openSync(logFile, 'a');
        const child = spawn(process.execPath, [serverPath], {
            env,
            detached: true,
            stdio: ['ignore', logFd, logFd]
        });

        child.unref();
        writePid(options.dataDir, child.pid);

        // Close the fd in parent process after spawning
        try {
            fs.closeSync(logFd);
        } catch (e) {
            // Ignore close errors
        }

        console.log(`Message board started successfully!`);
        console.log(`PID: ${child.pid}`);
        console.log(`Port: ${options.port}`);
        console.log(`Data directory: ${options.dataDir}`);
        console.log(`Log file: ${logFile}`);
        console.log(`\nAccess at http://localhost:${options.port}`);
        console.log(`\nUse 'message-board stop' to stop the service`);
        console.log(`Use 'message-board logs' to view logs`);
    }
}

function stopDaemon(options) {
    const pid = readPid(options.dataDir);
    if (!pid) {
        console.log('Message board is not running');
        return;
    }

    try {
        process.kill(pid, 'SIGTERM');
        removePid(options.dataDir);
        console.log(`Message board stopped (PID: ${pid})`);
    } catch (e) {
        console.error(`Failed to stop process ${pid}: ${e.message}`);
        removePid(options.dataDir);
    }
}

function restartDaemon(options) {
    const pid = readPid(options.dataDir);
    if (pid) {
        console.log('Stopping existing instance...');
        stopDaemon(options);
        // Wait a bit for graceful shutdown
        setTimeout(() => {
            console.log('Starting new instance...');
            startDaemon(options);
        }, 1000);
    } else {
        console.log('No running instance found, starting...');
        startDaemon(options);
    }
}

function showStatus(options) {
    const pid = readPid(options.dataDir);
    const logFile = getLogFile(options.dataDir);

    if (pid) {
        console.log(`Message board is running`);
        console.log(`PID: ${pid}`);
        console.log(`Data directory: ${options.dataDir}`);
        console.log(`Log file: ${logFile}`);
    } else {
        console.log('Message board is not running');
        console.log(`Data directory: ${options.dataDir}`);
    }
}

function showLogs(options) {
    const logFile = getLogFile(options.dataDir);

    if (!fs.existsSync(logFile)) {
        console.log('No log file found');
        console.log(`Expected location: ${logFile}`);
        return;
    }

    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').slice(-50); // Last 50 lines
    console.log(lines.join('\n'));
}

function showVersion() {
    console.log(`simple-message-board v${VERSION}`);
}

function showHelp() {
    console.log(`
Message Board CLI v${VERSION}

Usage:
  message-board [command] [options]

Commands:
  start                 Start the message board service (default, runs as daemon)
  stop                  Stop the message board service
  restart               Restart the message board service
  status                Show service status
  logs                  Show recent logs
  version               Show version information
  help                  Show this help message

Options:
  -p, --port <port>     Port to listen on (default: 13478)
  -d, --data-dir <dir>  Data directory (default: ~/.message-board)
  -f, --foreground      Run in foreground (not as daemon)
  -v, --version         Show version information

Examples:
  message-board                      # Start on default port 13478
  message-board start -p 8080        # Start on port 8080
  message-board start -d /tmp/mb     # Use custom data directory
  message-board start -f             # Start in foreground
  message-board stop                 # Stop the service
  message-board logs                 # View recent logs
  message-board --version            # Show version

Default data directory: ${DEFAULT_DATA_DIR}
    `.trim());
}

function main() {
    const { command, options } = parseArgs();

    // Handle global options
    if (command === '--version' || command === '-v') {
        showVersion();
        return;
    }

    if (command === '--help' || command === '-h') {
        showHelp();
        return;
    }

    switch (command) {
        case 'start':
            startDaemon(options);
            break;
        case 'stop':
            stopDaemon(options);
            break;
        case 'restart':
            restartDaemon(options);
            break;
        case 'status':
            showStatus(options);
            break;
        case 'logs':
            showLogs(options);
            break;
        case 'version':
            showVersion();
            break;
        case 'help':
            showHelp();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            console.log('Use "message-board help" for usage information');
            process.exit(1);
    }
}

main();
