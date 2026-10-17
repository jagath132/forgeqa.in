import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { createWorker } from 'tesseract.js';

const TEXT_EXTENSIONS = new Set(['.txt', '.md', '.markdown', '.csv']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff']);

export function getFileType(fileName = '', mimeType = '') {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === '.pdf' || mimeType.includes('pdf')) return 'pdf';
  if (extension === '.docx') return 'docx';
  if (extension === '.xlsx' || extension === '.xls') return 'excel';
  if (extension === '.json' || mimeType.includes('json')) return 'json';
  if (extension === '.csv') return 'csv';
  if (extension === '.md' || extension === '.markdown' || mimeType.includes('markdown'))
    return 'markdown';
  if (TEXT_EXTENSIONS.has(extension) || mimeType.startsWith('text/')) return 'text';
  if (IMAGE_EXTENSIONS.has(extension) || mimeType.startsWith('image/')) return 'image';

  return 'unknown';
}

export async function extractTextFromFile(file) {
  const buffer = await fs.readFile(file.path);
  const fileType = getFileType(file.originalname, file.mimetype);
  const result = await extractTextFromBuffer(buffer, {
    fileName: file.originalname,
    fileType,
    mimeType: file.mimetype,
  });

  return {
    ...result,
    fileType: result.fileType ?? fileType,
  };
}

export async function extractTextFromBuffer(buffer, metadata) {
  switch (metadata.fileType) {
    case 'pdf':
      return parsePdf(buffer);
    case 'docx':
      return parseDocx(buffer);
    case 'excel':
      return parseExcel(buffer);
    case 'csv':
    case 'text':
    case 'markdown':
      return parseText(buffer);
    case 'json':
      return parseJson(buffer);
    case 'image':
      return parseImage(buffer);
    default:
      throw new Error(`Unsupported file type for ${metadata.fileName}`);
  }
}

function parseJson(buffer) {
  const raw = buffer.toString('utf8');
  let document;
  try {
    document = JSON.parse(raw);
  } catch {
    return { text: redactSensitiveText(raw), pageCount: null, entities: [] };
  }

  const openApi = parseOpenApi(document);
  if (openApi) return { ...openApi, fileType: 'openapi' };
  const postman = parsePostmanCollection(document);
  if (postman) return { ...postman, fileType: 'postman' };
  return {
    text: JSON.stringify(redactSensitiveData(document), null, 2),
    pageCount: null,
    entities: [],
  };
}

const SENSITIVE_FIELD =
  /authorization|access[-_]?token|refresh[-_]?token|api[-_]?key|client[-_]?secret|password|credential/i;

function redactSensitiveText(value) {
  return String(value ?? '')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(
      /(["']?(?:authorization|access[-_]?token|refresh[-_]?token|api[-_]?key|client[-_]?secret|password|credential)["']?\s*:\s*["'])[^"']*(["'])/gi,
      '$1[REDACTED]$2'
    )
    .replace(
      /((?:authorization|access[-_]?token|refresh[-_]?token|api[-_]?key|client[-_]?secret|password|credential)\s*=\s*)[^&#\s]+/gi,
      '$1[REDACTED]'
    );
}

function redactSensitiveData(value, fieldName = '') {
  if (SENSITIVE_FIELD.test(fieldName)) return '[REDACTED]';
  if (typeof value === 'string') return redactSensitiveText(value);
  if (Array.isArray(value)) return value.map((item) => redactSensitiveData(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, redactSensitiveData(item, key)])
    );
  }
  return value;
}

