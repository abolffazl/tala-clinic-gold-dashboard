# CORS proxy for rahavard365.com

rahavard365.com has a public, unauthenticated API with official per-fund
redemption NAV data, but sends no `Access-Control-Allow-Origin` header, so
browsers block the dashboard from calling it directly. This tiny Cloudflare
Worker sits in front of it and adds CORS headers, restricted to the two
prefixes the dashboard actually needs.

Live at: https://tala-clinic-cors-proxy.abolfazldanesh.workers.dev

## Redeploying after an edit

```bash
cd cors-proxy
npx wrangler login   # one-time, opens a browser to authorize Cloudflare
npx wrangler deploy
```

## Endpoints

- `GET /fund-nav/{rahavard_asset_id}` — condensed: `{ asset_id, name, trade_symbol, date, redemption_price, bid_price, units }`
- `GET /api/v2/asset/{id}` and `/api/v2/market-data/...` — raw passthrough

Asset IDs currently used by the dashboard (rahavard365.com's internal IDs,
found via their site's network requests):

| Fund | trade_symbol | rahavard asset_id |
|---|---|---|
| عیار | عیار | 4475 |
| گنج | گنج | 1595 |
| مثقال | مثقال | 18235 |
| طلای لوتوس | طلا | 2672 |
| آلتون | آلتون | 22820 |
| آتش | آتش | 35953 |
| کهربا | کهربا | 17480 |
