import React from 'react';

interface DoctorAvatarProps {
  name: string;
  poli: string;
  size?: number; // size in px (default 56)
  className?: string;
}

export const DoctorAvatar: React.FC<DoctorAvatarProps> = ({
  name,
  poli,
  size = 56,
  className = ''
}) => {
  // Determine avatar archetype based on doctor name
  const isFemale =
    name.includes("I'anatul") ||
    name.includes('Atika') ||
    name.includes('Gladys') ||
    name.includes('Nikita') ||
    name.includes('Erliana') ||
    name.includes('Dayinta') ||
    name.includes('Yuli') ||
    name.includes('Ilma') ||
    name.includes('Hamidah') ||
    name.includes('Amelia') ||
    name.includes('Lilis');

  const isHijab =
    isFemale &&
    (name.includes("I'anatul") ||
      name.includes('Atika') ||
      name.includes('Erliana') ||
      name.includes('Yuli') ||
      name.includes('Ilma') ||
      name.includes('Hamidah') ||
      name.includes('Amelia') ||
      name.includes('Lilis'));

  // Get initials (e.g. "IU", "IB", "TR")
  const cleanName = name.replace(/^dr\.\s*/i, '').trim();
  const nameParts = cleanName.split(/[\s,.]+/).filter((p) => p.length > 0 && !p.startsWith('Sp') && !p.startsWith('M'));
  const initials = nameParts.length >= 2 ? `${nameParts[0][0]}${nameParts[1][0]}` : nameParts[0] ? nameParts[0].slice(0, 2).toUpperCase() : 'DR';

  // Palette based on specialty
  const getPoliBg = (p: string) => {
    const lower = p.toLowerCase();
    if (lower.includes('anak')) return { bg: '#e0f2fe', stroke: '#0284c7', ring: '#bae6fd' };
    if (lower.includes('jantung')) return { bg: '#fee2e2', stroke: '#dc2626', ring: '#fecaca' };
    if (lower.includes('bedah')) return { bg: '#dcfce7', stroke: '#16a34a', ring: '#bbf7d0' };
    if (lower.includes('obgyn')) return { bg: '#fce7f3', stroke: '#db2777', ring: '#fbcfe8' };
    if (lower.includes('mata')) return { bg: '#fef3c7', stroke: '#d97706', ring: '#fde68a' };
    if (lower.includes('saraf')) return { bg: '#f3e8ff', stroke: '#9333ea', ring: '#e9d5ff' };
    return { bg: '#e6f4ea', stroke: '#005d42', ring: '#ccebd6' };
  };

  const theme = getPoliBg(poli);

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-xs border-2 ${className}`}
      style={{
        width: size,
        height: size,
        borderColor: theme.stroke,
        backgroundColor: theme.bg
      }}
      title={`${name} (${poli})`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background gradient circle */}
        <circle cx="50" cy="50" r="48" fill={theme.bg} />

        {isHijab ? (
          // Doctor with Hijab & Stethoscope
          <g>
            {/* White Doctor Coat / Jas Dokter */}
            <path
              d="M20 95 C20 72, 35 65, 50 65 C65 65, 80 72, 80 95 Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="2"
            />
            {/* Coat Lapels */}
            <path d="M42 66 L50 82 L38 95" stroke="#94A3B8" strokeWidth="2" fill="none" />
            <path d="M58 66 L50 82 L62 95" stroke="#94A3B8" strokeWidth="2" fill="none" />

            {/* Inner Medical Scrub Shirt */}
            <polygon points="44,66 56,66 50,78" fill="#005d42" />

            {/* Hijab Silhouette */}
            <path
              d="M30 46 C28 26, 72 26, 70 46 C69 58, 67 68, 50 69 C33 68, 31 58, 30 46 Z"
              fill="#005d42"
            />
            {/* Hijab Fold Soft Shadow */}
            <path
              d="M33 42 C33 28, 67 28, 67 42 C67 52, 63 65, 50 66 C37 65, 33 52, 33 42 Z"
              fill="#007955"
            />

            {/* Face Oval */}
            <ellipse cx="50" cy="45" rx="14" ry="16" fill="#FED7AA" />

            {/* Eyes & Smile */}
            <circle cx="45" cy="43" r="1.5" fill="#334155" />
            <circle cx="55" cy="43" r="1.5" fill="#334155" />
            <path d="M47 50 Q50 53 53 50" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Stethoscope */}
            <path
              d="M36 68 Q34 82 44 87 L48 88"
              stroke="#0284C7"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M64 68 Q66 82 56 87 L52 88"
              stroke="#0284C7"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="50" cy="88" r="4.5" fill="#94A3B8" stroke="#334155" strokeWidth="1.5" />
          </g>
        ) : isFemale ? (
          // Female Doctor with hair
          <g>
            {/* Hair Back */}
            <circle cx="50" cy="40" r="23" fill="#1E293B" />

            {/* White Coat */}
            <path
              d="M20 95 C20 72, 35 65, 50 65 C65 65, 80 72, 80 95 Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="2"
            />
            {/* Scrub / Inner */}
            <polygon points="44,65 56,65 50,78" fill="#0284C7" />

            {/* Neck & Face */}
            <rect x="46" y="52" width="8" height="14" fill="#FED7AA" />
            <ellipse cx="50" cy="42" rx="15" ry="17" fill="#FED7AA" />

            {/* Hair Front */}
            <path d="M35 38 C35 25, 65 25, 65 38 C60 30, 40 30, 35 38 Z" fill="#1E293B" />

            {/* Eyes & Smile */}
            <circle cx="45" cy="41" r="1.5" fill="#334155" />
            <circle cx="55" cy="41" r="1.5" fill="#334155" />
            <path d="M47 48 Q50 51 53 48" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Stethoscope */}
            <path d="M35 66 Q35 84 45 88" stroke="#334155" strokeWidth="2.5" fill="none" />
            <path d="M65 66 Q65 84 55 88" stroke="#334155" strokeWidth="2.5" fill="none" />
            <circle cx="50" cy="88" r="4.5" fill="#94A3B8" stroke="#334155" strokeWidth="1.5" />
          </g>
        ) : (
          // Male Doctor
          <g>
            {/* White Coat */}
            <path
              d="M18 95 C18 72, 34 65, 50 65 C66 65, 82 72, 82 95 Z"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="2"
            />
            {/* Tie & Collar */}
            <polygon points="42,65 58,65 50,76" fill="#F1F5F9" />
            <path d="M48 68 L52 68 L51 82 L49 82 Z" fill="#1E3A8A" />

            {/* Neck & Face */}
            <rect x="45" y="50" width="10" height="15" fill="#FDBA74" />
            <ellipse cx="50" cy="41" rx="16" ry="17" fill="#FDBA74" />

            {/* Neat Short Hair */}
            <path
              d="M34 38 C34 22, 66 22, 66 38 C64 26, 36 26, 34 38 Z"
              fill="#0F172A"
            />

            {/* Eyes & Smile */}
            <circle cx="45" cy="40" r="1.6" fill="#0F172A" />
            <circle cx="55" cy="40" r="1.6" fill="#0F172A" />
            <path d="M46 47 Q50 50 54 47" stroke="#9A3412" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* Stethoscope */}
            <path
              d="M33 66 Q33 84 45 88"
              stroke="#1E293B"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M67 66 Q67 84 55 88"
              stroke="#1E293B"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="50" cy="88" r="4.5" fill="#94A3B8" stroke="#334155" strokeWidth="1.5" />
          </g>
        )}
      </svg>

      {/* Small badge initials overlay at bottom right */}
      <span
        className="absolute bottom-0 right-0 text-[8px] font-black px-1 rounded-tl-md text-white tracking-tighter"
        style={{ backgroundColor: theme.stroke }}
      >
        {initials}
      </span>
    </div>
  );
};
