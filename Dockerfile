FROM oven/bun AS development

WORKDIR /usr/src/app

COPY package.json ./
COPY bun.lockb ./

RUN bun install --production

COPY src src
COPY tsconfig.json ./

# FROM oven/bun AS production

# ARG NODE_ENV=production
# ENV NODE_ENV=${NODE_ENV}

# WORKDIR /usr/src/app

# COPY package.json ./
# COPY bun.lockb ./

# RUN bun install --prod

# COPY src src
# COPY tsconfig.json ./

ENV NODE_ENV production

CMD ["bun", "src/index.ts"]

EXPOSE 8080