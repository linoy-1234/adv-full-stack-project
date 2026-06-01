export function RibbonBackground() {
  const c = '%237CAE8E';
  const parts = [
    `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='74' viewBox='0 0 100 74'>`,
    // Body
    `<ellipse cx='50' cy='42' rx='18' ry='12' fill='${c}'/>`,
    // Left claw arm
    `<path d='M33 36 C24 30 17 23 14 16' stroke='${c}' stroke-width='4' stroke-linecap='round' fill='none'/>`,
    // Left claw
    `<ellipse cx='10' cy='12' rx='9' ry='6' fill='${c}'/>`,
    // Right claw arm
    `<path d='M67 36 C76 30 83 23 86 16' stroke='${c}' stroke-width='4' stroke-linecap='round' fill='none'/>`,
    // Right claw
    `<ellipse cx='90' cy='12' rx='9' ry='6' fill='${c}'/>`,
    // Left legs
    `<path d='M36 50 L25 64' stroke='${c}' stroke-width='2.5' stroke-linecap='round' fill='none'/>`,
    `<path d='M42 53 L33 67' stroke='${c}' stroke-width='2.5' stroke-linecap='round' fill='none'/>`,
    `<path d='M48 55 L41 70' stroke='${c}' stroke-width='2.5' stroke-linecap='round' fill='none'/>`,
    // Right legs
    `<path d='M64 50 L75 64' stroke='${c}' stroke-width='2.5' stroke-linecap='round' fill='none'/>`,
    `<path d='M58 53 L67 67' stroke='${c}' stroke-width='2.5' stroke-linecap='round' fill='none'/>`,
    `<path d='M52 55 L59 70' stroke='${c}' stroke-width='2.5' stroke-linecap='round' fill='none'/>`,
    // Eye stalks
    `<path d='M44 31 L42 21' stroke='${c}' stroke-width='2' stroke-linecap='round' fill='none'/>`,
    `<path d='M56 31 L58 21' stroke='${c}' stroke-width='2' stroke-linecap='round' fill='none'/>`,
    // Eyes
    `<circle cx='41' cy='18' r='4' fill='${c}'/>`,
    `<circle cx='59' cy='18' r='4' fill='${c}'/>`,
    `</svg>`,
  ];

  const svgDataUri = `data:image/svg+xml,${parts.join('')}`;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `url("${svgDataUri}")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '100px 74px',
        opacity: 0.09,
        pointerEvents: 'none',
        zIndex: 0,
        WebkitMaskImage: 'radial-gradient(ellipse 62% 56% at 50% 50%, transparent 48%, black 82%)',
        maskImage: 'radial-gradient(ellipse 62% 56% at 50% 50%, transparent 48%, black 82%)',
      }}
    />
  );
}
