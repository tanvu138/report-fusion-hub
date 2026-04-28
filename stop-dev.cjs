#!/usr/bin/env node

/**
 * Stop Development Servers Script for Report Fusion Hub
 * 
 * This script stops all development servers running on the configured ports
 * and cleans up any lingering processes.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m'
};

// Load environment variables to get the ports
function loadPorts() {
  try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    return {
      backend: process.env.PORT || '8945',
      frontend: process.env.VITE_FRONTEND_PORT || '6234'
    };
  } catch (error) {
    console.warn(`${colors.yellow}Warning: Could not load .env file. Using default ports.${colors.reset}`);
    return {
      backend: '8945',
      frontend: '6234'
    };
  }
}

// Kill processes on specific port
function killProcessesOnPort(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti :${port}`, (error, stdout, stderr) => {
      if (error) {
        // No processes found on this port
        resolve(false);
        return;
      }
      
      const pids = stdout.trim().split('\n').filter(pid => pid);
      if (pids.length === 0) {
        resolve(false);
        return;
      }
      
      console.log(`${colors.blue}Killing processes on port ${port}: ${pids.join(', ')}${colors.reset}`);
      
      exec(`kill -9 ${pids.join(' ')}`, (killError) => {
        if (killError) {
          console.error(`${colors.red}Error killing processes on port ${port}: ${killError.message}${colors.reset}`);
        } else {
          console.log(`${colors.green}Successfully killed processes on port ${port}${colors.reset}`);
        }
        resolve(true);
      });
    });
  });
}

// Check if ports are actually clear
function verifyPortsClear(ports) {
  return new Promise((resolve) => {
    let checks = 0;
    let cleared = 0;
    
    [ports.backend, ports.frontend].forEach(port => {
      exec(`lsof -ti :${port}`, (error) => {
        checks++;
        if (error) {
          // Port is clear
          cleared++;
        }
        
        if (checks === 2) {
          resolve(cleared === 2);
        }
      });
    });
  });
}

async function main() {
  console.log(`${colors.bright}Stopping Report Fusion Hub development servers...${colors.reset}`);
  
  const ports = loadPorts();
  
  // Kill processes on specific ports only
  const backendKilled = await killProcessesOnPort(ports.backend);
  const frontendKilled = await killProcessesOnPort(ports.frontend);
  
  // Verify ports are actually clear
  const allClear = await verifyPortsClear(ports);
  
  if (backendKilled || frontendKilled) {
    console.log(`${colors.green}${colors.bright}Development servers stopped successfully!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}No development servers found running on ports ${ports.backend} (backend) or ${ports.frontend} (frontend)${colors.reset}`);
  }
  
  if (allClear) {
    console.log(`${colors.green}Ports confirmed clear: ${ports.backend} (backend), ${ports.frontend} (frontend)${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Some processes may still be running. Check manually with: lsof -i :${ports.backend} -i :${ports.frontend}${colors.reset}`);
  }
}

main().catch(error => {
  console.error(`${colors.red}Error stopping servers: ${error.message}${colors.reset}`);
  process.exit(1);
});