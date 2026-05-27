// vercel-build.js
import { execSync } from 'child_process';

console.log('🚀 Building SensoPro for Vercel...');

try {
  // Install with strict lockfile
  console.log('📦 Installing dependencies...');
  execSync('pnpm install --frozen-lockfile=false', { stdio: 'inherit' });

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