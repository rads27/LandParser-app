// Mock API functions for LandParser app
// These simulate real API calls with delays and return demo data

export interface LoginResponse {
  success: boolean;
  user?: {
    id: number;
    email: string;
    role: 'user' | 'admin';
    name: string;
  };
  token?: string;
  error?: string;
}

export interface SegmentationData {
  predictedPrice: string;
  owner: string;
  landType: string;
  soilType: string;
  area: string;
  coordinates: {
    type: string;
    coordinates: number[][][];
  };
}

export interface EncroachmentRequest {
  id: number;
  userEmail: string;
  fileName: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface SubmissionHistory {
  id: number;
  fileName: string;
  status: string;
}

// Mock login function
export const mockLogin = async (email: string, password: string): Promise<LoginResponse> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Demo credentials
  if (email === 'user@example.com') {
    return {
      success: true,
      user: {
        id: 1,
        email: 'user@example.com',
        role: 'user',
        name: 'John Doe',
      },
      token: 'mock-jwt-token-user',
    };
  }

  if (email === 'admin@example.com') {
    return {
      success: true,
      user: {
        id: 2,
        email: 'admin@example.com',
        role: 'admin',
        name: 'Admin User',
      },
      token: 'mock-jwt-token-admin',
    };
  }

  return {
    success: false,
    error: 'Invalid credentials',
  };
};

// Mock segmentation data function
export const getSegmentationData = async (formData: {
  state: string;
  city: string;
  taluka: string;
  plotNo: string;
}): Promise<SegmentationData> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generate mock coordinates based on input
  const baseCoords = [73.8567, 18.5204]; // Pune coordinates
  const offset = 0.001;
  
  const coordinates = [
    [
      [baseCoords[0], baseCoords[1]], // SW corner
      [baseCoords[0] + offset, baseCoords[1]], // SE corner
      [baseCoords[0] + offset, baseCoords[1] + offset], // NE corner
      [baseCoords[0], baseCoords[1] + offset], // NW corner
      [baseCoords[0], baseCoords[1]], // Close the polygon
    ]
  ];

  return {
    predictedPrice: "₹ 45,00,000",
    owner: "Ramesh Kumar",
    landType: "Agricultural",
    soilType: "Black Cotton Soil",
    area: "2.5 Acres",
    coordinates: {
      type: "Polygon",
      coordinates: coordinates,
    },
  };
};

// Mock encroachment submission function
export const submitEncroachmentRequest = async (file: File): Promise<{ success: boolean; message: string }> => {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    success: true,
    message: 'File submitted successfully for review',
  };
};

// Mock function to get admin requests
export const getAdminRequests = async (): Promise<EncroachmentRequest[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return [
    {
      id: 1,
      userEmail: 'user@example.com',
      fileName: 'plot_image_1.jpg',
      imageUrl: '/images/placeholder-land.svg',
      status: 'pending',
    },
    {
      id: 2,
      userEmail: 'john.doe@email.com',
      fileName: 'boundary_survey.png',
      imageUrl: '/images/placeholder-land.svg',
      status: 'pending',
    },
    {
      id: 3,
      userEmail: 'farmer@example.com',
      fileName: 'land_documentation.jpg',
      imageUrl: '/images/placeholder-land.svg',
      status: 'pending',
    },
  ];
};

// Mock function to get user submission history
export const getUserSubmissions = async (): Promise<SubmissionHistory[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  return [
    { id: 1, fileName: 'plot_image_1.jpg', status: 'Pending' },
    { id: 2, fileName: 'old_land_photo.png', status: 'Approved (Encroachment Detected)' },
    { id: 3, fileName: 'boundary_pic.jpg', status: 'Rejected' },
  ];
};

export default {
  mockLogin,
  getSegmentationData,
  submitEncroachmentRequest,
  getAdminRequests,
  getUserSubmissions,
};