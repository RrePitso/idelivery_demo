
import { ref, get, push, set, update, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../firebase';
import { ParcelStatus, ParcelRequest } from '../types';
import { sendWhatsAppMessage, formatSAFullPhone } from './whatsapp';

/**
 * Core Bot Logic: Processes an incoming WhatsApp message and updates the Firebase state.
 * This function should be called whenever the AiSensy webhook receives a message.
 */
export const handleIncomingBotMessage = async (phone: string, text: string) => {
  const formattedPhone = formatSAFullPhone(phone);
  const messageBody = text.trim();

  // 1. Check for the entry keyword "1"
  if (messageBody === "1") {
    return startNewRequest(formattedPhone);
  }

  // 2. Find the active request for this phone number
  const activeRequest = await getActiveRequest(formattedPhone);
  
  if (!activeRequest) {
    // If no active request and message isn't "1", we ignore or send a greeting
    // (Requirements say ignore unrelated messages while a request is in progress, 
    // but implies we ignore messages if no request is started yet except for "1")
    return;
  }

  // 3. Process based on current status
  switch (activeRequest.status) {
    case ParcelStatus.COLLECTING_PICKUP:
      return handlePickupStep(activeRequest, messageBody);
    
    case ParcelStatus.COLLECTING_DROPOFF:
      return handleDropoffStep(activeRequest, messageBody);
    
    case ParcelStatus.COLLECTING_DESCRIPTION:
      return handleDescriptionStep(activeRequest, messageBody);
    
    default:
      // Status is READY_FOR_DRIVER_MATCHING or other - ignore further input
      return;
  }
};

/**
 * Starts a new parcel request, overriding any existing active ones.
 */
async function startNewRequest(phone: string) {
  // Cancel any existing active requests first (optional but safer)
  const active = await getActiveRequest(phone);
  if (active && active.id) {
    await update(ref(db, `parcel_requests/${active.id}`), { status: ParcelStatus.CANCELLED });
  }

  const newRequestRef = push(ref(db, 'parcel_requests'));
  const newRequest: ParcelRequest = {
    customer_phone: phone,
    status: ParcelStatus.COLLECTING_PICKUP,
    pickup_location: null,
    dropoff_location: null,
    parcel_description: null,
    created_at: Date.now()
  };

  await set(newRequestRef, newRequest);

  await sendWhatsAppMessage({
    destination: phone,
    userName: 'Customer',
    message: "📍 Where should we pick up the parcel from?\n\nPlease send the pickup location."
  });
}

/**
 * Handles the pickup location input
 */
async function handlePickupStep(request: ParcelRequest, text: string) {
  await update(ref(db, `parcel_requests/${request.id}`), {
    pickup_location: text,
    status: ParcelStatus.COLLECTING_DROPOFF
  });

  await sendWhatsAppMessage({
    destination: request.customer_phone,
    userName: 'Customer',
    message: "📍 Where should the parcel be delivered to?\n\nPlease send the dropoff location."
  });
}

/**
 * Handles the dropoff location input
 */
async function handleDropoffStep(request: ParcelRequest, text: string) {
  await update(ref(db, `parcel_requests/${request.id}`), {
    dropoff_location: text,
    status: ParcelStatus.COLLECTING_DESCRIPTION
  });

  await sendWhatsAppMessage({
    destination: request.customer_phone,
    userName: 'Customer',
    message: "📦 What is being collected?\n\nPlease briefly describe the parcel."
  });
}

/**
 * Handles the parcel description input (Final Step)
 */
async function handleDescriptionStep(request: ParcelRequest, text: string) {
  await update(ref(db, `parcel_requests/${request.id}`), {
    parcel_description: text,
    status: ParcelStatus.READY_FOR_DRIVER_MATCHING
  });

  await sendWhatsAppMessage({
    destination: request.customer_phone,
    userName: 'Customer',
    message: "✅ Parcel request received!\n\nWe are looking for an available driver.\nYou’ll be notified once a driver accepts."
  });
}

/**
 * Helper to get the most recent non-finalized request for a phone number
 */
async function getActiveRequest(phone: string): Promise<(ParcelRequest & { id: string }) | null> {
  const requestsRef = ref(db, 'parcel_requests');
  // We filter by phone and then manually check for active statuses
  const phoneQuery = query(requestsRef, orderByChild('customer_phone'), equalTo(phone));
  const snapshot = await get(phoneQuery);
  
  if (!snapshot.exists()) return null;

  const data = snapshot.val();
  const activeStatuses = [
    ParcelStatus.COLLECTING_PICKUP,
    ParcelStatus.COLLECTING_DROPOFF,
    ParcelStatus.COLLECTING_DESCRIPTION
  ];

  // Get the most recent one that is in an active collection state
  const requests = Object.keys(data)
    .map(key => ({ ...data[key], id: key }))
    .filter(req => activeStatuses.includes(req.status))
    .sort((a, b) => b.created_at - a.created_at);

  return requests.length > 0 ? requests[0] : null;
}
