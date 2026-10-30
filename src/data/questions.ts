import data from '../../assets/data/questions.json';
import type { LicenseCode, TopicKey } from '@/lib/parse';

export interface AppQuestion {
  id: number;
  text: string;
  answers: string[];
  correct: number;
  topic: TopicKey;
  licenses: LicenseCode[];
  hasImage: boolean;
}

export const QUESTIONS = data.questions as AppQuestion[];

export const SOURCE = {
  text: data.source,
  url: data.sourceUrl,
  generated: data.generated,
};

export const TOPICS: { key: TopicKey; label: string; icon: string }[] = [
  { key: 'rules', label: 'חוקי התנועה', icon: '⚖️' },
  { key: 'signs', label: 'תמרורים', icon: '🛑' },
  { key: 'safety', label: 'בטיחות', icon: '🦺' },
  { key: 'vehicle', label: 'הכרת הרכב', icon: '🔧' },
];

export const LICENSES: { code: LicenseCode; label: string; detail: string }[] = [
  { code: 'B', label: 'רכב פרטי', detail: 'דרגה B' },
  { code: 'A', label: 'אופנוע', detail: 'דרגות A, A1, A2' },
  { code: 'C1', label: 'משאית קלה', detail: 'דרגה C1' },
  { code: 'C', label: 'משאית כבדה', detail: 'דרגה C' },
  { code: 'D', label: 'אוטובוס', detail: 'דרגה D' },
  { code: '1', label: 'טרקטור', detail: 'דרגה 1' },
];

export const topicLabel = (key: TopicKey) => TOPICS.find((t) => t.key === key)?.label ?? key;
export const licenseInfo = (code: LicenseCode) => LICENSES.find((l) => l.code === code) ?? LICENSES[0];
