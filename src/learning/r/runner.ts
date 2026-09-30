import { RRunner } from './RRunner';

/** The shared R runtime for the browser. Loaded lazily (webR is ~45 MB) the first time an R lesson needs it. */
let instance: RRunner | null = null;
export const getRRunner = (): RRunner => (instance ??= new RRunner({ baseUrl: new URL(`${import.meta.env.BASE_URL}webr/`, document.baseURI).href }));
