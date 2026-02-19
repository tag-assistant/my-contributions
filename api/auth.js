export default async function handler(req) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://tag-assistant.github.io',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers });
  }

  const { code } = await req.json();
  if (!code) {
    return Response.json({ error: 'Missing code' }, { status: 400, headers });
  }

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = await res.json();

  if (data.error) {
    return Response.json({ error: data.error_description || data.error }, { status: 400, headers });
  }

  return Response.json({ access_token: data.access_token }, { headers });
}
