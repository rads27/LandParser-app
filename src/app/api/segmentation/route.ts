import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { state, city, taluka, plotNo } = await request.json();

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock coordinates for the plot
    const mockCoordinates = {
      type: "Polygon",
      coordinates: [[[73.8567, 18.5204], [73.8577, 18.5204], [73.8577, 18.5214], [73.8567, 18.5214], [73.8567, 18.5204]]]
    };

    // Mock land information
    const landInfo = {
      predictedPrice: "₹ 45,00,000",
      owner: "Ramesh Kumar",
      landType: "Agricultural",
      soilType: "Black Cotton Soil",
      area: "2.5 Acres",
      coordinates: mockCoordinates
    };

    return NextResponse.json({
      success: true,
      data: landInfo
    });
  } catch (error) {
    console.error('Segmentation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}