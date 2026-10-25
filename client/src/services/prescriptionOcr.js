import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import tesseractWorkerUrl from 'tesseract.js/dist/worker.min.js?url';
import tesseractCoreUrl from 'tesseract.js-core/tesseract-core-lstm.wasm.js?url';
import englishDataUrl from '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz?url';

let englishDataPromise;

const getEnglishData = async () => {
  if (!englishDataPromise) {
    englishDataPromise = fetch(englishDataUrl).then(async response => {
      if (!response.ok) throw new Error('Could not load the built-in English OCR data. Refresh the page and try again.');
      return new Uint8Array(await response.arrayBuffer());
    }).catch(error => {
      englishDataPromise = undefined;
      throw error;
    });
  }
  return englishDataPromise;
};

const createPrescriptionOcrWorker = async logger => {
  const { createWorker } = await import('tesseract.js');
  const data = await getEnglishData();
  return createWorker([{ code: 'eng', data }], 1, {
    workerPath: tesseractWorkerUrl,
    corePath: tesseractCoreUrl,
    logger,
  });
};

const dosagePattern = /\b\d+(?:[.,]\d+)?\s*(?:mcg|μg|mg|g|ml|mL|iu|units?)\b/i;
const medicineFormPattern = /\b(?:tablet|tablets|tab\.?|capsule|capsules|cap\.?|syrup|suspension|injection|inj\.?|drops?|puff|puffs|cream|ointment)\b/i;
const instructionStartPattern = /^(?:take|use|apply|inst(?:ructions?)?|sig|dose|route|frequency|morning|evening|night|after|before|with)\b/i;
const headerPattern = /^(?:prescription|medications?|patient|doctor|date|name|age|diagnosis|refill|pharmacy|rx)\b/i;

