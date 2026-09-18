// Minimal CORS-adding proxy, locked to rahavard365.com's public market-data
// and per-asset endpoints. Two modes:
//
// 1) Condensed fund NAV (small payload, use this from the dashboard):
//      GET /fund-nav/{asset_id}
//      -> { asset_id, name, trade_symbol, date, redemption_price, bid_price, units }
//
// 2) Raw passthrough (debugging / anything else under these prefixes):
//      GET /api/v2/asset/{id}
//      GET /api/v2/market-data/...

const UPSTREAM = "https://rahavard365.com";
const ALLOWED_PREFIXES = ["/api/v2/market-data/", "/api/v2/asset/"];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
    "Cache-Control": "public, max-age=30",
  };
}

async function fetchUpstream(path) {
  const res = await fetch(UPSTREAM + path, {
    headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
  });
  return res;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders() });
    }

    const navMatch = url.pathname.match(/^\/fund-nav\/(\d+)$/);
    if (navMatch) {
      const id = navMatch[1];
      const res = await fetchUpstream(`/api/v2/asset/${id}`);
      if (!res.ok) {
        return new Response(JSON.stringify({ error: "upstream_error", status: res.status }), {
          status: res.status,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        });
      }
      const json = await res.json();
      const asset = json?.data?.asset || {};
      const fv = (json?.data?.fund_values || [])[0] || {};
      const body = {
        asset_id: asset.id ?? id,
        name: asset.name ?? null,
        trade_symbol: asset.trade_symbol ?? null,
        date: fv.date ?? null,
        redemption_price: fv.redemption_price ?? null,
        bid_price: fv.bid_price ?? null,
        units: fv.units ?? null,
      };
      return new Response(JSON.stringify(body), {
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    const allowed = ALLOWED_PREFIXES.some(p => url.pathname.startsWith(p));
    if (!allowed) {
      return new Response("Not allowed", { status: 403, headers: corsHeaders() });
    }

    const res = await fetchUpstream(url.pathname + url.search);
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "application/json",
        ...corsHeaders(),
      },
    });
  },
};
