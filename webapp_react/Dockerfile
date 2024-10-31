# ------------- deps ----------------
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat git
WORKDIR /opt/app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm i


# ------------- builder ----------------
# Rebuild the source code only when needed
FROM node:18-alpine AS builder
ENV NODE_ENV=production

WORKDIR /opt/app
COPY . .
# copy all modules from build_image
COPY --from=deps /opt/app/node_modules ./node_modules
# 这里可以运行自定义命令
RUN npm install -g pnpm
RUN pnpm build

# ------------- image ----------------
# Production image
FROM node:18-alpine AS runner
ENV NODE_ENV production
WORKDIR /opt/app

USER root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

RUN mkdir .next
RUN chown nextjs:nodejs .next

# 复制运行所需文件
COPY --from=builder --chown=nextjs:nodejs /opt/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /opt/app/public ./public
COPY --from=builder --chown=nextjs:nodejs /opt/app/.next/static ./.next/static

# 复制.env文件用于运行时
COPY .env.production ./

# 暴露端口
EXPOSE 3000

USER nextjs

CMD ["node", "server.js"]

