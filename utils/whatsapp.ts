
/**
 * Utility for sending WhatsApp notifications using AiSensy API
 * Optimized based on successful CURL implementation for the iDelivery platform.
 */

const AISENSY_API_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';
const AISENSY_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NzYzNmQ2MjM3MDVhMjk2OTE2ZDQwNyIsIm5hbWUiOiJpRGVsaXZlcnkiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjk3NjM2ZDYyMzcwNWEyOTY5MTZkNDAyIiwiYWN0aXZlUGxhbiI6IkZSRUVfRk9SRVZFUiIsImlhdCI6MTc2OTY0NDI2NH0.H1B97yJErpBN61t8_K8c4PlDqTA9hBm6qOqYJFlUAJw';

export interface WhatsAppPayload {
  destination: string;
  userName: string;
  templateParams?: string[];
  message?: string; 
  campaignName?: string; 
  source?: string;
}

/**
 * Normalizes phone numbers to digits-only format as required by AiSensy (e.g., 27XXXXXXXXX)
 */
export const formatSAFullPhone = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '').trim();
  
  // South Africa specific formatting for 10-digit local numbers
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '27' + cleaned.substring(1);
  }
  // Already has country code
  if (cleaned.startsWith('27') && (cleaned.length === 11 || cleaned.length === 12)) {
    return cleaned;
  }
  // Short format (9 digits)
  if (cleaned.length === 9) {
    return '27' + cleaned;
  }
  
  return cleaned;
};

/**
 * Core function to send WhatsApp messages via AiSensy.
 * Strictly follows the working implementation provided.
 */
export const sendWhatsAppMessage = async ({
  destination,
  userName,
  templateParams = [],
  message,
  campaignName,
  source = 'new-landing-page form',
}: WhatsAppPayload) => {
  if (!destination) {
    console.warn('WhatsApp Warning: No destination phone number provided.');
    return null;
  }

  const formattedDestination = formatSAFullPhone(destination);
  
  const payload: any = {
    apiKey: AISENSY_API_KEY,
    destination: formattedDestination,
    userName: userName || 'iDelivery',
    templateParams: templateParams,
    source: source,
    media: {},
    buttons: [],
    carouselCards: [],
    location: {},
    attributes: {},
    paramsFallbackValue: {}
  };

  if (message) {
    // If a raw message is provided, we treat it as a session message logic
    // but the iDelivery preference is to use templates for reliability.
    payload.campaignName = campaignName || 'Session_Message'; 
    payload.message = {
      type: 'text',
      text: message
    };
  } else {
    // Template Message (Preferred)
    payload.campaignName = campaignName || 'driver_welcome';
  }

  try {
    const response = await fetch(AISENSY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    console.debug('AiSensy API Response:', result);
    return result;
  } catch (error) {
    console.error('Network Error calling AiSensy:', error);
    return null;
  }
};

/**
 * Triggers the "driver_welcome" template campaign after successful signup.
 */
export const sendDriverWelcomeCampaign = async (phone: string) => {
  return sendWhatsAppMessage({
    destination: phone,
    userName: 'iDelivery',
    campaignName: 'driver_welcome',
    templateParams: [],
    source: 'new-landing-page form'
  });
};

/**
 * Standard welcome for customers.
 */
export const sendWelcomeTemplate = async (phone: string) => {
  return sendWhatsAppMessage({
    destination: phone,
    userName: 'Customer',
    campaignName: 'welcome_idelivery',
    templateParams: [],
    source: 'bot-simulator'
  });
};

export const sendWhatsAppSignupNotification = (data: WhatsAppPayload) => sendWhatsAppMessage(data);
