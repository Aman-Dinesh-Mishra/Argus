FROM node:22-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-venv \
    bash \
    && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
COPY services/risk-engine/pyproject.toml services/risk-engine/
COPY services/risk-engine/src services/risk-engine/src
RUN pip install --no-cache-dir ./services/risk-engine
COPY app/server/package.json app/server/package-lock.json ./app/server/
RUN npm ci --prefix app/server
COPY app/server ./app/server
RUN npm run build --prefix app/server
COPY artifacts ./artifacts
COPY start.sh ./start.sh
RUN chmod +x ./start.sh
ENV NODE_ENV=production
ENV RISK_ENGINE_URL=http://127.0.0.1:8000
ENV RISK_ENGINE_TIMEOUT_MS=30000
EXPOSE 10000
CMD ["./start.sh"]
