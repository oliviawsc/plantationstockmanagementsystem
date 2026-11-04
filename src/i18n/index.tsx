import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LANG_KEY } from '../lib/config';
import { readString, writeString } from '../lib/storage';
import { en } from './en';
import { ms } from './ms';
import { extraEn, extraMs } from './extra';

const DICTS = {
  en: { ...en, ...extraEn },
  ms: { ...ms, ...extraMs },
};

export type Lang = keyof typeof DICTS;
type Full = (typeof DICTS)['en'];
type KeysOf<T, V> = { [K in keyof T]: T[K] extends V ? K : never }[keyof T];
/** Keys whose text is a string (almost all). */
export type TextKey = KeysOf<Full, string>;
/** Keys whose value is a list (months_short, months_full). */
export type ListKey = KeysOf<Full, readonly string[]>;
export type Vars = Record<string, string | number>;

export function isTextKey(k: string): k is TextKey {
  return k in DICTS.en && typeof (DICTS.en as Record<string, unknown>)[k] === 'string';
}

/** List values (e.g. month names). */
export function translateList(lang: Lang, key: ListKey): readonly string[] {
  return DICTS[lang][key] ?? DICTS.en[key];
}

/** Plain lookup outside React (e.g. toasts raised from the data layer). */
export function translate(lang: Lang, key: TextKey, vars?: Vars): string {
  let s: string = (DICTS[lang][key] as string | undefined) ?? DICTS.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export function readLang(): Lang {
  return readString(LANG_KEY) === 'ms' ? 'ms' : 'en';
}

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: TextKey, vars?: Vars) => string;
}
const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);
  const setLang = useCallback((l: Lang) => {
    writeString(LANG_KEY, l);
    setLangState(l);
  }, []);
  const t = useCallback((k: TextKey, vars?: Vars) => translate(lang, k, vars), [lang]);
  useEffect(() => {
    document.title = translate(lang, 'doc_title');
    document.documentElement.lang = lang === 'ms' ? 'ms' : 'en';
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}

/** Translate an error thrown by lib/auth or callFunction (Error(code)). */
export function useErrorText() {
  const { t } = useI18n();
  return useCallback((e: unknown) => {
    const code = e instanceof Error ? e.message : '';
    return t(isTextKey(code) ? code : 'err_network');
  }, [t]);
}
