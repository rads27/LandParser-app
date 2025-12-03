import { NextResponse } from 'next/server';

function parseNumber(value: any) {
  if (value === undefined || value === null) return null;
  const n = Number(String(value));
  if (Number.isFinite(n)) return n;
  return null;
}

function areaToSqM(area: number, unit: string) {
  if (!area) return 0;
  switch (unit) {
    case 'sq.m': return area;
    case 'm2': return area; // accept m2 (m²) as unit
    case 'm^2': return area;
    case 'm²': return area;
    case 'hectares': return area * 10000;
    case 'acres': return area * 4046.85642;
    default: return area;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const city = formData.get('city')?.toString() || '';
    const taluka = formData.get('taluka')?.toString() || '';
    const village = formData.get('village')?.toString() || '';
    const plotNo = formData.get('plotNo')?.toString() || '';
    const surveyNo = formData.get('surveyNo')?.toString() || '';
    const areaSize = parseNumber(formData.get('areaSize')) || 0;
    const areaUnit = formData.get('areaUnit')?.toString() || 'sq.m';
    const latitude = parseNumber(formData.get('latitude'));
    const longitude = parseNumber(formData.get('longitude'));
    const pinCode = formData.get('pinCode')?.toString() || '';
    const cadastralId = formData.get('cadastralId')?.toString() || '';

    // Optional uploaded image
    const file = formData.get('imageFile') as File | null;
    let imageDataUrl: string | null = null;
    if (file && typeof file.arrayBuffer === 'function') {
      const buffer = Buffer.from(await file.arrayBuffer());
      const b64 = buffer.toString('base64');
      imageDataUrl = `data:${file.type};base64,${b64}`;
    }

    const area_m2 = areaToSqM(areaSize, areaUnit);

    // Create a simple SVG segmentation overlay (demo)
    const canvasSize = 512;
    // size proportional to sqrt(area)
    const scale = Math.max(20, Math.min(220, Math.sqrt(area_m2) / 5));
    const rx = Math.round(scale);
    const ry = Math.round(scale * 0.7);

    const svgParts: string[] = [];
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}">`);
    if (imageDataUrl) {
      svgParts.push(`<image href="${imageDataUrl}" x="0" y="0" width="${canvasSize}" height="${canvasSize}" preserveAspectRatio="xMidYMid slice"/>`);
    } else {
      // background placeholder
      svgParts.push(`<rect x="0" y="0" width="${canvasSize}" height="${canvasSize}" fill="#e9eefc"/>`);
    }

    svgParts.push(`<ellipse cx="${canvasSize/2}" cy="${canvasSize/2}" rx="${rx}" ry="${ry}" fill="rgba(255,0,0,0.25)" stroke="#ff0000" stroke-width="4"/>`);
    svgParts.push(`<text x="16" y="24" font-size="14" fill="#222">${village} ${plotNo}</text>`);
    svgParts.push(`</svg>`);

    const svg = svgParts.join('');
    const svgB64 = Buffer.from(svg).toString('base64');
    const segmentationDataUrl = `data:image/svg+xml;base64,${svgB64}`;

    // Create a naive GeoJSON polygon around lat/lon if provided (square)
    let maskGeoJSON = null;
    if (latitude !== null && longitude !== null) {
      // compute approximate degree delta from meters (sqrt area -> side length)
      const sideMeters = Math.sqrt(area_m2 || 100);
      const deltaDeg = (sideMeters / 2) / 111000; // approx
      const d = deltaDeg;
      maskGeoJSON = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [longitude - d, latitude - d],
            [longitude + d, latitude - d],
            [longitude + d, latitude + d],
            [longitude - d, latitude + d],
            [longitude - d, latitude - d]
          ]]
        }
      };
    }

    // Simple feature extraction placeholders
    const features: any = {
      area_m2: area_m2,
      ndvi_mean: null,
      distance_to_road_m: null,
    };

    // simple price prediction: placeholder
    const baseRatePerSqM = 10; // placeholder
    const predictedPrice = Math.round(area_m2 * baseRatePerSqM);

    const result = {
      segmentationImage: segmentationDataUrl,
      maskGeoJSON,
      features,
      predictedPrice,
      owner: null,
      landType: null,
      soilType: null,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('Segmentation API error:', err);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}