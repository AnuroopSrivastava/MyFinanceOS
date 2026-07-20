import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

import os from 'os';

const dataDir = path.join(os.homedir(), '.financeos');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'financeos_data.json');
const configPath = path.join(dataDir, 'financeos_config.json');

const localSyncPlugin = () => ({
  name: 'local-sync-plugin',
  configureServer(server: any) {
    server.middlewares.use('/api/config', (req: any, res: any) => {
      if (req.method === 'GET') {
        if (fs.existsSync(configPath)) {
          const data = fs.readFileSync(configPath, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(data);
        } else {
          res.statusCode = 404;
          res.end('Not found');
        }
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', () => {
          fs.writeFileSync(configPath, body, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        });
      }
    });

    server.middlewares.use('/api/db', (req: any, res: any) => {
      if (req.method === 'GET') {
        if (fs.existsSync(dbPath)) {
          const data = fs.readFileSync(dbPath, 'utf-8');
          res.setHeader('Content-Type', 'text/plain');
          res.end(data);
        } else {
          res.statusCode = 404;
          res.end('Not found');
        }
      } else if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', () => {
          fs.writeFileSync(dbPath, body, 'utf-8');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        });
      }
    });
  }
});

export default defineConfig({
  base: './',
  plugins: [react(), localSyncPlugin()],
  server: {
    port: 3000,
    host: true
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts']
  }
} as any);
