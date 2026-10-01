/**
 * DIALOGUE (pure): an NPC says different things as the player's story and skills move on. The first entry whose condition holds wins, so
 * entries are written from most to least specific. An entry may OFFER a quest (the UI shows Accept only if the quest is really available).
 */
import type { SaveData } from '../../core/save';
import { getQuest, questStatus } from '../../game/quests';
import { holds } from './conditions';
import type { Condition } from './sceneTypes';

export interface DialogueEntry {
  when?: Condition;
  lines: string[];
  /** A quest this conversation offers. */
  offer?: string;
  /** A story fact recorded when this is heard (quest steps can ask for it, e.g. `inspect: 'juno-debrief'`). */
  marks?: string;
  /** Face the NPC shows while saying it (drives a small animation). */
  mood?: 'neutral' | 'cheer' | 'worry' | 'think';
}

export interface NpcLook {
  body: number; head: number; accent: number;
  /** Hair colour (people only). */
  hair?: number;
  /** Silhouette: a hat, hood, hard hat, visor, cap, ... */
  hat?: 'hardhat' | 'cap' | 'wizard' | 'hood' | 'visor' | 'none' | 'helmet' | 'headband';
  /** A robot is not shaped like a person. */
  shape?: 'human' | 'robot';
  /** Clothing cut (default follows the hat: hard hat → overalls, wizard/hood → robe). `body` is its colour. */
  outfit?: 'jacket' | 'coat' | 'robe' | 'overalls' | 'vest';
  accessory?: 'toolbelt' | 'backpack' | 'scarf' | 'goggles' | 'satchel' | 'cape' | 'lanyard';
  hairStyle?: 'short' | 'long' | 'bun' | 'curly' | 'bald';
  /** Trouser colour. */
  legs?: number;
  build?: 'slim' | 'regular' | 'broad';
  scale?: number;
}

export interface Npc3D {
  id: string;
  /** Shown beside what they say. */
  icon?: string;
  name: string;
  role: string;
  /** Who they are, for writers and for the journal. */
  personality: string;
  look: NpcLook;
  dialogue: DialogueEntry[];
}

export interface Conversation {
  npc: Npc3D;
  entry: DialogueEntry;
  /** True when a quest is on offer and can be accepted right now. */
  canOffer: boolean;
  questId?: string;
}

/** The conversation the player would have with this NPC right now. */
export function conversationWith(save: SaveData, npc: Npc3D): Conversation {
  const entry = npc.dialogue.find((d) => holds(save, d.when)) ?? { lines: ['…'] };
  const q = entry.offer ? getQuest(entry.offer) : undefined;
  return { npc, entry, canOffer: !!q && questStatus(save, q) === 'available', questId: q?.id };
}
