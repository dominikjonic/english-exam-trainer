export interface HairlineFigure {
  name: string;
  means: string;
  range: [number, number, number];
  tour: ([number, number] | null)[] | null;
  mount(
    ctx: { stage: HTMLElement; svg: SVGElement; read: { textContent: string | null } },
    value: number,
  ): { set(value: number): void; destroy(): void };
}
export declare const giraffe: HairlineFigure;
