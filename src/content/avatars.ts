export interface AvatarPreset {
  id: string;
  label: string;
  robe: string;
  trim: string;
  hair: string;
  skin: string;
}

/** Character presets. Drawn as SVG in app/components/Avatar.tsx. */
export const avatars: AvatarPreset[] = [
  { id: 'spellwright', label: 'Spellwright', robe: '#5b6bd6', trim: '#f2c14e', hair: '#e8d9b0', skin: '#f2c9a0' },
  { id: 'ranger', label: 'Ranger', robe: '#3f8f5a', trim: '#c9b37e', hair: '#5a3a22', skin: '#d9a877' },
  { id: 'artificer', label: 'Artificer', robe: '#c2603a', trim: '#4fd1c5', hair: '#1f1a1a', skin: '#8d5a3b' },
  { id: 'scout', label: 'Scout', robe: '#9a4fc2', trim: '#f2f2f2', hair: '#c94f6d', skin: '#f6d6b8' },
];

export const getAvatar = (id: string): AvatarPreset => avatars.find((a) => a.id === id) ?? avatars[0]!;
