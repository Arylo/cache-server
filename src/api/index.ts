import Router from '@koa/router';
import CDN from './cdn';

const router = new Router({ prefix: '/api' });

router
    .use(CDN.routes())
    .use(CDN.allowedMethods())

export default router;
