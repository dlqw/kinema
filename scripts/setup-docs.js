/**
 * AniMaker 文档构建脚本
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const docsDir = path.join(__dirname, '../docs');
const publicDir = path.join(docsDir, 'public');

// 确保 public 目录存在
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Created docs/public directory');
}

// 创建必要的子目录
const subdirs = ['images', 'videos', 'examples'];
subdirs.forEach((dir) => {
  const fullPath = path.join(publicDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created docs/public/${dir} directory`);
  }
});

console.log('Documentation build setup complete!');
