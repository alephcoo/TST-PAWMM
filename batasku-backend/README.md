# BatasKu Backend

Microservice BatasKu (PocketBase + Nginx gateway + Cloudflare Tunnel).

## Menjalankan
1. `cp .env.example .env`, isi `TUNNEL_TOKEN`.
2. `docker compose up -d --build`
3. Cek: `curl http://localhost:6080/api/batasku/ping`

## Endpoint kustom
- `GET /api/batasku/ping`
- `GET /api/batasku/batas?usia=25&hamil=false&kondisi=diabetes`
