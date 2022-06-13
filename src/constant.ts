import path from 'path';
import os from 'os';

export const STORE_PATH = path.resolve(__dirname, '..', 'store');
export const TEMP_PATH = path.resolve(os.tmpdir(), 'cdn', 'tmp');

export const PORT = Number(process.env.PORT || 8080)
