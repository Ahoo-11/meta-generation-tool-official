/**
 * Production server starter
 * This script starts the production server
 */
const { spawn } = require('child_process');

// Start the server
console.log('Starting production server...');
const server = spawn('node', ['src/server/server.js'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'production' }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

// Handle server exit
server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});

console.log('Production server started');
console.log('- Server: http://localhost:3000');
