import type { SceneDef } from '../../../play/logic/sceneTypes';
import { maintenanceBay } from './maintenance-bay';

/** Every playable place. Add a scene: write its file, list it here; nothing in the engine changes. */
export const scenes: SceneDef[] = [maintenanceBay];
const byId = new Map(scenes.map((s) => [s.id, s]));
export const getScene = (id: string): SceneDef | undefined => byId.get(id);
