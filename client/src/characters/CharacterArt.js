// Hand-authored vector (SVG) character art, drawn in a flat-toon style to sit
// alongside the imported Kenney CC0 sprites. Each entry is a full SVG string
// rasterized to a texture (`<id>_art`) in BootScene.
//
// Style rules (keep them consistent across all characters):
//   • viewBox 0 0 200 240, character standing, feet ~y=214, head ~y=70
//   • bold dark outline (OUTLINE / OW) with round joins
//   • flat vibrant fills + one soft highlight + one soft lower shadow
//   • big expressive chibi head & eyes (Clash-Royale-ish proportions)

const VB = '0 0 200 240';
const OUTLINE = '#211d39';
const OW = 5;

const wrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB}" width="240" height="288">${inner}</svg>`;

const shadow = () =>
  `<ellipse cx="100" cy="226" rx="50" ry="11" fill="#000" opacity="0.22"/>`;

// Two cartoon eyes centred at (cx,y), spaced ±sp
const eyes = (cx, y, sp, r, pupil = '#23203c') => `
  <ellipse cx="${cx - sp}" cy="${y}" rx="${r}" ry="${r * 1.12}" fill="#fff" stroke="${OUTLINE}" stroke-width="2.5"/>
  <ellipse cx="${cx + sp}" cy="${y}" rx="${r}" ry="${r * 1.12}" fill="#fff" stroke="${OUTLINE}" stroke-width="2.5"/>
  <circle cx="${cx - sp}" cy="${y + 1}" r="${r * 0.52}" fill="${pupil}"/>
  <circle cx="${cx + sp}" cy="${y + 1}" r="${r * 0.52}" fill="${pupil}"/>
  <circle cx="${cx - sp - 1.5}" cy="${y - 1.5}" r="${r * 0.22}" fill="#fff"/>
  <circle cx="${cx + sp - 1.5}" cy="${y - 1.5}" r="${r * 0.22}" fill="#fff"/>`;

// Soft white highlight blob & dark lower shade (give flat fills some volume)
const hi = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="0.16"/>`;
const sh = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000" opacity="0.12"/>`;

const o = `stroke="${OUTLINE}" stroke-width="${OW}" stroke-linejoin="round" stroke-linecap="round"`;

// ───────────────────────────────────────────────────────────────────────────

const titan_grunt = () => wrap(`
  ${shadow()}
  <!-- legs -->
  <rect x="74" y="176" width="20" height="36" rx="7" fill="#46474d" ${o}/>
  <rect x="106" y="176" width="20" height="36" rx="7" fill="#46474d" ${o}/>
  <!-- torso armor -->
  <path d="M62 110 q38 -16 76 0 l8 70 q-46 16 -92 0 z" fill="#6f7177" ${o}/>
  <rect x="84" y="120" width="32" height="64" rx="8" fill="#8a8c93"/>
  ${sh(100, 178, 40, 16)}
  <!-- shoulders -->
  <ellipse cx="58" cy="118" rx="22" ry="20" fill="#83858c" ${o}/>
  <ellipse cx="142" cy="118" rx="22" ry="20" fill="#83858c" ${o}/>
  <!-- axe -->
  <rect x="150" y="70" width="8" height="120" rx="4" fill="#6b4a2b" ${o}/>
  <path d="M138 74 q34 -8 38 24 q-22 6 -38 -4 z" fill="#b9c0c7" ${o}/>
  <!-- head / helmet -->
  <ellipse cx="100" cy="78" rx="34" ry="32" fill="#7a7c83" ${o}/>
  <path d="M70 64 q-16 -22 -2 -34 q12 8 14 28 z" fill="#9a9ca3" ${o}/>
  <path d="M130 64 q16 -22 2 -34 q-12 8 -14 28 z" fill="#9a9ca3" ${o}/>
  <rect x="74" y="74" width="52" height="13" rx="6" fill="#2a2a33" ${o}/>
  <rect x="80" y="78" width="40" height="5" rx="2.5" fill="#ff4d2e"/>
  ${hi(86, 62, 16, 10)}`);

