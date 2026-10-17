const MIN_CHUNK_LENGTH = 120;
const MAX_CHUNK_LENGTH = 1400;

function splitIntoSections(text) {
  const lines = String(text ?? '')
    .replace(/\r/g, '')
    .split('\n');
  const sections = [];
  let current = [];
  let currentHeading = '';
  let inCodeBlock = false;
  let inTable = false;

  const flush = () => {
    const content = current.join('\n').trim();
    if (content) sections.push({ heading: currentHeading, text: content });
    current = currentHeading ? [currentHeading] : [];
  };

  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+.+/);
    const codeFence = /^\s*```/.test(line);
    const tableRow = /^\s*\|.*\|\s*$/.test(line);

    if (heading && !inCodeBlock) {
      flush();
      currentHeading = line.trim();
      current = [currentHeading];
      inTable = false;
      continue;
    }

    if (codeFence) inCodeBlock = !inCodeBlock;
    if (tableRow && !inTable && current.length > (currentHeading ? 1 : 0)) flush();
    if (!tableRow && inTable && !inCodeBlock) flush();
    current.push(line);
    inTable = tableRow;
  }

  flush();
  return sections;
}

function splitOversizedSection(section) {
  if (section.text.length <= MAX_CHUNK_LENGTH) return [section];
  const paragraphs = section.text.split(/\n\s*\n/);
  const result = [];
  let text = '';

  for (const paragraph of paragraphs) {
    if (text && `${text}\n\n${paragraph}`.length > MAX_CHUNK_LENGTH) {
      result.push({ ...section, text });
      text = section.heading && !text.startsWith(section.heading) ? `${section.heading}\n\n` : '';
    }
    text = text ? `${text}\n\n${paragraph}` : paragraph;
  }
  if (text) result.push({ ...section, text });
  return result;
}

export function chunkText(text, metadata = {}) {
  const normalized = String(text ?? '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) {
    return [];
  }

  const chunks = [];
  const sections = splitIntoSections(normalized)
    .map((section) => ({
      ...section,
      entity:
        metadata.entities?.find(
          (entity) =>
            section.heading?.includes(`${entity.method} ${entity.path}`) ||
            section.text.startsWith(`${entity.method} ${entity.path}`)
        ) ??
        metadata.entity ??
        null,
    }))
    .flatMap(splitOversizedSection);

  for (const section of sections) {
    const words = section.text.split(/\s+/);
    const targetWords = 220;
    const overlapWords = 40;

    for (let start = 0; start < words.length; start += targetWords - overlapWords) {
      const chunkText = words
        .slice(start, start + targetWords)
        .join(' ')
        .trim();

      if (chunkText.length >= MIN_CHUNK_LENGTH || words.length <= targetWords) {
        chunks.push({
          chunk_text: chunkText,
          embedding: null,
          page_number: metadata.pageNumber ?? null,
          section: section.heading || null,
          entity: section.entity,
        });
      }
    }
  }

  return chunks;
}
