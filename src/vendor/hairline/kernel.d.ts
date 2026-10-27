/** The Hairline kernel (see kernel.js). Only what the app's own code calls is typed. */
declare const HL: {
  mk(tag: string, attrs: Record<string, string>, parent: Element): SVGElement;
  inject(root: Document | ShadowRoot): void;
  tour(stage: HTMLElement, stops: ([number, number] | null)[], onStop?: (i: number) => void): { stop(): void };
  [name: string]: unknown;
};
export default HL;
