FROM node:22-bookworm-slim AS frontend
WORKDIR /app
COPY package*.json ./
COPY apps/playground/package.json apps/playground/package.json
COPY packages/tokens/package.json packages/tokens/package.json
COPY packages/ui-core/package.json packages/ui-core/package.json
COPY packages/ui-foundation/package.json packages/ui-foundation/package.json
RUN npm ci
COPY . .
RUN npm run build

FROM python:3.13-slim
WORKDIR /app
COPY apps/api/requirements.txt apps/api/requirements.txt
RUN pip install --no-cache-dir -r apps/api/requirements.txt
COPY apps/api apps/api
COPY --from=frontend /app/dist dist
CMD ["sh", "-c", "set -eu; : \"${RENDER_EXTERNAL_URL:?RENDER_EXTERNAL_URL is required}\"; export AXIOM_AUTH_CALLBACK_URL=\"${AXIOM_AUTH_CALLBACK_URL:-${RENDER_EXTERNAL_URL}/api/auth/callback}\" AXIOM_AUTH_POST_LOGIN_REDIRECT=\"${AXIOM_AUTH_POST_LOGIN_REDIRECT:-${RENDER_EXTERNAL_URL}/}\"; exec uvicorn apps.api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
