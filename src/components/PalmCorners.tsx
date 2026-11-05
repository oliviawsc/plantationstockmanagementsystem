// Faint palm-leaf silhouettes in the four corners of the login screen.
import type { CSSProperties } from 'react';
const PATHS: Record<string, string[]> = {
  tl: ['M 10,10 Q 160,40 290,120 Q 160,80 10,10Z', 'M 10,10 Q 140,140 200,280 Q 80,160 10,10Z', 'M 10,10 Q 50,150 80,290 Q 20,160 10,10Z', 'M 10,10 Q 200,80 290,200 Q 160,100 10,10Z'],
  tr: ['M 290,10 Q 140,40 10,120 Q 140,80 290,10Z', 'M 290,10 Q 160,140 100,280 Q 220,160 290,10Z', 'M 290,10 Q 250,150 220,290 Q 280,160 290,10Z', 'M 290,10 Q 100,80 10,200 Q 140,100 290,10Z'],
  bl: ['M 10,290 Q 160,260 290,180 Q 160,220 10,290Z', 'M 10,290 Q 140,160 200,20 Q 80,140 10,290Z', 'M 10,290 Q 50,150 80,10 Q 20,140 10,290Z', 'M 10,290 Q 200,220 290,100 Q 160,200 10,290Z'],
  br: ['M 290,290 Q 140,260 10,180 Q 140,220 290,290Z', 'M 290,290 Q 160,160 100,20 Q 220,140 290,290Z', 'M 290,290 Q 250,150 220,10 Q 280,140 290,290Z', 'M 290,290 Q 100,220 10,100 Q 140,200 290,290Z'],
};
const FILLS = ['#2E7D32', '#43A047', '#4CAF50', '#388E3C'];
const POS: Record<string, CSSProperties> = {
  tl: { top: 0, left: 0 }, tr: { top: 0, right: 0 }, bl: { bottom: 0, left: 0 }, br: { bottom: 0, right: 0 },
};

export function PalmCorners() {
  return (
    <>
      {Object.keys(PATHS).map((k) => (
        <div key={k} className="palm-corner" style={{ ...POS[k], width: 260, height: 260 }} aria-hidden="true">
          <svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" width="260" height="260">
            {PATHS[k].map((d, i) => <path key={i} d={d} fill={FILLS[i]} />)}
          </svg>
        </div>
      ))}
    </>
  );
}