function parseOpenApi(document) {
  if (!document || typeof document !== 'object' || !document.paths) return null;
  const entities = [];
  for (const [route, pathItem] of Object.entries(document.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue;
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!['get', 'post', 'put', 'patch', 'delete', 'options', 'head'].includes(method)) {
        continue;
      }
      const parameters = [
        ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
        ...(Array.isArray(operation?.parameters) ? operation.parameters : []),
      ].map((parameter) => ({
        name: parameter.name,
        in: parameter.in,
        required: Boolean(parameter.required),
        type:
          parameter.schema?.type ??
          parameter.type ??
          parameter.schema?.$ref ??
          parameter.schema?.format ??
          'unspecified',
      }));
      const requestBody = redactSensitiveData(
        operation?.requestBody?.content ??
          (operation?.consumes?.length
            ? {
                [operation.consumes[0]]: {
                  schema: operation.parameters?.find((p) => p.in === 'body')?.schema,
                },
              }
            : {})
      );
      const responses = Object.entries(operation?.responses ?? {}).map(([status, response]) => ({
        status,
        description: response?.description ?? '',
      }));
      entities.push({
        type: 'api_endpoint',
        method: method.toUpperCase(),
        path: route,
        operationId: operation?.operationId ?? null,
        summary: operation?.summary ?? operation?.description ?? '',
        parameters,
        requestBody,
        responses,
      });
    }
  }
  if (!entities.length) return null;
  const title = document.info?.title ?? 'OpenAPI';
  const text = entities
    .map((entity) =>
      [
        `## ${entity.method} ${entity.path}`,
        entity.summary,
        `Operation: ${entity.operationId ?? 'unnamed'}`,
        `Parameters: ${JSON.stringify(entity.parameters)}`,
        `Request payload: ${JSON.stringify(entity.requestBody)}`,
        `Responses: ${JSON.stringify(entity.responses)}`,
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n\n');
  return { text: `# ${title}\n\n${text}`, pageCount: entities.length, entities };
}

function parsePostmanCollection(document) {
  if (!document || typeof document !== 'object' || !Array.isArray(document.item)) return null;
  const entities = [];
  const visit = (items, folder = '') => {
    for (const item of items) {
      if (Array.isArray(item.item)) {
        visit(item.item, [folder, item.name].filter(Boolean).join(' / '));
        continue;
      }
      const request = item.request;
      if (!request) continue;
      const url = redactSensitiveText(
        typeof request.url === 'string' ? request.url : (request.url?.raw ?? '')
      );
      const parameters = [
        ...(Array.isArray(request.url?.query) ? request.url.query : []),
        ...(Array.isArray(request.url?.variable) ? request.url.variable : []),
      ].map(({ key, value, description, disabled }) => ({
        name: key,
        value: SENSITIVE_FIELD.test(key) ? '[REDACTED]' : redactSensitiveText(value),
        description: redactSensitiveText(description),
        disabled,
      }));
      const responses = (item.response ?? []).map((response) => ({
        status: response.code ?? response.status ?? null,
        name: response.name ?? '',
      }));
      entities.push({
        type: 'api_endpoint',
        method: String(request.method ?? 'GET').toUpperCase(),
        path: url,
        operationId: item.name ?? null,
        summary: redactSensitiveText(
          [folder, item.name, request.description].filter(Boolean).join(' — ')
        ),
        parameters,
        requestBody: redactSensitiveData(request.body ?? null),
        responses,
      });
    }
  };
  visit(document.item);
  if (!entities.length) return null;
  const text = entities
    .map((entity) =>
      [
        `## ${entity.method} ${entity.path}`,
        entity.summary,
        `Parameters: ${JSON.stringify(entity.parameters)}`,
        `Request payload: ${JSON.stringify(entity.requestBody)}`,
        `Responses: ${JSON.stringify(entity.responses)}`,
      ].join('\n')
    )
    .join('\n\n');
  return { text, pageCount: entities.length, entities };
}

async function parsePdf(buffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const parsed = await pdfParse(buffer);

  return {
    text: parsed.text,
    pageCount: parsed.numpages,
  };
}

async function parseDocx(buffer) {
  const parsed = await mammoth.extractRawText({ buffer });

  return {
    text: parsed.value,
    pageCount: null,
  };
}

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetTexts = workbook.SheetNames.map((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      blankrows: false,
    });

    return [
      `Sheet: ${sheetName}`,
      ...rows.map((row) => row.map((cell) => String(cell ?? '')).join(' | ')),
    ].join('\n');
  });

  return {
    text: sheetTexts.join('\n\n'),
    pageCount: workbook.SheetNames.length,
  };
}

function parseText(buffer) {
  return {
    text: buffer.toString('utf8'),
    pageCount: null,
  };
}

async function parseImage(buffer) {
  const worker = await createWorker('eng');

  try {
    const result = await worker.recognize(buffer);

    return {
      text: result.data.text,
      pageCount: 1,
    };
  } finally {
    await worker.terminate();
  }
}
