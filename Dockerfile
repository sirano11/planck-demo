FROM node

# RUN apk update && apk add python3 make
RUN corepack enable && corepack prepare yarn@4.2.2 --activate

WORKDIR /usr/src/app
ARG APP
ARG START_COMMAND=dev
COPY yarn.lock package.json ./



COPY ./ ./
RUN yarn install

CMD tail -f /dev/null

