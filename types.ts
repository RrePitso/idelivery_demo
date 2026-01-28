
export type TransportType = 'bike' | 'motorcycle' | 'car';

export enum DriverStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE'
}

export interface DriverProfile {
  uid: string;
  full_name: string;
  email: string;
  phone_number: string;
  area: string;
  transport_type: TransportType;
  status: DriverStatus;
  active_jobs: number;
  max_jobs: number;
  created_at: number;
}

export interface AuthState {
  user: any | null;
  loading: boolean;
  driverProfile: DriverProfile | null;
}
