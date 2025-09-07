import fs from 'fs';
import path from 'path';
import { logger } from './logger';

export function initializeUploadDirectories(): void {
  const uploadDirs = [
    'uploads/template-images',
    'uploads/temp',
    // Add other upload directories here
  ];

  uploadDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      logger.info(`Created upload directory: ${fullPath}`);
    }
  });
}