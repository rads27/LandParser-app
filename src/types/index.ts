export interface User {
  id: number;
  email: string;
  role: 'user' | 'admin';
  name: string;
}

export interface LandPlot {
  id: number;
  state: string;
  city: string;
  taluka: string;
  plotNo: string;
  coordinates: {
    type: string;
    coordinates: number[][][];
  };
  predictedPrice: string;
  owner: string;
  landType: string;
  soilType: string;
  area: string;
}

export interface EncroachmentRequest {
  id: number;
  userEmail: string;
  fileName: string;
  imageUrl: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  complaintDetails?: {
    areaName: string;
    plotName: string;
    plotNumber: string;
    comments: string;
    latitude: string;
    longitude: string;
    contactName: string;
    contactPhone: string;
    address: string;
    propertyType: string;
    estimatedArea: string;
  };
}

export interface SubmissionHistory {
  id: number;
  submittedAt: string;
  fileName: string;
  status: string;
  processedAt?: string;
  adminNotes?: string;
  complaintDetails?: {
    areaName: string;
    plotName: string;
    plotNumber: string;
    comments: string;
    latitude: string;
    longitude: string;
    contactName: string;
    contactPhone: string;
    address: string;
    propertyType: string;
    estimatedArea: string;
  };
  fileData?: string;
  fileType?: string;
}