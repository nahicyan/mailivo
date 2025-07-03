export interface LandivoProperty {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lotSize?: number;
  };
  images: string[];
  status: 'active' | 'sold' | 'pending';
  agent: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LandivoBuyer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  preferences: {
    priceRange: {
      min: number;
      max: number;
    };
    location: string[];
    bedrooms: number;
    bathrooms: number;
  };
  isQualified: boolean;
}