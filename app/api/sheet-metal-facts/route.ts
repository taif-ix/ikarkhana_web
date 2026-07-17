import { NextResponse } from 'next/server';

const LOCAL_FACTS = [
  'Sheet metal thickness is commonly called gauge, but gauge values are not linear and vary by material standard.',
  'Bend allowance helps estimate the flat length consumed by a bend before forming.',
  'Minimum bend radius is often linked to material thickness, ductility, grain direction, and tooling radius.',
  'Laser cutting cost usually depends on total cut length, pierce count, material thickness, and assist gas.',
  'Nesting tries to arrange parts on stock sheets to reduce scrap and improve material yield.',
  'For round holes, cutting length is calculated from circumference: pi x diameter.',
  'For rectangular blanks, perimeter cutting length is commonly estimated as 2 x (length + width).',
  'Stainless steel has higher density than aluminium, so the same geometry weighs much more in stainless steel.',
  'Press punching can be cheaper than laser cutting when repeated holes or simple features are suitable for tooling.',
  'Welding cost often depends on weld length, joint type, accessibility, and required finish quality.',
];

function pickFacts(count = 5) {
  return [...LOCAL_FACTS].sort(() => Math.random() - 0.5).slice(0, count);
}

export async function GET() {
  try {
    const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', {
      next: { revalidate: 3600 },
    });
    const payload = await response.json();
    const publicFact = typeof payload.text === 'string' ? payload.text : '';

    return NextResponse.json({
      success: true,
      source: publicFact ? 'free_public_api_with_sheet_metal_fallback' : 'local_sheet_metal_fallback',
      facts: publicFact ? [publicFact, ...pickFacts(4)] : pickFacts(5),
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'local_sheet_metal_fallback',
      facts: pickFacts(5),
    });
  }
}
