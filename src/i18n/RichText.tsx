// Renders the few legacy strings that contain inline markup (<b>, <i>,
// <strong>, <br>) and HTML entities, without innerHTML.
import { Fragment, type ReactNode } from 'react';

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return NAMED[code.toLowerCase()] ?? m;
  });
}

const TAG = /<(\/?)(b|strong|i|em|br)\s*\/?>/gi;

export function parseRich(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const stack: { tag: string; children: ReactNode[] }[] = [{ tag: '', children: out }];
  let last = 0;
  let key = 0;
  const push = (n: ReactNode) => stack[stack.length - 1].children.push(n);
  for (const m of text.matchAll(TAG)) {
    if (m.index! > last) push(decodeEntities(text.slice(last, m.index)));
    last = m.index! + m[0].length;
    const tag = m[2].toLowerCase();
    if (tag === 'br') { push(<br key={key++} />); continue; }
    if (!m[1]) { stack.push({ tag, children: [] }); continue; }
    if (stack.length > 1 && stack[stack.length - 1].tag === tag) {
      const node = stack.pop()!;
      const El = node.tag === 'b' || node.tag === 'strong' ? 'strong' : 'em';
      push(<El key={key++}>{node.children}</El>);
    }
  }
  if (last < text.length) push(decodeEntities(text.slice(last)));
  while (stack.length > 1) {
    const node = stack.pop()!;
    push(<Fragment key={key++}>{node.children}</Fragment>);
  }
  return out;
}

export function RichText({ text }: { text: string }) {
  return <>{parseRich(text)}</>;
}
