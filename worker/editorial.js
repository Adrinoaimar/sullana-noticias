const UI_TAIL = /\s+(?:like|me gusta)\s+(?:comment|comentar)\s+(?:share|compartir)\b[\s\S]*$/i;
const REWRITES = [
  [/señaló/gi, 'indicó'],
  [/\bseñala\b/gi, 'indica'],
  [/informó/gi, 'comunicó'],
  [/\binforma\b/gi, 'comunica'],
  [/confirmó/gi, 'ratificó'],
  [/\bconfirma\b/gi, 'ratifica'],
  [/mostró/gi, 'presentó'],
  [/\bmuestra\b/gi, 'presenta'],
  [/realizó/gi, 'llevó a cabo'],
  [/inició/gi, 'comenzó'],
  [/finalizó/gi, 'terminó'],
  [/\bdebido a\b/gi, 'a raíz de'],
];

export function cleanSourceText(value) {
  return String(value || '')
    .replace(/\r/g, '')
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
    .replace(UI_TAIL, '')
    .replace(/\s+(?:…|\.\.\.)\s*$/, '')
    .trim();
}

function sentences(value) {
  return cleanSourceText(value)
    .match(/[^.!?]+(?:[.!?]+|$)/g)?.map((part) => part.trim()).filter(Boolean) || [];
}

function normalizeSentence(value) {
  let result = String(value || '').replace(/^[-•]\s*/, '').trim();
  const letters = (result.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).join('');
  if (letters.length >= 10 && letters === letters.toUpperCase()) result = result.toLocaleLowerCase('es-PE');
  for (const [pattern, replacement] of REWRITES) result = result.replace(pattern, replacement);
  result = result.replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim();
  return result ? `${result.charAt(0).toLocaleUpperCase('es-PE')}${result.slice(1)}` : '';
}

function lowerFirst(value) {
  return value ? `${value.charAt(0).toLocaleLowerCase('es-PE')}${value.slice(1)}` : '';
}

export function buildEditorialCopy(rawText, sourceName = '') {
  const parts = sentences(rawText).map(normalizeSentence).filter(Boolean);
  if (!parts.length) return { summary: '', body: '', metaDescription: '' };
  const source = String(sourceName || 'la fuente original').trim();
  const summary = `De acuerdo con ${source}, ${lowerFirst(parts[0])}.`;
  const body = parts.map((part, index) => {
    const lead = index === 0
      ? `La publicación pública de ${source} da cuenta de que`
      : 'El mismo reporte agrega que';
    return `${lead} ${lowerFirst(part)}.`;
  }).join('\n\n');
  return {
    summary,
    body,
    metaDescription: summary.replace(/\s+/g, ' ').slice(0, 155),
  };
}