const pyro_drake = () => wrap(`
  ${shadow()}
  <!-- wings -->
  <path d="M70 96 q-58 -34 -64 12 q34 -6 58 18 z" fill="#c0341d" ${o}/>
  <path d="M130 96 q58 -34 64 12 q-34 -6 -58 18 z" fill="#c0341d" ${o}/>
  <!-- tail -->
  <path d="M132 188 q40 22 52 -8 q-20 -2 -34 -18 z" fill="#e8551f" ${o}/>
  <!-- legs -->
  <rect x="80" y="176" width="17" height="34" rx="7" fill="#d8481a" ${o}/>
  <rect x="103" y="176" width="17" height="34" rx="7" fill="#d8481a" ${o}/>
  <!-- body -->
  <ellipse cx="100" cy="140" rx="40" ry="46" fill="#f0561e" ${o}/>
  <ellipse cx="100" cy="150" rx="22" ry="30" fill="#ffd089"/>
  ${hi(86, 120, 16, 18)}
  <!-- head -->
  <ellipse cx="100" cy="82" rx="33" ry="30" fill="#f0561e" ${o}/>
  <path d="M78 60 q-6 -22 8 -30 q6 14 2 28 z" fill="#ffb24d" ${o}/>
  <path d="M122 60 q6 -22 -8 -30 q-6 14 -2 28 z" fill="#ffb24d" ${o}/>
  <ellipse cx="100" cy="96" rx="20" ry="13" fill="#ff7a3c" ${o}/>
  <circle cx="92" cy="98" r="2.5" fill="${OUTLINE}"/><circle cx="108" cy="98" r="2.5" fill="${OUTLINE}"/>
  ${eyes(100, 78, 11, 7.5)}
  <path d="M88 104 q12 8 24 0" fill="none" stroke="#ffd089" stroke-width="3"/>`);

const lady_vex = () => wrap(`
  ${shadow()}
  <!-- robe -->
  <path d="M66 116 q34 -14 68 0 l16 96 q-50 16 -100 0 z" fill="#7d3fb0" ${o}/>
  <path d="M100 120 l10 92 h-20 z" fill="#9b59c6"/>
  ${sh(100, 200, 46, 16)}
  <!-- arms with glowing hands -->
  <path d="M70 126 q-22 18 -20 44" fill="none" ${o}/>
  <path d="M130 126 q22 18 20 44" fill="none" ${o}/>
  <circle cx="50" cy="172" r="11" fill="#e24bd0" ${o}/>
  <circle cx="150" cy="172" r="11" fill="#e24bd0" ${o}/>
  <circle cx="50" cy="172" r="5" fill="#ffd6f6"/>
  <circle cx="150" cy="172" r="5" fill="#ffd6f6"/>
  <!-- staff -->
  <rect x="156" y="78" width="7" height="120" rx="3.5" fill="#5a3a7a" ${o}/>
  <circle cx="159" cy="72" r="13" fill="#ff4fd8" ${o}/>
  <circle cx="159" cy="72" r="6" fill="#ffd6f6"/>
  <!-- hood + face -->
  <path d="M68 86 q32 -40 64 0 q-6 26 -32 28 q-26 -2 -32 -28 z" fill="#6a2f99" ${o}/>
  <ellipse cx="100" cy="92" rx="22" ry="20" fill="#f6d9b8"/>
  ${eyes(100, 90, 9, 7, '#c026a8')}
  <path d="M90 102 q10 6 20 0" fill="none" stroke="#b06a8a" stroke-width="2.5"/>
  ${hi(88, 80, 12, 10)}`);

