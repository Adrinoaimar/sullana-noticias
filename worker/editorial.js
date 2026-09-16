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
    .replace(/\s+(?:see less|ver menos)\.?$/i, '')
    .replace(/\s+(?:…|\.\.\.)\s*$/, '')
    .trim();
}

function sentences(value) {
  const protectedDots = cleanSourceText(value).replace(/(?<=\d)\.(?=\d)/g, '__DECIMAL_DOT__');
  return protectedDots
    .match(/[^.!?]+(?:[.!?]+|$)/g)?.map((part) => part.replaceAll('__DECIMAL_DOT__', '.').trim()).filter(Boolean) || [];
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
  const parts = Array.from(new Map(
    sentences(rawText)
      .map(normalizeSentence)
      .filter(Boolean)
      .map((part) => [part.toLocaleLowerCase('es-PE'), part]),
  ).values());
  if (!parts.length) return { summary: '', body: '', metaDescription: '' };
  const source = String(sourceName || 'la fuente original').trim();
  const summary = `De acuerdo con ${source}, ${lowerFirst(parts[0])}.`;
  const sourceParagraphs = [];
  for (let index = 0; index < parts.length; index += 3) {
    const chunk = parts.slice(index, index + 3).map(lowerFirst).join('. ');
    const lead = index === 0
      ? `La publicación pública de ${source} contiene`
      : 'La misma publicación también incluye';
    sourceParagraphs.push(`${lead}: ${chunk}.`);
  }
  const scopeParagraph = `El alcance de esta nota se mantiene en la información visible de la publicación consultada. No se agregan cifras, responsables, causas ni consecuencias que no estén expresamente incluidos en esa referencia pública.`;
  const followUpParagraph = `Sullana Noticias conserva el enlace a la fuente original para facilitar la consulta del contexto. Si la fuente publica una actualización verificable, el contenido podrá revisarse con esa nueva referencia.`;
  const body = [...sourceParagraphs, scopeParagraph, followUpParagraph].join('\n\n');
  return {
    summary,
    body,
    metaDescription: `Noticias de Sullana y Piura. ${summary}`.replace(/\s+/g, ' ').slice(0, 155),
  };
}
