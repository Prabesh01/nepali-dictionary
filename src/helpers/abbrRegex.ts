import abbrData from '../../public/abbr.json';

// Compile abbreviation regex at module load time
const abbrs = Object.values(abbrData).map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.');
export const ABBR_REGEX = new RegExp(`(?<![ऀ-ॿ\\w])(?:${abbrs.join('|')})`, 'g');

export const linkAbbreviations = (text: string): string => {
  return text.replace(ABBR_REGEX, (match) => {
    const urlWord = encodeURIComponent(match.trim().replaceAll(" ", "_"));
    return `<a href="/word/${urlWord}" class="abbr-link">${match}</a>`;
  });
};
