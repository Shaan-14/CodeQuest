import type { NpcLook } from '../../play/logic/dialogue';
import { getAvatar } from '../avatars';

const hex = (css: string): number => parseInt(css.replace('#', ''), 16);
const STYLE: Record<string, Pick<NpcLook, 'hairStyle' | 'accessory' | 'outfit'>> = {
  spellwright: { hairStyle: 'short', accessory: 'scarf', outfit: 'jacket' },
  ranger: { hairStyle: 'long', accessory: 'satchel', outfit: 'jacket' },
  artificer: { hairStyle: 'curly', accessory: 'goggles', outfit: 'overalls' },
  scout: { hairStyle: 'bun', accessory: 'backpack', outfit: 'jacket' },
};

/** The player's look in the 3D world, from the avatar chosen on the title screen (same colours as the portrait). */
export function playerLook(avatarId: string): NpcLook {
  const a = getAvatar(avatarId);
  return { body: hex(a.robe), head: hex(a.skin), accent: hex(a.trim), hair: hex(a.hair), hat: 'none', ...(STYLE[a.id] ?? STYLE.spellwright!) };
}
