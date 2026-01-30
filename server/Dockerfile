FROM node:20-slim
WORKDIR /app

# Install deps first for better layer caching
COPY package.json ./
RUN npm install --omit=dev

COPY src ./src

# persistent data dir (can be mounted as a volume)
RUN mkdir -p /data

ENV DB_PATH=/data/indark.sqlite
EXPOSE 8080
CMD ["node", "src/index.js"]
