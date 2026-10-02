import type { NpcLook } from '../../play/logic/dialogue';
import { getAvatar } from '../avatars';

const hex = (css: string): number => parseInt(css.replace('#', ''), 16);
/** The protagonist is a CodeQuest field engineer: techwear, a pack with an antenna and a headset, whatever the colours chosen on the title screen. */
const STYLE: Record<string, Pick<NpcLook, 'hairStyle' | 'accessory' | 'outfit'>> = {
  spellwright: { hairStyle: 'short', accessory: 'techpack', outfit: 'tech' },
  ranger: { hairStyle: 'long', accessory: 'techpack', outfit: 'tech' },
  artificer: { hairStyle: 'curly', accessory: 'techpack', outfit: 'tech' },
  scout: { hairStyle: 'bun', accessory: 'techpack', outfit: 'tech' },
};

/** The player's look in the 3D world, from the avatar chosen on the title screen (same colours as the portrait). */
export function playerLook(avatarId: string): NpcLook {
  const a = getAvatar(avatarId);
  return { body: hex(a.robe), head: hex(a.skin), accent: hex(a.trim), hair: hex(a.hair), hat: 'none', legs: 0x232a42, ...(STYLE[a.id] ?? STYLE.spellwright!) };
}