const stone_golem = () => wrap(`
  ${shadow()}
  <!-- arms -->
  <rect x="34" y="118" width="30" height="60" rx="12" fill="#5d666b" ${o}/>
  <rect x="136" y="118" width="30" height="60" rx="12" fill="#5d666b" ${o}/>
  <ellipse cx="49" cy="184" rx="18" ry="16" fill="#6d767b" ${o}/>
  <ellipse cx="151" cy="184" rx="18" ry="16" fill="#6d767b" ${o}/>
  <!-- legs -->
  <rect x="72" y="184" width="24" height="30" rx="6" fill="#525b60" ${o}/>
  <rect x="104" y="184" width="24" height="30" rx="6" fill="#525b60" ${o}/>
  <!-- body boulder -->
  <path d="M60 96 q40 -20 80 0 q14 50 0 92 q-40 18 -80 0 q-14 -42 0 -92 z" fill="#6b747a" ${o}/>
  <!-- lava cracks -->
  <path d="M84 116 l10 18 l-8 16 l12 14" fill="none" stroke="#ff6a1f" stroke-width="4" stroke-linecap="round"/>
  <path d="M120 124 l-8 20 l10 12" fill="none" stroke="#ff6a1f" stroke-width="4" stroke-linecap="round"/>
  ${hi(82, 110, 18, 14)}
  <!-- single eye -->
  <ellipse cx="100" cy="104" rx="20" ry="16" fill="#2a2f33" ${o}/>
  <circle cx="100" cy="104" r="9" fill="#ff8a3d"/>
  <circle cx="100" cy="104" r="4" fill="#ffe08a"/>`);

const thunder_chief = () => wrap(`
  ${shadow()}
  <!-- legs -->
  <rect x="76" y="178" width="18" height="34" rx="7" fill="#b5611f" ${o}/>
  <rect x="106" y="178" width="18" height="34" rx="7" fill="#b5611f" ${o}/>
  <!-- axes -->
  <rect x="34" y="84" width="7" height="104" rx="3.5" fill="#6b4a2b" ${o}/>
  <path d="M22 88 q22 -8 30 12 q-16 6 -30 0 z" fill="#cfd6dd" ${o}/>
  <rect x="159" y="84" width="7" height="104" rx="3.5" fill="#6b4a2b" ${o}/>
  <path d="M178 88 q-22 -8 -30 12 q16 6 30 0 z" fill="#cfd6dd" ${o}/>
  <!-- torso -->
  <path d="M68 116 q32 -14 64 0 l8 66 q-40 14 -80 0 z" fill="#c4631f" ${o}/>
  <path d="M76 126 h48 l4 50 h-56 z" fill="#a44a16"/>
  ${sh(100, 176, 38, 14)}
  <!-- chest war paint -->
  <path d="M86 134 l14 8 l14 -8" fill="none" stroke="#ffd23d" stroke-width="4"/>
  <!-- head + mohawk -->
  <ellipse cx="100" cy="84" rx="30" ry="29" fill="#e0843c" ${o}/>
  <path d="M100 54 q-16 -26 0 -38 q16 12 0 38 z" fill="#c0392b" ${o}/>
  <path d="M84 60 q-10 -18 0 -26 M116 60 q10 -18 0 -26" fill="none" stroke="#c0392b" stroke-width="6"/>
  ${eyes(100, 84, 9, 7)}
  <path d="M88 98 q12 7 24 0" fill="none" stroke="#7a3b14" stroke-width="3"/>
  ${hi(88, 72, 12, 9)}`);

const blaze_witch = () => wrap(`
  ${shadow()}
  <!-- robe -->
  <path d="M68 120 q32 -14 64 0 l14 92 q-46 16 -92 0 z" fill="#b5341d" ${o}/>
  <path d="M100 124 l8 88 h-16 z" fill="#e0561f"/>
  ${sh(100, 200, 44, 15)}
  <!-- fire hands -->
  <circle cx="52" cy="150" r="13" fill="#ff7a1f" ${o}/>
  <path d="M52 138 q6 -12 0 -20 q-6 8 0 20" fill="#ffd23d"/>
  <circle cx="148" cy="150" r="13" fill="#ff7a1f" ${o}/>
  <path d="M148 138 q6 -12 0 -20 q-6 8 0 20" fill="#ffd23d"/>
  <!-- face -->
  <ellipse cx="100" cy="92" rx="24" ry="22" fill="#f6d9b8" ${o}/>
  ${eyes(100, 92, 9, 7, '#ff5a1f')}
  <!-- witch hat -->
  <ellipse cx="100" cy="70" rx="38" ry="9" fill="#3a1f5e" ${o}/>
  <path d="M100 8 l24 58 q-24 8 -48 0 z" fill="#4a2870" ${o}/>
  <path d="M112 36 l6 24 q-10 3 -18 0 z" fill="#6a3fa0"/>
  ${hi(90, 84, 11, 9)}`);

