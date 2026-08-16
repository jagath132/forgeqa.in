import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

/**
 * Converts Markdown PRD text into a structured .docx buffer.
 */
export async function convertMarkdownToDocx(markdownText, title = 'Product Requirements Document') {
  const lines = (markdownText || '').split('\n');
  const children = [];

  // Document Title Header
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 240 },
    })
  );

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      children.push(new Paragraph({ spacing: { after: 120 } }));
      continue;
    }

    // Heading 1
    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^#\s+/, ''),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 240, after: 120 },
        })
      );
      continue;
    }

    // Heading 2
    if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^##\s+/, ''),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
      continue;
    }

    // Heading 3
    if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^###\s+/, ''),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 160, after: 80 },
        })
      );
      continue;
    }

    // Heading 4
    if (line.startsWith('#### ')) {
      children.push(
        new Paragraph({
          text: line.replace(/^####\s+/, ''),
          heading: HeadingLevel.HEADING_4,
          spacing: { before: 120, after: 60 },
        })
      );
      continue;
    }

    // Bullet List Item
    if (/^[-*+]\s+/.test(line)) {
      const content = line.replace(/^[-*+]\s+/, '');
      const runs = parseInlineFormatting(content);
      children.push(
        new Paragraph({
          children: runs,
          bullet: { level: 0 },
          spacing: { after: 60 },
        })
      );
      continue;
    }

    // Numbered List Item
    if (/^\d+\.\s+/.test(line)) {
      const content = line.replace(/^\d+\.\s+/, '');
      const runs = parseInlineFormatting(content);
      children.push(
        new Paragraph({
          children: runs,
          spacing: { after: 60 },
        })
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const content = line.replace(/^>\s+/, '');
      const runs = parseInlineFormatting(content);
      children.push(
        new Paragraph({
          children: runs,
          spacing: { before: 80, after: 80 },
          indent: { left: 720 },
        })
      );
      continue;
    }

    // Standard Paragraph
    const runs = parseInlineFormatting(line);
    children.push(
      new Paragraph({
        children: runs,
        spacing: { after: 120 },
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

/**
 * Parses markdown inline bold (**text** or __text__) and code (`text`) into TextRun objects.
 */
function parseInlineFormatting(text) {
  const runs = [];
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.substring(lastIndex, match.index) }));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      runs.push(new TextRun({ text: token.slice(2, -2), bold: true }));
    } else if (token.startsWith('`') && token.endsWith('`')) {
      runs.push(new TextRun({ text: token.slice(1, -1), font: 'Consolas' }));
    } else {
      runs.push(new TextRun({ text: token }));
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.substring(lastIndex) }));
  }

  return runs.length ? runs : [new TextRun({ text })];
}
