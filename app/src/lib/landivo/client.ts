class LandivoClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_LANDIVO_API_URL || 'http://localhost:8200';
  }

  async getProperty(id: string) {
    try {
      const response = await fetch(`${this.baseURL}/api/properties/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Property not found: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  }

  async getPropertyBuyers(propertyId: string) {
    try {
      const response = await fetch(`${this.baseURL}/api/properties/${propertyId}/buyers`);
      if (!response.ok) throw new Error('Failed to fetch buyers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching buyers:', error);
      return [];
    }
  }
}

export const landivoClient = new LandivoClient();