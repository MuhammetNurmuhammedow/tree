// Web-font CSS for html-to-image.
//
// html-to-image normally builds this itself by reading document.styleSheets,
// but browsers (Firefox in particular) forbid reading rules of the cross-origin
// Google Fonts stylesheet, and the library then crashes on an undefined font
// family. Instead we fetch the stylesheet ourselves (Google Fonts serves it with
// CORS), inline every font file as a data: URL — an SVG rendered to a canvas
// cannot load remote files — and hand the result over via `fontEmbedCSS`.

let cached: Promise<string | null> | null = null;

function findFontStylesheet(): string | null {
  const link = document.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
  return link?.href ?? null;
}

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function build(): Promise<string | null> {
  const href = findFontStylesheet();
  if (!href) return null;
  let css = await (await fetch(href)).text();
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))];
  const inlined = await Promise.all(urls.map(async (url) => [url, await toDataUrl(url)] as const));
  for (const [url, data] of inlined) css = css.split(url).join(data);
  return css;
}

/** Embeddable @font-face CSS, or null if the fonts can't be fetched (offline etc.). */
export function getFontEmbedCSS(): Promise<string | null> {
  cached ??= build().catch((err) => {
    console.warn('Web fonts could not be embedded; exports will use fallback fonts.', err);
    cached = null; // retry next time, e.g. after coming back online
    return null;
  });
  return cached;
}
