import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function copyDir(src, dest) {
  try {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (err) {
    // Ignore if source doesn't exist
    if (err && err.code !== 'ENOENT') throw err;
  }
}

async function main() {
  const distRoot = path.join(projectRoot, 'dist');

  // Copy JSON data used at runtime
  await copyDir(path.join(projectRoot, 'src', 'data'), path.join(distRoot, 'data'));

  // Copy sound assets used at runtime
  await copyDir(
    path.join(projectRoot, 'src', 'assets', 'sounds'),
    path.join(distRoot, 'assets', 'sounds')
  );

  // Copy locales for i18n
  await copyDir(path.join(projectRoot, 'src', 'locales'), path.join(distRoot, 'locales'));

  console.log('✅ Assets copied to dist');
}

main().catch((err) => {
  console.error('❌ Failed to copy assets:', err);
  process.exit(1);
});
