
/**
 * Utility for sending WhatsApp notifications using AiSensy API
 */

const AISENSY_API_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';
const AISENSY_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NzYzNmQ2MjM3MDVhMjk2OTE2ZDQwNyIsIm5hbWUiOiJpRGVsaXZlcnkiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjk3NjM2ZDYyMzcwNWEyOTY5MTZkNDAyIiwiYWN0aXZlUGxhbiI6IkZSRUVfRk9SRVZFUiIsImlhdCI6MTc2OTY0NDI2NH0.H1B97yJErpBN61t8_K8c4PlDqTA9hBm6qOqYJFlUAJw';

export interface WhatsAppPayload {
  destination: string;
  userName: string;
  templateParams?: string[];
  message?: string; 
  campaignName?: string; 
}

/**
 * Normalizes phone numbers to E.164 format (+27XXXXXXXXX)
 */
export const formatSAFullPhone = (phone: string): string => {
  if (!phone) return '';
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '').trim();
  
  // South Africa specific formatting
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '+27' + cleaned.substring(1);
  }
  if (cleaned.startsWith('27') && cleaned.length === 11) {
    return '+' + cleaned;
  }
  if (cleaned.length === 9) {
    return '+27' + cleaned;
  }
  
  // Fallback
  return phone.startsWith('+') ? phone : `+${cleaned}`;
};

/**
 * Sends a WhatsApp message via AiSensy.
 */
export const sendWhatsAppMessage = async ({
  destination,
  userName,
  templateParams,
  message,
  campaignName,
}: WhatsAppPayload) => {
  if (!destination) {
    console.error('WhatsApp Error: No destination phone number provided.');
    return null;
  }

  const formattedDestination = formatSAFullPhone(destination);
  
  const payload: any = {
    apiKey: AISENSY_API_KEY,
    destination: formattedDestination,
    userName: userName || 'Customer',
  };

  if (message) {
    // Session Message (Standard text response)
    // Production Note: We use a generic campaign for all session messages
    payload.campaignName = campaignName || 'Session_Message'; 
    payload.message = {
      type: 'text',
      text: message
    };
  } else {
    // Template Message (High reliability start of conversation)
    payload.campaignName = campaignName || 'welcome_idelivery';
    payload.templateParams = templateParams || [];
  }

  try {
    const response = await fetch(AISENSY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    if (!response.ok || result.status === 'error') {
      console.error('AiSensy API Error:', result);
    }
    return result;
  } catch (error) {
    console.error('Network Error calling AiSensy:', error);
    return null;
  }
};

/**
 * High-reliability Welcome message using approved template.
 */
export const sendWelcomeTemplate = async (phone: string) => {
  return sendWhatsAppMessage({
    destination: phone,
    userName: 'Customer',
    campaignName: 'welcome_idelivery',
    templateParams: [] 
  });
};

export const sendWhatsAppSignupNotification = (data: WhatsAppPayload) => sendWhatsAppMessage(data);