const wing_knight = () => wrap(`
  ${shadow()}
  <!-- wings -->
  <path d="M72 100 q-50 -20 -60 24 q30 4 60 8 z" fill="#eef2f7" ${o}/>
  <path d="M128 100 q50 -20 60 24 q-30 4 -60 8 z" fill="#eef2f7" ${o}/>
  <path d="M30 112 h24 M34 124 h22" stroke="#c4cdd6" stroke-width="3" fill="none"/>
  <path d="M170 112 h-24 M166 124 h-22" stroke="#c4cdd6" stroke-width="3" fill="none"/>
  <!-- legs -->
  <rect x="80" y="176" width="17" height="36" rx="7" fill="#cfd6dd" ${o}/>
  <rect x="103" y="176" width="17" height="36" rx="7" fill="#cfd6dd" ${o}/>
  <!-- lance -->
  <rect x="150" y="64" width="7" height="128" rx="3.5" fill="#caa53d" ${o}/>
  <path d="M153 50 l9 18 h-18 z" fill="#ffe08a" ${o}/>
  <!-- body armor -->
  <path d="M68 116 q32 -14 64 0 l8 64 q-40 14 -80 0 z" fill="#dfe5ec" ${o}/>
  <path d="M92 120 h16 l4 58 h-24 z" fill="#f6c84a"/>
  ${sh(100, 174, 36, 13)}
  <!-- helmet -->
  <ellipse cx="100" cy="82" rx="28" ry="28" fill="#e8edf2" ${o}/>
  <rect x="84" y="76" width="32" height="11" rx="5" fill="#2a2f3a"/>
  <path d="M100 56 l8 -16 h-16 z" fill="#f6c84a" ${o}/>
  ${hi(90, 70, 12, 9)}`);

const frostborn = () => wrap(`
  ${shadow()}
  <!-- floating ice shards -->
  <path d="M40 110 l6 -14 l6 14 l-6 12 z" fill="#bfe9ff" ${o}/>
  <path d="M160 120 l6 -14 l6 14 l-6 12 z" fill="#bfe9ff" ${o}/>
  <!-- robe -->
  <path d="M68 118 q32 -14 64 0 l14 94 q-46 16 -92 0 z" fill="#2b6ea3" ${o}/>
  <path d="M100 122 l9 90 h-18 z" fill="#56a0d6"/>
  ${sh(100, 200, 44, 15)}
  <!-- staff -->
  <rect x="150" y="84" width="7" height="112" rx="3.5" fill="#6a8aa8" ${o}/>
  <path d="M153 64 l10 22 h-20 z" fill="#cdeeff" ${o}/>
  <!-- face -->
  <ellipse cx="100" cy="92" rx="23" ry="21" fill="#dff3ff" ${o}/>
  ${eyes(100, 92, 9, 7, '#2b8fd6')}
  <!-- ice crown -->
  <path d="M78 74 l6 -20 l8 16 l8 -22 l8 22 l8 -16 l6 20 z" fill="#aee3ff" ${o}/>
  ${hi(90, 84, 11, 9)}`);

const jade_monk = () => wrap(`
  ${shadow()}
  <!-- healing rings -->
  <ellipse cx="100" cy="150" rx="58" ry="20" fill="none" stroke="#5dffa6" stroke-width="3" opacity="0.5"/>
  <!-- robe -->
  <path d="M70 120 q30 -14 60 0 l12 92 q-42 16 -84 0 z" fill="#1f8f54" ${o}/>
  <path d="M84 132 h32 l-4 12 h-24 z" fill="#46c07e"/>
  ${sh(100, 200, 42, 14)}
  <!-- staff with orb -->
  <rect x="150" y="70" width="7" height="126" rx="3.5" fill="#7a5a2b" ${o}/>
  <circle cx="153.5" cy="64" r="12" fill="#3ddc84" ${o}/>
  <circle cx="153.5" cy="64" r="5" fill="#d6ffe8"/>
  <!-- bald head -->
  <ellipse cx="100" cy="90" rx="24" ry="23" fill="#f0c98f" ${o}/>
  ${eyes(100, 90, 8, 6.5)}
  <path d="M90 102 q10 6 20 0" fill="none" stroke="#a07840" stroke-width="2.5"/>
  <circle cx="100" cy="70" r="3" fill="#3ddc84"/>
  ${hi(91, 82, 11, 8)}`);

