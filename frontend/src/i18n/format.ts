import type { TFunction } from 'i18next';

/** "b. 1968" for the living, "1940 – 2010" for the deceased, "?" for unknown years. */
export function formatLifespan(
  t: TFunction,
  birthYear: string | undefined,
  deathYear: string | undefined,
  isLiving: boolean
): string {
  const born = birthYear || '?';
  if (isLiving) return `${t('node.born')} ${born}`;
  return `${born} – ${deathYear || '?'}`;
}

export const yearOf = (isoDate?: string) => (isoDate ? isoDate.slice(0, 4) : undefined);
