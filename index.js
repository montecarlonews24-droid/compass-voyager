/**
 * Firebase Cloud Functions (Gen 2) — نفس منطق hotels.js و flights.js
 * يلي كانوا شغالين على Vercel، بس بصيغة Firebase Functions.
 *
 * قبل النشر:
 *   1) فعّل خطة Blaze بمشروع Firebase (لازمة لأي طلب شبكي خارجي)
 *   2) اضبط الـ secret:
 *        firebase functions:secrets:set RAPIDAPI_KEY
 *      (رح يطلب منك تلصق قيمة المفتاح، وبيخزّنه بأمان بدون ما يظهر بالكود)
 *   3) انشر:
 *        firebase deploy --only functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");

const RAPIDAPI_KEY = defineSecret("RAPIDAPI_KEY");

function setCors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// ---------- Hotels proxy (Hotels4 via RapidAPI) ----------
exports.hotels = onRequest({ secrets: [RAPIDAPI_KEY], region: "us-central1" }, async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { path, ...query } = req.query;

  if (!path) {
    return res.status(400).json({
      error: 'Missing "path" parameter. Example: ?path=locations/v3/search',
    });
  }

  const allowedPaths = [
    "locations/v3/search",
    "properties/v2/list",
    "properties/v3/list",
    "properties/v2/get-content",
    "properties/v2/get-offers",
    "properties/v2/get-summary",
    "properties/v2/resolve-url",
    "properties/get-hotel-photos",
    "reviews",
  ];

  const isAllowed = allowedPaths.some((p) => path.startsWith(p));
  if (!isAllowed) {
    return res.status(403).json({ error: "This endpoint path is not allowed", path });
  }

  const queryString = new URLSearchParams(query).toString();
  const url = `https://hotels4.p.rapidapi.com/${path}${queryString ? "?" + queryString : ""}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY.value(),
        "x-rapidapi-host": "hotels4.p.rapidapi.com",
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy request failed", details: err.message });
  }
});

// ---------- Flights proxy (Sky Scrapper via RapidAPI) ----------
exports.flights = onRequest({ secrets: [RAPIDAPI_KEY], region: "us-central1" }, async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const RAPIDAPI_HOST = "sky-scrapper.p.rapidapi.com";
  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Missing "path" query parameter' });
  }

  const allowedPaths = [
    "api/v1/flights/searchAirport",
    "api/v1/flights/getNearByAirports",
    "api/v1/flights/searchFlights",
    "api/v1/flights/getPriceCalendar",
    "api/v1/flights/getFlightDetails",
  ];

  if (!allowedPaths.includes(path)) {
    return res.status(403).json({ error: "This path is not allowed", path });
  }

  const qs = new URLSearchParams(queryParams).toString();
  const url = `https://${RAPIDAPI_HOST}/${path}${qs ? "?" + qs : ""}`;

  try {
    const apiResponse = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY.value(),
        "X-RapidAPI-Host": RAPIDAPI_HOST,
      },
    });
    const data = await apiResponse.json();
    res.status(apiResponse.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy request failed", details: err.message });
  }
});
