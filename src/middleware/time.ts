import { Middleware } from 'koa';
import { IIdMiddleContext } from './id';

export const TIME = (): Middleware<{}, IIdMiddleContext> => async (ctx, next) => {
    const now = Date.now();
    const logFn = ctx.log;
    ctx.log = (...args: any[]) => logFn(`[${Date.now() - now}]`, ...args);
    ctx.log(ctx.path);
    await next();
    ctx.log(ctx.path, `[${Date.now() - now}ms]`)
};

export default TIME;