const sea_crusher = () => wrap(`
  ${shadow()}
  <!-- water cannon arm -->
  <rect x="132" y="120" width="40" height="22" rx="11" fill="#0e6f7a" ${o}/>
  <ellipse cx="174" cy="131" rx="9" ry="13" fill="#13a3b0" ${o}/>
  <circle cx="184" cy="128" r="4" fill="#9fe8f0" opacity="0.9"/>
  <circle cx="190" cy="134" r="3" fill="#9fe8f0" opacity="0.8"/>
  <!-- legs -->
  <rect x="80" y="178" width="18" height="34" rx="7" fill="#0e6f7a" ${o}/>
  <rect x="104" y="178" width="18" height="34" rx="7" fill="#0e6f7a" ${o}/>
  <!-- shell body -->
  <path d="M64 116 q36 -16 72 0 l8 68 q-44 16 -88 0 z" fill="#138a96" ${o}/>
  <path d="M80 124 q20 -8 40 0 M76 142 q24 -8 48 0 M74 160 q26 -8 52 0" fill="none" stroke="#0c5f68" stroke-width="3"/>
  ${hi(82, 124, 16, 12)}
  <!-- head -->
  <ellipse cx="92" cy="84" rx="26" ry="24" fill="#16a3b0" ${o}/>
  <path d="M70 66 l-6 -16 l16 8 z" fill="#0e6f7a" ${o}/>
  ${eyes(92, 84, 9, 7, '#0a4f57')}
  ${hi(84, 76, 11, 9)}`);

const crystal_sage = () => wrap(`
  ${shadow()}
  <!-- crystal halo -->
  <path d="M64 70 l5 -14 l5 14 l-5 12 z" fill="#c79bff" ${o}/>
  <path d="M126 70 l5 -14 l5 14 l-5 12 z" fill="#c79bff" ${o}/>
  <path d="M100 44 l6 -16 l6 16 l-6 12 z" fill="#d9b8ff" ${o}/>
  <!-- robe -->
  <path d="M68 120 q32 -14 64 0 l14 92 q-46 16 -92 0 z" fill="#6c3fb0" ${o}/>
  <path d="M100 124 l8 88 h-16 z" fill="#9b6fd6"/>
  ${sh(100, 200, 44, 15)}
  <!-- crystal barrier at waist -->
  <path d="M70 160 l8 -16 l8 16 z" fill="#c79bff" opacity="0.85"/>
  <path d="M122 160 l8 -16 l8 16 z" fill="#c79bff" opacity="0.85"/>
  <!-- face -->
  <ellipse cx="100" cy="94" rx="23" ry="21" fill="#f0dcc0" ${o}/>
  ${eyes(100, 94, 9, 7, '#8a3fd6')}
  <!-- hood -->
  <path d="M77 84 q23 -34 46 0 q-4 -18 -23 -20 q-19 2 -23 20 z" fill="#5a2f99" ${o}/>
  ${hi(90, 86, 11, 9)}`);

