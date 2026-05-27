// vercel-build.js
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Building SensoPro for Vercel...');
console.log('📂 Directory:', process.cwd());

try {
  // Build backend
  console.log('📦 Building backend...');
  execSync('pnpm build:backend', { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });

  // Build frontend
  console.log('🎨 Building frontend...');
  execSync('pnpm build:frontend', { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });

  console.log('✅ Build complete!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}