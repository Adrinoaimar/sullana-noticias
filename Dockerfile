FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
COPY services/facebook-ingestor/requirements.txt services/facebook-ingestor/requirements.txt
RUN python3 -m venv /opt/facebook-venv \
  && /opt/facebook-venv/bin/pip install --no-cache-dir -r services/facebook-ingestor/requirements.txt

COPY . .
RUN mkdir -p data && chown -R node:node /app
USER node

ENV PATH="/opt/facebook-venv/bin:${PATH}"
ENV NODE_ENV=production
EXPOSE 8787
CMD ["node", "server.js"]
