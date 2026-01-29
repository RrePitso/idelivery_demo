
/**
 * Utility for sending WhatsApp notifications using AiSensy API
 */

const AISENSY_API_URL = 'https://backend.aisensy.com/campaign/t1/api/v2';
const AISENSY_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NzYzNmQ2MjM3MDVhMjk2OTE2ZDQwNyIsIm5hbWUiOiJpRGVsaXZlcnkiLCJhcHBOYW1lIjoiQWlTZW5zeSIsImNsaWVudElkIjoiNjk3NjM2ZDYyMzcwNWEyOTY5MTZkNDAyIiwiYWN0aXZlUGxhbiI6IkZSRUVfRk9SRVZFUiIsImlhdCI6MTc2OTY0NDI2NH0.H1B97yJErpBN61t8_K8c4PlDqTA9hBm6qOqYJFlUAJw';

export interface WhatsAppPayload {
  destination: string;
  userName: string;
  templateParams?: string[];
  message?: string; // For session messages
}

export const formatSAFullPhone = (phone: string): string => {
  let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '').trim();
  if (cleaned.startsWith('0') && cleaned.length === 10) return '+27' + cleaned.substring(1);
  if (cleaned.startsWith('27') && cleaned.length === 11) return '+' + cleaned;
  if (phone.trim().startsWith('+')) return phone.trim();
  if (cleaned.length === 9) return '+27' + cleaned;
  return phone.trim().startsWith('+') ? phone.trim() : `+${cleaned}`;
};

/**
 * Sends a WhatsApp message. If 'message' is provided, it sends a raw session message.
 * If 'templateParams' is provided, it sends a template message.
 */
export const sendWhatsAppMessage = async ({
  destination,
  userName,
  templateParams,
  message,
}: WhatsAppPayload) => {
  if (!destination) return;

  const formattedDestination = formatSAFullPhone(destination);
  
  // Construct payload based on whether it's a template or session message
  const payload: any = {
    apiKey: AISENSY_API_KEY,
    destination: formattedDestination,
    userName: userName,
  };

  if (message) {
    // Session Message Logic (Standard text)
    // Note: AiSensy often uses 'campaignName' even for session messages if set up that way, 
    // but typically raw messages use the 'message' object.
    payload.campaignName = 'Session Message'; 
    payload.message = {
      type: 'text',
      text: message
    };
  } else if (templateParams) {
    // Template Message Logic
    payload.campaignName = 'Test Campain';
    payload.templateParams = templateParams;
  }

  try {
    const response = await fetch(AISENSY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error('WhatsApp Error:', error);
    return null;
  }
};

// Keeping original for backward compatibility with existing files
export const sendWhatsAppSignupNotification = (data: WhatsAppPayload) => sendWhatsAppMessage(data);
