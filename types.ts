
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
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  ARRIVED_AT_DROPOFF = 'ARRIVED_AT_DROPOFF',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export interface SavedLocation {
  id: string;
  label: string;
  address: string;
}

export interface ParcelRequest {
  id?: string;
  customer_phone: string;
  customer_name?: string;
  customer_id?: string;
  customer_email?: string;
  status: ParcelStatus;
  pickup_location: string | null;
  dropoff_location: string | null;
  parcel_description: string | null;
  quantity?: number;
  payment_method: string | null;
  payment_surcharge?: number;
  created_at: number;
  assigned_driver_id?: string;
  delivery_fee?: number;
  cost_of_goods?: number;
  final_total?: number;
}

export interface PaymentMethodConfig {
  enabled: boolean;
  cost: number;
  phone_number?: string;
}

export interface CustomerProfile {
  uid: string;
  full_name: string;
  email: string;
  phone_number: string;
  saved_locations?: SavedLocation[];
  created_at: number;
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
    [key: string]: PaymentMethodConfig | any;
  };
  rating: number;
  total_earnings: number;
}

export interface AuthState {
  user: any | null;
  loading: boolean;
  driverProfile: DriverProfile | null;
  customerProfile: CustomerProfile | null;
  userType: 'driver' | 'customer' | 'admin' | null;
}
