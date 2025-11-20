export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface DiscoveryContent {
  placeName: string;
  animalName: string;
  description: string; // Simple text for kids
  funFact: string;
  imageUri: string; // Data URI
  audioData?: string; // Base64 PCM data
}

export enum AppState {
  IDLE = 'IDLE',
  THINKING = 'THINKING', // Generating content
  SHOWING_RESULT = 'SHOWING_RESULT',
  ERROR = 'ERROR'
}

// The raw JSON response from the text model
export interface DiscoveryTextResponse {
  placeName: string;
  animalName: string;
  description: string;
  funFact: string;
}
