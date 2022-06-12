import path from 'path';
import os from 'os';

export const STORE_PATH = path.resolve(__dirname, '..', 'store');
export const TEMP_PATH = path.resolve(os.tmpdir(), 'cdn', 'tmp');
