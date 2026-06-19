export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const apiMatch = url.pathname.match(/^\/api\/word\/([^/]+)\/?$/);
    if (apiMatch) {
      const word = decodeURIComponent(apiMatch[1]).replace(/_/g, ' ');
      return handleApiWord(word, env);
    }

    const pageMatch = url.pathname.match(/^\/word\/([^/]+)\/?$/);

    // Home page - inject SEO content
    if (url.pathname === '/' || url.pathname === '') {
      const assetResponse = await env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
      return injectHomeSEO(assetResponse);
    }

    const assetResponse = await env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
    if (!pageMatch) return env.ASSETS.fetch(request);;

    const word = decodeURIComponent(pageMatch[1]).replace(/_/g, ' ');
    const data = await lookupWord(word, env);
    return data ? injectSEO(assetResponse, data) : env.ASSETS.fetch(request);;
  }
};

async function handleApiWord(word, env) {
  const row = await env.DB.prepare(
    `SELECT html_meaning, suggestions, abbr FROM dictionary WHERE word = ?`
  ).bind(word).first();

  if (!row) {
    return new Response(JSON.stringify({
      title: "भेटिएन",
      message: `'${word}' फेला पार्न सकिएन - यसलाई भन्छ ४०४ हुनु।`,
      resolution: "अरु नै केही हानेर हेरौँ, चल्छ होला।"
    }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }

  let meanings = [];
  try {
    meanings = row.html_meaning ? JSON.parse(row.html_meaning) : [];
  } catch {
    meanings = []; 
  }
  let similar = row.suggestions ? row.suggestions.split(', ') : [];

  if (word.endsWith('.')) {
    const searchPattern = `%,${word},%`;

    try {
      const { results } = await env.DB.prepare(
        `SELECT word FROM dictionary WHERE abbr LIKE ? ORDER BY RANDOM() LIMIT 50`
      ).bind(searchPattern).all();

      if (results && results.length > 0) {
        similar = results.map(r => r.word);
      } else {
        similar = [];
      }
    } catch (e) {
      similar = [];
    }

    if (row.abbr) {
      word = `${row.abbr} (${word})`;
    }
  }

  return new Response(JSON.stringify([{ word, meanings, similar }]), {
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}


async function lookupWord(slug, env) {
  const row = await env.DB.prepare(
    `SELECT word, variants, plain_meaning, suggestions FROM dictionary WHERE word = ?`
  ).bind(slug).first();

  return row ? {
    word: row.word,
    variants: row.variants,
    plainMeaning: row.plain_meaning,
    suggestions: row.suggestions,
  } : null;
}


function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function injectSEO(response, { word, variants, plainMeaning, suggestions }) {
  const variantList = variants ? variants.split(',').map(v => v.trim()).filter(Boolean) : [];
  const similarList = suggestions ? suggestions.split(', ').filter(Boolean) : [];

  let description = plainMeaning.slice(0, 160);
  if (plainMeaning.length > 160) description = description.slice(0, description.lastIndexOf(' ')) + '…';

  const plainTitle = `${word} - Nepali Dictionary`;
  const title = variantList.length
    ? `${word} (${variantList.join(', ')}) - Nepali Dictionary`
    : `${plainTitle}`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'DefinedTerm',
    name: word, alternateName: variantList, description: plainMeaning
  }).replace(/<\//g, '<\\/');

  const metaTags = `
    <meta name="description" content="${escapeHtml(description)}">
    <meta property="og:title" content="${escapeHtml(plainTitle)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${escapeHtml(plainTitle)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <script type="application/ld+json">${jsonLd}</script>`;

  const relatedLinks = similarList.length
    ? `<p>Related: ${similarList.map(w => `<a href="/word/${encodeURIComponent(w)}">${escapeHtml(w)}</a>`).join(', ')}</p>`
    : '';

  const crawlerContent = `
    <h1>Meaning of ${escapeHtml(word)}</h1>
    <p>Also known as: ${escapeHtml(variantList.join(' / '))}</p>
    <div>${escapeHtml(plainMeaning)}</div>
    ${relatedLinks}`;

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(title); } })
    .on('head', { element(el) { el.append(metaTags, { html: true }); } })
    .on('main#root', { element(el) { el.setInnerContent(crawlerContent, { html: true }); } })
    .transform(response);
}

function injectHomeSEO(response) {
  const metaTags = `
    <meta name="description" content="नेपाली र रोमन शब्दहरूको अर्थ, उदाहरण र व्याकरण खोज्नुहोस्। Nepali dictionary with support for Nepali romanized search.">
    <meta property="og:title" content="नेपाली शब्दकोश - Nepali Dictionary">
    <meta property="og:description" content="नेपाली शब्दहरूको अर्थ र उदाहरणहरु खोज्नुहोस्।">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="नेपाली शब्दकोश - Nepali Dictionary">
    <meta name="twitter:description" content="नेपाली शब्दहरूको अर्थ र उदाहरणहरु खोज्नुहोस्।">`;

  const homeContent = `
    <h1>नेपाली शब्दकोश - Nepali Dictionary</h1>
    <p>नेपाली शब्दहरूको अर्थ, उदाहरण र व्याकरण खोज्नुहोस्। देवनागरी वा रोमन दुवैमा सजिलै खोज्न सकिन्छ।</p>
    <p>Search for meanings and usage examples of Nepali words. Supports roman search.</p>`;

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent('नेपाली शब्दकोश - Nepali Dictionary'); } })
    .on('head', { element(el) { el.append(metaTags, { html: true }); } })
    .on('main#root', { element(el) { el.setInnerContent(homeContent, { html: true }); } })
    .transform(response);
}
