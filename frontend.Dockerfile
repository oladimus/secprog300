FROM node:20

WORKDIR /app

COPY frontend/package*.json /app/
RUN npm install && npm cache clean --force

EXPOSE 5173

CMD npm run dev
