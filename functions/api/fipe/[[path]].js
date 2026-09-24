const UPSTREAM = 'https://fipe.api.br/api/v2';
const ALLOWED_TYPES = new Set(['cars', 'motorcycles', 'trucks']);

export async function onRequestGet(context) {
  try {
    const rawPath = context.params.path;
    const parts = Array.isArray(rawPath)
      ? rawPath
      : String(rawPath || '').split('/').filter(Boolean);

    if (!parts.length || !ALLOWED_TYPES.has(parts[0])) {
      return json({ error: 'Rota FIPE inválida.' }, 400);
    }

    // Evita transformar o proxy em um encaminhador aberto.
    const safe = parts.every(part => /^[A-Za-z0-9._-]+$/.test(String(part)));
    if (!safe) return json({ error: 'Parâmetro inválido.' }, 400);

    const sourceUrl = new URL(context.request.url);
    const upstream = new URL(`${UPSTREAM}/${parts.map(encodeURIComponent).join('/')}`);

    // Mantém apenas parâmetros explicitamente necessários para a FIPE.
    const reference = sourceUrl.searchParams.get('reference');
    if (reference && /^\d+$/.test(reference)) upstream.searchParams.set('reference', reference);

   const headers = { Accept: 'application/json' };
if (context.env.FIPE_TOKEN) {
  headers['Authorization'] = `Bearer ${context.env.FIPE_TOKEN}`;
}

    const response = await fetch(upstream.toString(), {
      headers,
      cf: { cacheTtl: 3600, cacheEverything: true },
    });

    const body = await response.text();
    const outHeaders = {
      'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    };

    if (response.status === 429) {
      return json({ error: 'Limite temporário da API FIPE atingido. Tente novamente mais tarde.' }, 429);
    }

    if (!response.ok) {
      return json({ error: 'A consulta FIPE não respondeu corretamente.' }, response.status);
    }

    return new Response(body, { status: 200, headers: outHeaders });
  } catch (error) {
    return json({ error: 'Erro interno ao consultar a FIPE.' }, 500);
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
