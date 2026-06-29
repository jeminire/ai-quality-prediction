FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

COPY backend/ ./backend/

RUN mkdir -p backend/app/static
RUN cp -r frontend/dist/* backend/app/static/ 2>/dev/null || true

WORKDIR /app/backend

EXPOSE 5000

CMD gunicorn -w 4 -b 0.0.0.0:${PORT:-5000} 'app.main:create_app("production")'
