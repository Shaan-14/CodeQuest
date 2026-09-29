import { getAvatar } from '../../content/avatars';

interface Props {
  avatar: string;
  size?: number;
  cape?: boolean;
  cap?: boolean;
}

/** Small SVG adventurer. Cosmetics bought in the shop appear automatically. */
export function Avatar({ avatar, size = 64, cape = false, cap = false }: Props) {
  const a = getAvatar(avatar);
  return (
    <svg class="avatar" width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Your character">
      {cape && <path d="M18 30 L10 58 L54 58 L46 30 Z" fill="#c0392b" />}
      <path d="M20 32 Q32 26 44 32 L48 58 L16 58 Z" fill={a.robe} />
      <path d="M28 32 L32 44 L36 32 Z" fill={a.trim} />
      <rect x="16" y="54" width="32" height="4" fill={a.trim} opacity=".8" />
      <circle cx="32" cy="20" r="11" fill={a.skin} />
      <path d="M20.5 19 Q22 7 32 8 Q42 7 43.5 19 Q38 12 32 13 Q26 12 20.5 19 Z" fill={a.hair} />
      {cap && (
        <g>
          <path d="M20 16 Q32 2 44 16 Z" fill="#2d6cdf" />
          <rect x="18" y="15" width="28" height="3" rx="1.5" fill="#1d4fa8" />
          <rect x="40" y="15" width="12" height="3" rx="1.5" fill="#1d4fa8" />
        </g>
      )}
      <circle cx="28" cy="21" r="1.6" fill="#1b1b2f" />
      <circle cx="36" cy="21" r="1.6" fill="#1b1b2f" />
      <path d="M28.5 26 Q32 28.5 35.5 26" stroke="#7a3f2b" stroke-width="1.4" fill="none" stroke-linecap="round" />
    </svg>
  );
}
