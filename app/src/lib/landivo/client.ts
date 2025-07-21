class LandivoClient {
  private baseURL: string;

  constructor() {
    // Add fallback and ensure env var is properly typed
    this.baseURL = process.env.NEXT_PUBLIC_LANDIVO_API_URL || 'http://localhost:8200';
  }

  async getProperty(id: string): Promise<any> {
    try {
      // Fix API route to match your backend
      const response = await fetch(`${this.baseURL}/residency/${id}`, {
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

  async getPropertyBuyers(propertyId: string): Promise<any[]> {
    try {
      // Update to match your backend structure  
      const response = await fetch(`${this.baseURL}/buyer/property/${propertyId}`);
      if (!response.ok) throw new Error('Failed to fetch buyers');
      return await response.json();
    } catch (error) {
      console.error('Error fetching buyers:', error);
      return [];
    }
  }
}

export const landivoClient = new LandivoClient();
export default landivoClient;