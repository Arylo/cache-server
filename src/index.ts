import fs from 'fs';
import Koa from 'koa';
import mkdir from 'make-dir';
import { PORT, TEMP_PATH } from './constant';
import ID from './middleware/id';
import API from './api';
import Time from './middleware/time';

const app = new Koa();

app
    .use(ID())
    .use(Time());

app
    .use(API.routes())
    .use(API.allowedMethods());

app.listen(PORT, () => {
    console.log(`listening to port ${PORT}...`)
    if (!fs.existsSync(TEMP_PATH)) {
        mkdir.sync(TEMP_PATH)
    }
});
