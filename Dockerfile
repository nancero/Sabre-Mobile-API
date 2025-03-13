FROM node:12.18.2-alpine AS builder

WORKDIR /home/ubuntu

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:12.18.2-alpine AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /home/ubuntu

COPY package*.json ./

RUN npm ci --only=production

COPY . .

COPY --from=builder /home/ubuntu/dist ./dist

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
