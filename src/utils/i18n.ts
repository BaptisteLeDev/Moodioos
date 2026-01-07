/**
 * i18n (Internationalization) Utility
 *
 * Provides translation utilities for multi-language support in the bot.
 * Supports English (en-US/en-GB) and French (fr).
 *
 * @module utils/i18n
 */

import { createRequire } from 'module';
import type { Locale } from 'discord.js';

const require = createRequire(import.meta.url);

// Load translation files
const enTranslations = require('../locales/en.json') as unknown as Record<string, unknown>;
const frTranslations = require('../locales/fr.json') as unknown as Record<string, unknown>;

/**
 * Supported locales
 */
export type SupportedLocale = 'en' | 'fr';

/**
 * Translation storage
 */
const translations: Record<SupportedLocale, Record<string, unknown>> = {
  en: enTranslations,
  fr: frTranslations,
};

/**
 * Get user's preferred locale from Discord locale
 *
 * Maps Discord locales to supported locales, defaults to English.
 *
 * @param discordLocale - Discord locale from interaction
 * @returns Supported locale code
 */
export function getLocale(discordLocale?: Locale | string): SupportedLocale {
  if (!discordLocale) {
    return 'en';
  }

  // Map Discord locales to supported locales
  if (discordLocale.startsWith('fr')) {
    return 'fr';
  }

  // Default to English for all other locales
  return 'en';
}

/**
 * Get nested translation value from object
 *
 * @param obj - Translation object
 * @param path - Dot-separated path (e.g., 'stats.title')
 * @returns Translation value or undefined
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Translate a key with optional replacements
 *
 * @param locale - Target locale ('en' or 'fr')
 * @param key - Translation key (dot-separated path, e.g., 'stats.title')
 * @param replacements - Optional object with {placeholder: value} replacements
 * @returns Translated string with replacements applied
 *
 * @example
 * ```ts
 * t('en', 'ping.response', { latency: 42, apiLatency: 15 })
 * // => "🏓 Pong! Latency: 42ms | API Latency: 15ms"
 * ```
 */
export function t(
  locale: SupportedLocale,
  key: string,
  replacements?: Record<string, string | number>,
): string {
  const localeTranslations = translations[locale] || translations.en;
  let translation = getNestedValue(localeTranslations, key);

  // Fallback to English if translation not found
  if (translation === undefined) {
    translation = getNestedValue(translations.en, key);
  }

  // If still not found, return the key itself
  if (typeof translation !== 'string') {
    console.warn(`Translation missing for key: ${key} (locale: ${locale})`);
    return key;
  }

  // Apply replacements
  if (replacements) {
    return Object.entries(replacements).reduce((str, [placeholder, value]) => {
      return str.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), String(value));
    }, translation);
  }

  return translation;
}

/**
 * Get plural translation based on count
 *
 * @param locale - Target locale
 * @param key - Base translation key (without suffix)
 * @param count - Count for pluralization
 * @param replacements - Optional replacements
 * @returns Translated string with proper plural form
 *
 * @example
 * ```ts
 * tp('en', 'stats.serversValue', 1, { count: 1 }) // "1 server"
 * tp('en', 'stats.serversValue', 5, { count: 5 }) // "5 servers"
 * ```
 */
export function tp(
  locale: SupportedLocale,
  key: string,
  count: number,
  replacements?: Record<string, string | number>,
): string {
  const pluralKey = count === 1 ? key : `${key}Plural`;
  return t(locale, pluralKey, { ...replacements, count });
}