const skywing = () => wrap(`
  ${shadow()}
  <!-- mechanical wings -->
  <path d="M74 104 l-58 -16 l10 30 l50 0 z" fill="#8a939c" ${o}/>
  <path d="M126 104 l58 -16 l-10 30 l-50 0 z" fill="#8a939c" ${o}/>
  <path d="M28 92 l0 22 M44 94 l0 20" stroke="#5d666f" stroke-width="3"/>
  <path d="M172 92 l0 22 M156 94 l0 20" stroke="#5d666f" stroke-width="3"/>
  <!-- legs -->
  <rect x="82" y="176" width="16" height="34" rx="7" fill="#5a3f2b" ${o}/>
  <rect x="102" y="176" width="16" height="34" rx="7" fill="#5a3f2b" ${o}/>
  <!-- bomb in hand -->
  <circle cx="150" cy="170" r="14" fill="#2f3540" ${o}/>
  <rect x="147" y="152" width="6" height="8" fill="#5d666f"/>
  <circle cx="153" cy="150" r="3" fill="#ff7a1f"/>
  <!-- jacket body -->
  <path d="M70 116 q30 -14 60 0 l8 64 q-38 14 -76 0 z" fill="#7a4a28" ${o}/>
  <path d="M100 120 v60" stroke="#5a3520" stroke-width="3"/>
  <path d="M82 122 l8 -8 M118 122 l-8 -8" stroke="#caa53d" stroke-width="3"/>
  ${sh(100, 174, 34, 13)}
  <!-- head + goggles -->
  <ellipse cx="100" cy="86" rx="25" ry="24" fill="#e8b888" ${o}/>
  <rect x="78" y="64" width="44" height="12" rx="6" fill="#3a2f28" ${o}/>
  <circle cx="90" cy="70" r="6" fill="#9fe8f0"/><circle cx="110" cy="70" r="6" fill="#9fe8f0"/>
  ${eyes(100, 92, 8, 6)}
  ${hi(91, 84, 11, 8)}`);

const volt_ranger = () => wrap(`
  ${shadow()}
  <!-- legs -->
  <rect x="82" y="176" width="16" height="36" rx="7" fill="#c79a1f" ${o}/>
  <rect x="102" y="176" width="16" height="36" rx="7" fill="#c79a1f" ${o}/>
  <!-- electric bow -->
  <path d="M40 70 q-22 60 0 120" fill="none" stroke="#caa53d" stroke-width="6" stroke-linecap="round"/>
  <path d="M40 72 l0 116" stroke="#ffe08a" stroke-width="2" stroke-dasharray="6 5"/>
  <!-- lightning arrow -->
  <path d="M44 130 l40 -6 l-8 6 l10 4 z" fill="#fff04d" ${o}/>
  <!-- body -->
  <path d="M70 116 q30 -14 60 0 l8 64 q-38 14 -76 0 z" fill="#f2c422" ${o}/>
  <path d="M86 128 l14 16 l14 -16" fill="none" stroke="#fff04d" stroke-width="4"/>
  ${sh(100, 174, 34, 13)}
  <!-- head + visor -->
  <ellipse cx="100" cy="86" rx="25" ry="24" fill="#ffd84d" ${o}/>
  <rect x="80" y="80" width="40" height="10" rx="5" fill="#3a3320"/>
  ${eyes(100, 86, 9, 6.5, '#b58a00')}
  <path d="M100 58 l6 -16 l-2 12 l8 -4 l-12 16 z" fill="#fff04d" ${o}/>
  ${hi(90, 78, 11, 8)}`);

const toxin_toad = () => wrap(`
  ${shadow()}
  <!-- splayed feet -->
  <ellipse cx="60" cy="196" rx="16" ry="9" fill="#2f8f3a" ${o}/>
  <ellipse cx="140" cy="196" rx="16" ry="9" fill="#2f8f3a" ${o}/>
  <!-- wide body -->
  <ellipse cx="100" cy="148" rx="56" ry="46" fill="#46b04a" ${o}/>
  <ellipse cx="100" cy="166" rx="38" ry="26" fill="#7ed080"/>
  <!-- warts -->
  <circle cx="68" cy="132" r="5" fill="#2f8f3a"/><circle cx="132" cy="138" r="6" fill="#2f8f3a"/>
  <circle cx="118" cy="120" r="4" fill="#2f8f3a"/>
  <!-- wide mouth + drool -->
  <path d="M70 158 q30 22 60 0" fill="none" stroke="#1f5f28" stroke-width="4" stroke-linecap="round"/>
  <path d="M84 168 q-2 14 4 18 q6 -4 2 -18" fill="#9fe04a" opacity="0.9"/>
  <!-- bulging eyes on top -->
  <circle cx="76" cy="104" r="18" fill="#46b04a" ${o}/>
  <circle cx="124" cy="104" r="18" fill="#46b04a" ${o}/>
  <circle cx="76" cy="100" r="11" fill="#ffe24d" ${o}/>
  <circle cx="124" cy="100" r="11" fill="#ffe24d" ${o}/>
  <ellipse cx="76" cy="101" rx="4" ry="7" fill="#1a1a2e"/>
  <ellipse cx="124" cy="101" rx="4" ry="7" fill="#1a1a2e"/>
  ${hi(82, 130, 18, 12)}`);

