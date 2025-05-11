FROM node:24-slim

WORKDIR /app

COPY package*.json ./

RUN npm install && npm cache clean --force

COPY . ./

EXPOSE 5173

CMD npm run dev
