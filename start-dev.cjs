/**
 * Development Startup Script for Report Fusion Hub
 *
 * Starts backend first, waits for it to be ready, then starts frontend.
 * If backend fails (e.g. database down), frontend is never started.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m'
};

// Validation checks
function validateEnvironment() {
  const rootEnvPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(rootEnvPath)) {
    console.error(`${colors.red}${colors.bright}Error: .env file not found in root directory.${colors.reset}`);
    console.log(`${colors.yellow}Please copy .env.example to .env and configure it.${colors.reset}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(path.join(__dirname, 'server'))) {
    console.error(`${colors.red}${colors.bright}Error: Server directory not found. Make sure you're in the project root.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Environment configuration found${colors.reset}`);
  return true;
}

// Load and validate environment variables
function loadEnvironment() {
  try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    
    const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'VITE_API_URL'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error(`${colors.red}${colors.bright}Error: Missing required environment variables: ${missing.join(', ')}${colors.reset}`);
      console.log(`${colors.yellow}Please check your .env file configuration.${colors.reset}`);
      process.exit(1);
    }
    
    console.log(`${colors.green}✓ Environment variables loaded${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}${colors.bright}Error loading environment: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Ensure dependencies are installed for both root and server
function installDependencies() {
  const rootModules = path.join(__dirname, 'node_modules');
  const serverModules = path.join(__dirname, 'server', 'node_modules');
  const rootLock = path.join(__dirname, 'package-lock.json');
  const serverLock = path.join(__dirname, 'server', 'package-lock.json');

  // Check if root node_modules is missing or stale
  if (!fs.existsSync(rootModules) || isStale(rootLock, rootModules)) {
    console.log(`${colors.yellow}Installing root dependencies...${colors.reset}`);
    execSync('npm install', { cwd: __dirname, stdio: 'inherit' });
    console.log(`${colors.green}✓ Root dependencies installed${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Root dependencies up to date${colors.reset}`);
  }

  // Check if server node_modules is missing or stale
  if (!fs.existsSync(serverModules) || isStale(serverLock, serverModules)) {
    console.log(`${colors.yellow}Installing server dependencies...${colors.reset}`);
    execSync('npm install', { cwd: path.join(__dirname, 'server'), stdio: 'inherit' });
    console.log(`${colors.green}✓ Server dependencies installed${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Server dependencies up to date${colors.reset}`);
  }
}

// Check if lock file is newer than node_modules (dependencies changed)
function isStale(lockFile, modulesDir) {
  try {
    if (!fs.existsSync(lockFile)) return false;
    const lockMtime = fs.statSync(lockFile).mtimeMs;
    const modulesMtime = fs.statSync(modulesDir).mtimeMs;
    return lockMtime > modulesMtime;
  } catch {
    return true;
  }
}

console.log(`${colors.bright}Starting Report Fusion Hub development servers...${colors.reset}`);

// Validate environment
validateEnvironment();
loadEnvironment();
installDependencies();

// Start backend first, then frontend after backend is ready
const backend = spawn('npm run dev', {
  cwd: path.join(__dirname, 'server'),
  shell: true,
  env: { ...process.env }
});

let frontend = null;
let frontendStarted = false;

function startFrontend() {
  if (frontendStarted) return;
  frontendStarted = true;

  console.log(`${colors.green}✓ Backend ready — starting frontend...${colors.reset}`);

  frontend = spawn('npm run dev', {
    cwd: __dirname,
    shell: true,
    env: { ...process.env }
  });

  frontend.stdout.on('data', (data) => {
    console.log(`${colors.green}[Frontend] ${colors.reset}${data.toString().trim()}`);
  });

  frontend.stderr.on('data', (data) => {
    console.error(`${colors.red}[Frontend] ${colors.reset}${data.toString().trim()}`);
  });

  console.log(`${colors.magenta}${colors.bright}
╔════════════════════════════════════════════════════════╗
║                                                        ║
║  Report Fusion Hub - Development Environment           ║
║                                                        ║
║  Backend: http://localhost:8945                        ║
║  Frontend: http://localhost:6234                       ║
║                                                        ║
║  Press Ctrl+C to stop all servers                      ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
${colors.reset}`);
}

// Watch backend output for ready signal
backend.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`${colors.blue}[Backend] ${colors.reset}${output.trim()}`);

  if (output.includes('Server running on port')) {
    startFrontend();
  }
});

backend.stderr.on('data', (data) => {
  console.error(`${colors.red}[Backend] ${colors.reset}${data.toString().trim()}`);
});

// If backend exits before frontend starts, abort
backend.on('close', (code) => {
  if (!frontendStarted) {
    console.error(`\n${colors.red}${colors.bright}Backend failed to start (exit code ${code}). Frontend will not be started.${colors.reset}`);
    process.exit(1);
  }
});

// Handle process termination
const killProcesses = () => {
  console.log(`${colors.bright}\nShutting down servers...${colors.reset}`);
  backend.kill();
  if (frontend) frontend.kill();
};

process.on('SIGINT', killProcesses);
process.on('SIGTERM', killProcesses);

console.log(`${colors.yellow}Waiting for backend to start...${colors.reset}`);
