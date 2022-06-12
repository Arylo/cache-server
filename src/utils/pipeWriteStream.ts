import fs from 'fs';
import path from 'path';
import mkdir from 'make-dir';
import { TEMP_PATH } from '../constant';
import { nanoid } from 'nanoid';

export const pipeWriteStream = (stream: NodeJS.ReadableStream, targetPath: string) => new Promise((resolve, reject) => {
    const tmpFilepath = path.resolve(TEMP_PATH, nanoid());
    if (!fs.existsSync(path.dirname(tmpFilepath))) {
        mkdir.sync(path.dirname(tmpFilepath))
    }
    const ws = fs.createWriteStream(tmpFilepath)
    ws.on('error', (e) => {
        reject(e);
    });
    ws.on(`finish`, () => {
        if (!fs.existsSync(path.dirname(targetPath))) {
            mkdir.sync(path.dirname(targetPath))
        }
        fs.rename(tmpFilepath, targetPath, () => {
            resolve(targetPath);
        })
    });
    stream.pipe(ws)
});
