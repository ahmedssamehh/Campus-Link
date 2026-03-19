# build v7
FROM node:20-alpine

WORKDIR /app

COPY server/package*.json ./

RUN npm install --production

COPY server/ .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "src/server.js"]
