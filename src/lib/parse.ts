// Converts records from the Ministry of Transport's official theory question bank
// (data.gov.il dataset "tqhe", CC BY) into the app's question format.
// Pure functions: also used by scripts/build-data.mjs under Node.

export type LicenseCode = 'B' | 'A' | 'C1' | 'C' | 'D' | '1';
export type TopicKey = 'rules' | 'safety' | 'signs' | 'vehicle';

export interface Question {
  id: number;
  text: string;
  answers: string[]; // always 4, in the bank's original order
  correct: number; // index into answers
  topic: TopicKey;
  licenses: LicenseCode[];
  image: string | null; // source URL in the bank; the app uses the bundled copy
  imageMissing: boolean; // the bank refers to a picture but its link is broken
}

export interface RawRecord {
  title2: string;
  description4: string;
  category: string;
}

export const TOPIC_BY_CATEGORY: Record<string, TopicKey> = {
  'חוקי התנועה': 'rules',
  'בטיחות': 'safety',
  'תמרורים': 'signs',
  'הכרת הרכב': 'vehicle',
};

const LICENSES: LicenseCode[] = ['B', 'A', 'C1', 'C', 'D', '1'];

const ENTITIES: Record<string, string> = { '&quot;': '"', '&#39;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };

export function cleanText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(quot|#39|amp|lt|gt|nbsp);/g, (m) => ENTITIES[m])
    .replace(/\s+/g, ' ')
    .trim();
}

// The bank tags the private-car license with a Cyrillic "В" (U+0412); normalise it.
export function normalizeLicense(tag: string): LicenseCode | null {
  const t = tag.trim().replace('В', 'B');
  return (LICENSES as string[]).includes(t) ? (t as LicenseCode) : null;
}

export function parseRecord(rec: RawRecord): Question {
  const title = cleanText(rec.title2);
  const m = title.match(/^(\d+)\.\s*(.*)$/);
  if (!m) throw new Error(`Unexpected question title: ${title.slice(0, 60)}`);
  const id = Number(m[1]);
  const html = rec.description4;

  const items = [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => x[1]);
  if (items.length !== 4) throw new Error(`Question ${id}: expected 4 answers, got ${items.length}`);
  const correct = items.findIndex((li) => /id="correctAnswer\d+"/.test(li));
  if (correct < 0) throw new Error(`Question ${id}: no correct answer marked`);

  const topic = TOPIC_BY_CATEGORY[rec.category.trim()];
  if (!topic) throw new Error(`Question ${id}: unknown topic "${rec.category}"`);

  const licenses = [...html.matchAll(/«([^»]+)»/g)]
    .map((x) => normalizeLicense(x[1]))
    .filter((l): l is LicenseCode => l !== null);

  // A few records carry placeholder sources (e.g. "x") instead of a picture URL.
  const src = html.match(/<img[^>]*\bsrc="([^"]*)"/i)?.[1] ?? null;
  const image = src && /^https?:\/\//.test(src) ? src : null;
  return {
    id,
    text: m[2],
    answers: items.map(cleanText),
    correct,
    topic,
    licenses: [...new Set(licenses)],
    image,
    imageMissing: src !== null && image === null,
  };
}
