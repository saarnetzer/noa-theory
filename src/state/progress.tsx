// App-wide progress (chosen license, per-question stats, exam history), saved on the device.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { LicenseCode } from '@/lib/parse';
import { EMPTY_PROGRESS, recordAnswer, type ExamRecord, type Progress } from '@/lib/quiz';

const STORAGE_KEY = 'netiv.progress.v1';
const MAX_EXAMS = 50;

interface ProgressApi {
  progress: Progress;
  loaded: boolean;
  answer: (questionId: number, correct: boolean) => void;
  answerMany: (results: { id: number; correct: boolean }[]) => void;
  addExam: (exam: ExamRecord) => void;
  setLicense: (license: LicenseCode) => void;
  reset: () => void;
}

const ProgressContext = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(EMPTY_PROGRESS);
  const [loaded, setLoaded] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setProgress({ ...EMPTY_PROGRESS, ...JSON.parse(raw) });
      })
      .catch(() => {
        // Unreadable storage: start fresh rather than block the app.
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (skipSave.current) {
      skipSave.current = false; // don't immediately write back what was just loaded
      return;
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(() => {});
  }, [progress, loaded]);

  const answer = useCallback((id: number, correct: boolean) => setProgress((p) => recordAnswer(p, id, correct)), []);
  const answerMany = useCallback(
    (results: { id: number; correct: boolean }[]) =>
      setProgress((p) => results.reduce((acc, r) => recordAnswer(acc, r.id, r.correct), p)),
    [],
  );
  const addExam = useCallback(
    (exam: ExamRecord) => setProgress((p) => ({ ...p, exams: [exam, ...p.exams].slice(0, MAX_EXAMS) })),
    [],
  );
  const setLicense = useCallback((license: LicenseCode) => setProgress((p) => ({ ...p, license })), []);
  const reset = useCallback(() => setProgress((p) => ({ ...EMPTY_PROGRESS, license: p.license })), []);

  const api = useMemo(
    () => ({ progress, loaded, answer, answerMany, addExam, setLicense, reset }),
    [progress, loaded, answer, answerMany, addExam, setLicense, reset],
  );
  return <ProgressContext.Provider value={api}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
