#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const HOME_DIR = os.homedir();
const DEFAULT_DATA_DIR = path.join(HOME_DIR, '.message-board');
const PID_FILE = path.join(DEFAULT_DATA_DIR, 'message-board.pid');
const LOG_FILE = path.join(DEFAULT_DATA_DIR, 'message-board.log');
const DEFAULT_PORT = 13478;

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
            options.dataDir = args[++i];
        } else if (args[i] === '--foreground' || args[i] === '-f') {
            options.foreground = true;
        }
    }

    return { command, options };
}

function readPid() {
    if (!fs.existsSync(PID_FILE)) {
        return null;
    }
    try {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10);
        // Check if process exists
        try {
            process.kill(pid, 0);
            return pid;
        } catch (e) {
            // Process doesn't exist, clean up stale PID file
            fs.unlinkSync(PID_FILE);
            return null;
        }
    } catch (e) {
        return null;
    }
}

function writePid(pid) {
    fs.writeFileSync(PID_FILE, String(pid));
}

function removePid() {
    if (fs.existsSync(PID_FILE)) {
        fs.unlinkSync(PID_FILE);
    }
}

function startDaemon(options) {
    const existingPid = readPid();
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
        const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
        const child = spawn(process.execPath, [serverPath], {
            env,
            detached: true,
            stdio: ['ignore', logStream, logStream]
        });

        child.unref();
        writePid(child.pid);

        console.log(`Message board started successfully!`);
        console.log(`PID: ${child.pid}`);
        console.log(`Port: ${options.port}`);
        console.log(`Data directory: ${options.dataDir}`);
        console.log(`Log file: ${LOG_FILE}`);
        console.log(`\nAccess at http://localhost:${options.port}`);
        console.log(`\nUse 'message-board stop' to stop the service`);
        console.log(`Use 'message-board logs' to view logs`);
    }
}

function stopDaemon() {
    const pid = readPid();
    if (!pid) {
        console.log('Message board is not running');
        return;
    }

    try {
        process.kill(pid, 'SIGTERM');
        removePid();
        console.log(`Message board stopped (PID: ${pid})`);
    } catch (e) {
        console.error(`Failed to stop process ${pid}: ${e.message}`);
        removePid();
    }
}

function restartDaemon(options) {
    const pid = readPid();
    if (pid) {
        console.log('Stopping existing instance...');
        stopDaemon();
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

function showStatus() {
    const pid = readPid();
    if (pid) {
        console.log(`Message board is running`);
        console.log(`PID: ${pid}`);
        console.log(`Log file: ${LOG_FILE}`);
    } else {
        console.log('Message board is not running');
    }
}

function showLogs() {
    if (!fs.existsSync(LOG_FILE)) {
        console.log('No log file found');
        return;
    }

    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').slice(-50); // Last 50 lines
    console.log(lines.join('\n'));
}

function showHelp() {
    console.log(`
Message Board CLI

Usage:
  message-board [command] [options]

Commands:
  start                 Start the message board service (default, runs as daemon)
  stop                  Stop the message board service
  restart               Restart the message board service
  status                Show service status
  logs                  Show recent logs
  help                  Show this help message

Options:
  -p, --port <port>     Port to listen on (default: 13478)
  -d, --data-dir <dir>  Data directory (default: ~/.message-board)
  -f, --foreground      Run in foreground (not as daemon)

Examples:
  message-board                      # Start on default port 13478
  message-board start -p 8080        # Start on port 8080
  message-board start -f             # Start in foreground
  message-board stop                 # Stop the service
  message-board logs                 # View recent logs

Data directory: ${DEFAULT_DATA_DIR}
    `.trim());
}

function main() {
    const { command, options } = parseArgs();

    switch (command) {
        case 'start':
            startDaemon(options);
            break;
        case 'stop':
            stopDaemon();
            break;
        case 'restart':
            restartDaemon(options);
            break;
        case 'status':
            showStatus();
            break;
        case 'logs':
            showLogs();
            break;
        case 'help':
        case '--help':
        case '-h':
            showHelp();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            console.log('Use "message-board help" for usage information');
            process.exit(1);
    }
}

main();
