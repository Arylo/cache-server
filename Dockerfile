FROM node:14 as build

WORKDIR /app

ADD package.json package-lock.json /app/

RUN npm ci -C /app

ADD tsconfig.json /app/

ADD src /app/

RUN npm run build -C /app

FROM gcr.io/distroless/nodejs:14 as runtime

LABEL NODE_ENV="production"
LABEL NODE_TLS_REJECT_UNAUTHORIZED="0"

COPY --from=build /app /app

CMD node /app
