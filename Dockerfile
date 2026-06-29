FROM python:3.11-slim

WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./

EXPOSE 5000

CMD gunicorn -w 4 -b 0.0.0.0:${PORT:-5000} 'app.main:create_app("production")'
