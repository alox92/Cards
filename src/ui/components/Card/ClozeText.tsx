import type { FC } from "react";

interface ClozeTextProps {
  source: string;
  revealAll?: boolean;
}

// Very small renderer for cloze-style text using {{c1::...}} markers.
export const ClozeText: FC<ClozeTextProps> = ({ source, revealAll }) => {
  const segments: Array<{ key: string; text: string; cloze: boolean }> = [];

  let remaining = source;
  let index = 0;

  while (remaining.length) {
    const start = remaining.indexOf("{{c");
    if (start === -1) {
      segments.push({ key: `p-${index}`, text: remaining, cloze: false });
      break;
    }
    if (start > 0) {
      segments.push({
        key: `p-${index}`,
        text: remaining.slice(0, start),
        cloze: false,
      });
      index += 1;
    }
    const end = remaining.indexOf("}}", start + 3);
    if (end === -1) {
      segments.push({
        key: `p-${index}`,
        text: remaining.slice(start),
        cloze: false,
      });
      break;
    }
    const inner = remaining.slice(start, end + 2);
    const match = inner.match(/\{\{c\d+::(.*)\}\}/s);
    if (!match) {
      segments.push({ key: `p-${index}`, text: inner, cloze: false });
    } else {
      segments.push({ key: `c-${index}`, text: match[1], cloze: true });
    }
    remaining = remaining.slice(end + 2);
    index += 1;
  }

  return (
    <span>
      {segments.map((seg) => {
        if (!seg.cloze) {
          return <span key={seg.key}>{seg.text}</span>;
        }
        if (revealAll) {
          return (
            <span key={seg.key} className="underline decoration-dotted">
              {seg.text}
            </span>
          );
        }
        return (
          <span
            key={seg.key}
            className="inline-block px-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100"
          >
            [...]
          </span>
        );
      })}
    </span>
  );
};