const todayString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const addDays = (dateString, days) => {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const normalizeText = value => value
  .replace(/[•●▪]/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/^[\s\d.)#:-]+/, '')
  .trim();

const frequencyFrom = text => {
  if (/\b(?:q\.?i\.?d\.?|four times (?:a|per) day|4 times (?:a|per) day|1\s*[-/]\s*1\s*[-/]\s*1\s*[-/]\s*1)\b/i.test(text)) return 'four_times_daily';
  if (/\b(?:t\.?i\.?d\.?|three times (?:a|per) day|3 times (?:a|per) day|1\s*[-/]\s*1\s*[-/]\s*1)\b/i.test(text)) return 'thrice_daily';
  if (/\b(?:b\.?i\.?d\.?|twice (?:a|per) day|two times (?:a|per) day|2 times (?:a|per) day|1\s*[-/]\s*0\s*[-/]\s*1)\b/i.test(text)) return 'twice_daily';
  return 'once_daily';
};

const timesFor = frequency => ({
  once_daily: ['08:00'],
  twice_daily: ['08:00', '20:00'],
  thrice_daily: ['08:00', '14:00', '20:00'],
  four_times_daily: ['08:00', '12:00', '16:00', '20:00'],
}[frequency]);

const extractClockTimes = text => {
  const matches = [...text.matchAll(/\b(0?[1-9]|1[0-2])(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b/gi)];
  const times = matches.map(match => {
    let hours = Number(match[1]) % 12;
    if (/p/i.test(match[3])) hours += 12;
    return `${String(hours).padStart(2, '0')}:${match[2] || '00'}`;
  });
  return [...new Set(times)].sort();
};

const parseDurationEnd = (text, startDate) => {
  const match = text.match(/\bfor\s+(\d{1,3})\s+days?\b/i);
  if (!match) return '';
  const days = Number(match[1]);
  return days > 0 && days <= 365 ? addDays(startDate, days - 1) : '';
};

export const parsePrescriptionMedicines = (rawText) => {
  const lines = rawText.split(/\r?\n/).map(normalizeText).filter(Boolean);
  const candidates = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (instructionStartPattern.test(line)) continue;

    let candidateLine = line;
    let cueLineIndex = index;
    const hasCue = dosagePattern.test(line) || medicineFormPattern.test(line);
    const nextLine = lines[index + 1];
    if (!hasCue && nextLine && !headerPattern.test(line) && !instructionStartPattern.test(line) && line.length <= 60 && /[a-z]{3,}/i.test(line) && (dosagePattern.test(nextLine) || medicineFormPattern.test(nextLine))) {
      candidateLine = `${line} ${nextLine}`;
      cueLineIndex = index + 1;
    }
    if (!dosagePattern.test(candidateLine) && !medicineFormPattern.test(candidateLine)) continue;
    if (!/[a-z]{3,}/i.test(candidateLine)) continue;

    const section = [candidateLine];
    for (let next = cueLineIndex + 1; next < lines.length && next <= cueLineIndex + 2; next += 1) {
      if (dosagePattern.test(lines[next]) || (!instructionStartPattern.test(lines[next]) && medicineFormPattern.test(lines[next]))) break;
      section.push(lines[next]);
    }
    const sectionText = section.join(' ');
    const doseMatch = candidateLine.match(dosagePattern) || candidateLine.match(/\b\d+\s*(?:tablets?|tabs?|capsules?|caps?)\b/i);
    let name = doseMatch ? candidateLine.slice(0, doseMatch.index) : candidateLine;
    if (!name.trim() && doseMatch) name = candidateLine.slice(doseMatch.index + doseMatch[0].length);
    name = name
      .replace(/^\s*(?:rx|℞)\s*/i, '')
      .replace(/^\s*(?:tab(?:let)?|cap(?:sule)?|syp|syrup|inj(?:ection)?)\.?\s*/i, '')
      .replace(/^\s*\d+(?:\s*[x×])?\s*(?:tabs?|tablets?|caps?|capsules?)?\s*/i, '')
      .replace(/\s+\d+(?:\s*[x×])?\s*(?:tabs?|tablets?|caps?|capsules?)\s*$/i, '')
      .replace(/\b(?:take|use|apply|oral|orally|daily|once|twice|three|four|before|after|with)\b.*$/i, '')
      .replace(/[|:;,.-]+$/, '')
      .trim();

    if (!name || instructionStartPattern.test(name) || name.length > 80) continue;
    const normalizedName = name.replace(/\s+/g, ' ');
    if (candidates.some(item => item.name.toLowerCase() === normalizedName.toLowerCase())) continue;

    const frequency = frequencyFrom(sectionText);
    const extractedTimes = extractClockTimes(sectionText);
    const expectedTimes = timesFor(frequency);
    const reminderTimes = extractedTimes.length === expectedTimes.length ? extractedTimes : expectedTimes;
    const startDate = todayString();
    candidates.push({
      name: normalizedName,
      dosage: doseMatch?.[0]?.replace(/\s+/g, ' ').trim() || '',
      frequency,
      startDate,
      endDate: parseDurationEnd(sectionText, startDate),
      reminderTimes,
      foodInstruction: /\bbefore food\b/i.test(sectionText) ? 'before_food'
        : /\bwith food\b/i.test(sectionText) ? 'with_food'
          : /\bafter food\b/i.test(sectionText) ? 'after_food' : 'no_restriction',
      notes: sectionText === candidateLine ? '' : sectionText.slice(candidateLine.length).trim(),
      selected: true,
    });
    index = cueLineIndex;
  }

  return candidates;
};

export const readPrescription = async (file, onProgress = () => {}) => {
  const fileName = file.name?.toLowerCase() || '';
  const isImage = file.type.startsWith('image/') || /\.(?:jpe?g|png)$/.test(fileName);
  const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');

  if (isImage) {
    const worker = await createPrescriptionOcrWorker(message => onProgress({ step: message.status, progress: message.progress || 0 }));
    try {
      const { data } = await worker.recognize(file);
      return { text: data.text || '', candidates: parsePrescriptionMedicines(data.text || '') };
    } finally {
      await worker.terminate();
    }
  }

  if (!isPdf) throw new Error('Please choose a PDF, JPG, or PNG prescription.');

  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  let worker;
  const pageTexts = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      onProgress({ step: `Reading page ${pageNumber} of ${document.numPages}`, progress: (pageNumber - 1) / document.numPages });
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let pageText = content.items.map(item => `${item.str}${item.hasEOL ? '\n' : ' '}`).join('').trim();

      if (pageText.length < 24) {
        if (!worker) {
          worker = await createPrescriptionOcrWorker(message => onProgress({ step: `Scanning page ${pageNumber} of ${document.numPages}`, progress: ((pageNumber - 1) + (message.progress || 0)) / document.numPages }));
        }
        const viewport = page.getViewport({ scale: 1.8 });
        const canvas = window.document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        const { data } = await worker.recognize(canvas);
        pageText = data.text || '';
        canvas.width = 0;
        canvas.height = 0;
      }
      pageTexts.push(pageText);
      page.cleanup();
    }
  } finally {
    if (worker) await worker.terminate();
    await document.destroy();
  }

  const text = pageTexts.join('\n');
  return { text, candidates: parsePrescriptionMedicines(text) };
};
