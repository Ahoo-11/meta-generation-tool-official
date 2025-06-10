/**
 * Development server starter
 * This script starts both the frontend and backend servers
 */
const { spawn } = require('child_process');
const path = require('path');

// Start the backend server
console.log('Starting backend server...');
const backend = spawn('node', ['src/server/server.js'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: 3000 }
});

// Start the frontend server
console.log('Starting frontend server...');
const frontend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit'
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});

// Handle backend server exit
backend.on('exit', (code) => {
  console.log(`Backend server exited with code ${code}`);
  frontend.kill('SIGINT');
  process.exit(code);
});

// Handle frontend server exit
frontend.on('exit', (code) => {
  console.log(`Frontend server exited with code ${code}`);
  backend.kill('SIGINT');
  process.exit(code);
});

console.log('Development servers started');
console.log('- Frontend: http://localhost:5174');
console.log('- Backend: http://localhost:3000');
console.log('- Test page: http://localhost:5174/html/payment-test.html');
