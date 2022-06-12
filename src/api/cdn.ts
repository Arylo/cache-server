import fs from 'fs';
import path from 'path';
import Application, { Middleware } from 'koa';
import Router from '@koa/router';
import fetch from 'node-fetch';
import md5 from 'md5';
import { STORE_PATH } from '../constant';
import { pipeWriteStream } from '../utils/pipeWriteStream';
import { IIdMiddleContext } from '../middleware/id';
import delay from '../utils/delay';

type State = {
  url: string;
  URL: URL;
  hash: string;
  targetPath: string;
  filename: string;
  mode: 'delay' | 'sync';
  error?: {
    code: number;
    message: string;
  };
}
type M = Middleware<State, IIdMiddleContext>

const router = new Router({ prefix: '/cdn' });
const cacheQueue = new Map<string, number>();

const paramModeCheck: () => M = () => async (ctx, next) => {
  const mode = ctx.query.mode !== 'sync' ? 'delay' : 'sync'
  ctx.state = {
    ...ctx.state,
    mode,
  };
  await next();
}

const paramUrlCheck: () => M = () => async (ctx, next) => {
  let url: string = ctx.query.u as string
  ctx.log('request url:', url)
  url = new URL(url, ctx.header.referer).href
  const obj = {
    url: url,
    URL: new URL(url),
    hash: md5(url),
    get targetPath() {
      return path.resolve(STORE_PATH, obj.URL.host, obj.filename);
    },
    get filename() {
      return [
        obj.hash.slice(0, 6),
        obj.URL.pathname.split('/').reverse()[0],
      ].join('-');
    },
  };
  ctx.state = {
    ...ctx.state,
    ...obj,
  };
  ctx.log('raw url:', obj.url)
  ctx.log('url hash:', obj.hash)
  await next()
};

const useFile: () => M = () => async (ctx, next) => {
  const { url, hash, mode, targetPath } = ctx.state;
  if (fs.existsSync(targetPath)) {
    ctx.log('msg:', 'hit cache')
    ctx.body = fs.createReadStream(targetPath)
    return
  }
  if (mode === 'delay') {
    if (!cacheQueue.has(hash)) {
      ctx.log('msg:', 'start cache');
      cacheFile(ctx);
    }
    ctx.log('msg:', 'redirect to raw url');
    ctx.redirect(url)
    return
  }
  if (mode === 'sync' && cacheQueue.has(hash)) {
    const u = new URL(ctx.href);
    const params = new URLSearchParams(u.search);
    const curTime = Number(params.get('count') || 0);
    if (curTime >= 10) {
      params.set('mode', 'delay')
      u.search = params.toString()
    } else {
      params.set('count', Number(params.get('count') || 0).toString())
      u.search = params.toString()
      await delay(1000);
      ctx.log('msg:', 'redirect to next cache url');
    }
    ctx.redirect(u.href)
    return
  }
  await next();
};

const cacheFile = async (ctx: Application.ParameterizedContext<State, IIdMiddleContext>) => {
  const { url, URL, hash, targetPath } = ctx.state;
  cacheQueue.set(hash, 1);
  ctx.log('msg:', 'first url')
  const headers = {
    ...ctx.header,
    host: URL.host,
    referer: ctx.header.referer || URL.host,
    'user-agent': ctx.header['user-agent'] || 'arylo fetch',
  } as any
  const res = await fetch(url, { headers })
  if (!res.ok) {
    ctx.log('msg:', 'get file fail')
    cacheQueue.delete(hash);
    return [res.status, res.statusText] as [number, string]
  }

  await pipeWriteStream(res.body, targetPath);
  await delay(50);
  cacheQueue.delete(hash);
  return targetPath;
};

const fn = (): M => async (ctx, next) => {
  const data = await cacheFile(ctx)
  if (typeof data === 'string') {
    ctx.log('msg:', 'use new cache');
    ctx.status = 200;
    ctx.body = fs.createReadStream(data);
  } else {
    const [status, text] = data;
    ctx.log('error:', status, text);
    ctx.status = status;
    ctx.body = text;
  }
}

router
  .use(paramModeCheck() as Middleware, paramUrlCheck() as Middleware)
  .get('/', useFile() as Middleware, fn());

export default router;