const neon_wraith = () => wrap(`
  ${shadow().replace('0.22', '0.12')}
  <!-- ghost body, wavy bottom, floating -->
  <path d="M62 120 q0 -50 38 -50 q38 0 38 50 l0 64
           q-9 10 -16 0 q-7 -10 -14 0 q-7 10 -14 0 q-7 -10 -14 0 q-7 10 -16 0 z"
        fill="#27e0d6" fill-opacity="0.78" ${o}/>
  <path d="M76 120 q0 -36 24 -36 q24 0 24 36" fill="#9bfff7" fill-opacity="0.5"/>
  <!-- wispy arms -->
  <path d="M60 132 q-22 6 -26 26" fill="none" stroke="#27e0d6" stroke-width="7" stroke-linecap="round" opacity="0.8"/>
  <path d="M140 132 q22 6 26 26" fill="none" stroke="#27e0d6" stroke-width="7" stroke-linecap="round" opacity="0.8"/>
  <!-- glowing eyes -->
  <ellipse cx="88" cy="104" rx="8" ry="11" fill="#0a3f3c"/>
  <ellipse cx="112" cy="104" rx="8" ry="11" fill="#0a3f3c"/>
  <circle cx="88" cy="102" r="4" fill="#eafffd"/><circle cx="112" cy="102" r="4" fill="#eafffd"/>
  ${hi(90, 96, 14, 12)}`);

const forge_dwarf = () => wrap(`
  ${shadow()}
  <!-- legs (stocky) -->
  <rect x="74" y="180" width="20" height="32" rx="7" fill="#6a4a2b" ${o}/>
  <rect x="106" y="180" width="20" height="32" rx="7" fill="#6a4a2b" ${o}/>
  <!-- cannon arm -->
  <rect x="130" y="128" width="44" height="24" rx="12" fill="#5d666f" ${o}/>
  <ellipse cx="176" cy="140" rx="9" ry="14" fill="#3a4048" ${o}/>
  <circle cx="176" cy="140" r="5" fill="#ff7a1f"/>
  <!-- body -->
  <path d="M64 124 q36 -16 72 0 l6 58 q-42 16 -84 0 z" fill="#b56a2b" ${o}/>
  <rect x="86" y="128" width="28" height="50" rx="6" fill="#caa53d"/>
  ${sh(100, 176, 38, 13)}
  <!-- head + helmet/goggles -->
  <ellipse cx="100" cy="92" rx="24" ry="22" fill="#f0c08f" ${o}/>
  <path d="M76 84 q24 -22 48 0 z" fill="#7a5230" ${o}/>
  <rect x="82" y="78" width="14" height="9" rx="4" fill="#9fe8f0" stroke="${OUTLINE}" stroke-width="2"/>
  <rect x="104" y="78" width="14" height="9" rx="4" fill="#9fe8f0" stroke="${OUTLINE}" stroke-width="2"/>
  <!-- big braided beard -->
  <path d="M80 100 q20 40 40 0 q-2 30 -20 34 q-18 -4 -20 -34 z" fill="#d98a3a" ${o}/>
  <circle cx="92" cy="98" r="2.5" fill="${OUTLINE}"/><circle cx="108" cy="98" r="2.5" fill="${OUTLINE}"/>
  ${hi(90, 88, 10, 7)}`);

export const CHAR_ART = {
  titan_grunt: titan_grunt(),
  pyro_drake:  pyro_drake(),
  lady_vex:    lady_vex(),
  stone_golem: stone_golem(),
  thunder_chief: thunder_chief(),
  blaze_witch:  blaze_witch(),
  wing_knight:  wing_knight(),
  frostborn:    frostborn(),
  jade_monk:    jade_monk(),
  sea_crusher:  sea_crusher(),
  crystal_sage: crystal_sage(),
  skywing:      skywing(),
  volt_ranger:  volt_ranger(),
  toxin_toad:   toxin_toad(),
  neon_wraith:  neon_wraith(),
  forge_dwarf:  forge_dwarf(),
};
