import { Middleware } from 'koa';
import { customAlphabet } from 'nanoid';

export const ID_BET = 'ABCDEFGHIJKLNMOPQRSTUVSWXYZ1234567890';
export const ID_SIZE = 8;
const nanoid = customAlphabet(ID_BET, ID_SIZE)

export interface IIdMiddleContext {
    log: (...args: any[]) => void;
}

export const ID = (): Middleware => async (ctx, next) => {
    const id = nanoid()
    ctx.log = (...args: any[]) => console.log(`[${id}]`, ...args)
    await next()
    ctx.headers['x-cdn-id'] = id
}

export default ID;
