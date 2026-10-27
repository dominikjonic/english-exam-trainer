import { useEffect, useRef } from 'react';
import HL from '../../vendor/hairline/kernel.js';
import { giraffe } from './giraffe.js';

/**
 * The Hairline giraffe for the break: she looks wherever the mouse is on the
 * ground, and walks her own little tour when nobody points.
 */
export function HairlineGiraffe() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    HL.inject(document);
    const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage);
    const read = { textContent: null as string | null };
    const figure = giraffe.mount({ stage, svg, read }, giraffe.range[1]);
    const tour = giraffe.tour ? HL.tour(stage, giraffe.tour) : null;
    return () => {
      tour?.stop();
      figure.destroy();
      svg.remove();
    };
  }, []);

  return <div ref={ref} className="hairline-giraffe" data-hairline="giraffe" role="img" aria-label="Eine Giraffe, die dorthin schaut, wo die Maus ist." />;
}
