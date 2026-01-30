
export type TransportType = 'bike' | 'motorcycle' | 'car';

export enum DriverStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE'
}

export enum ParcelStatus {
  COLLECTING_PICKUP = 'COLLECTING_PICKUP',
  COLLECTING_DROPOFF = 'COLLECTING_DROPOFF',
  COLLECTING_DESCRIPTION = 'COLLECTING_DESCRIPTION',
  COLLECTING_PAYMENT = 'COLLECTING_PAYMENT',
  READY_FOR_DRIVER_MATCHING = 'READY_FOR_DRIVER_MATCHING',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface ParcelRequest {
  id?: string;
  customer_phone: string;
  status: ParcelStatus;
  pickup_location: string | null;
  dropoff_location: string | null;
  parcel_description: string | null;
  payment_method: string | null;
  created_at: number;
}

export interface PaymentMethodConfig {
  enabled: boolean;
  cost: number;
  phone_number?: string;
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
  whatsapp_opt_in: boolean;
  whatsapp_opt_in_at: number;
  whatsapp_events: {
    signup_confirmation?: boolean;
    [key: string]: boolean | undefined;
  };
  base_delivery_fee: number;
  payment_methods: {
    cash: PaymentMethodConfig;
    speedpoint: PaymentMethodConfig;
    payshap: PaymentMethodConfig;
  };
}

export interface AuthState {
  user: any | null;
  loading: boolean;
  driverProfile: DriverProfile | null;
}
