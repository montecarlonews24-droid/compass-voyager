export default async function handler(req, res) {
  const { path, ...query } = req.query;

  if (!path) {
    return res.status(400).json({
      error: 'Missing "path" parameter. Example: ?path=locations/v3/search&q=Istanbul'
    });
  }

  const allowedPaths = [
    'locations/v3/search',
    'properties/v2/list',
    'properties/v3/list',
    'properties/v2/get-content',
    'properties/v2/get-offers',
    'properties/v2/get-summary',
    'properties/v2/resolve-url',
    'properties/get-hotel-photos',
    'reviews'
  ];

  const isAllowed = allowedPaths.some(p => path.startsWith(p));
  if (!isAllowed) {
    return res.status(403).json({ error: 'This endpoint path is not allowed by the proxy.' });
  }

  const queryString = new URLSearchParams(query).toString();
  const url = `https://hotels4.p.rapidapi.com/${path}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'hotels4.p.rapidapi.com'
      }
    });
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Proxy request failed', details: err.message });
  }
}
