import type { SceneDef } from '../../../play/logic/sceneTypes';
import { maintenanceBay } from './maintenance-bay';
import { roboticsAtrium } from './robotics-atrium';
import { manufacturingFloor } from './manufacturing-floor';
import { simRoom } from './sim-room';
import { plaza } from './plaza';
import { lanternCourtyard } from './lantern-courtyard';
import { spellClassroom } from './spell-classroom';
import { arena } from './arena';

/** Every playable place. Add a scene: write its file, list it here; nothing in the engine changes. */
export const scenes: SceneDef[] = [plaza, roboticsAtrium, maintenanceBay, manufacturingFloor, simRoom, lanternCourtyard, spellClassroom, arena];
const byId = new Map(scenes.map((s) => [s.id, s]));
export const getScene = (id: string): SceneDef | undefined => byId.get(id);
