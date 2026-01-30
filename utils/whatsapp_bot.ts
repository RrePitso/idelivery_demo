
import { ref, get, push, set, update, query, orderByChild, equalTo, runTransaction } from 'firebase/database';
import { db } from '../firebase';
import { ParcelStatus, ParcelRequest } from '../types';
import { sendWhatsAppMessage, sendWelcomeTemplate, formatSAFullPhone } from './whatsapp';

/**
 * PRODUCTION BOT LOGIC
 * Handles incoming WhatsApp messages from the AiSensy Webhook.
 * 
 * Flow:
 * 1. "1" -> Start (COLLECTING_PICKUP)
 * 2. Msg -> Pickup (Set, status: COLLECTING_DROPOFF)
 * 3. Msg -> Dropoff (Set, status: COLLECTING_DESCRIPTION)
 * 4. Msg -> Description (Set, status: COLLECTING_PAYMENT)
 * 5. Msg -> Payment (Set, status: READY_FOR_DRIVER_MATCHING)
 * 6. Reply -> Confirmation
 */
export const handleIncomingBotMessage = async (phone: string, text: string) => {
  if (!phone || !text) return;
  
  const formattedPhone = formatSAFullPhone(phone);
  const messageBody = text.trim();

  // 1. Entry Command: Start a fresh request
  if (messageBody === "1") {
    return startNewRequest(formattedPhone);
  }

  // 2. State Lookup: Find the latest active collection request
  const activeRequest = await getActiveRequest(formattedPhone);
  
  if (!activeRequest) {
    // If no active flow and message isn't "1", send the welcome template (HSP start)
    return sendWelcomeTemplate(formattedPhone);
  }

  // 3. State Machine Transitions
  switch (activeRequest.status) {
    case ParcelStatus.COLLECTING_PICKUP:
      return handlePickupStep(activeRequest, messageBody);
    
    case ParcelStatus.COLLECTING_DROPOFF:
      return handleDropoffStep(activeRequest, messageBody);
    
    case ParcelStatus.COLLECTING_DESCRIPTION:
      return handleDescriptionStep(activeRequest, messageBody);

    case ParcelStatus.COLLECTING_PAYMENT:
      return handlePaymentStep(activeRequest, messageBody);
    
    default:
      // Status is READY_FOR_DRIVER_MATCHING or final - ignore input until "1" is sent
      return;
  }
};

/**
 * Requirement 1: Entry "1"
 */
async function startNewRequest(phone: string) {
  // Production Logic: Atomic cancel of existing requests to prevent multi-flow race conditions
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
    payment_method: null,
    created_at: Date.now()
  };

  await set(newRequestRef, newRequest);

  await sendWhatsAppMessage({
    destination: phone,
    userName: 'Customer',
    message: "📍 Where should we pick up the parcel from?\n\nPlease send the pickup location name or address."
  });
}

/**
 * Requirement 2: Collecting Pickup
 */
async function handlePickupStep(request: ParcelRequest & { id: string }, text: string) {
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
 * Requirement 3: Collecting Dropoff
 */
async function handleDropoffStep(request: ParcelRequest & { id: string }, text: string) {
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
 * Requirement 4: Collecting Description
 */
async function handleDescriptionStep(request: ParcelRequest & { id: string }, text: string) {
  await update(ref(db, `parcel_requests/${request.id}`), {
    parcel_description: text,
    status: ParcelStatus.COLLECTING_PAYMENT
  });

  // User Snippet Integration: Payment Choice
  await sendWhatsAppMessage({
    destination: request.customer_phone,
    userName: 'Customer',
    message: "Your parcel is ready for payment.\n\nChoose your preferred payment method to proceed:\n\n1. Cash\n2. Speedpoint\n3. PayShap\n\nReply with 1, 2, or 3."
  });
}

/**
 * Requirement 5: Collecting Payment Method
 */
async function handlePaymentStep(request: ParcelRequest & { id: string }, text: string) {
  const choice = text.trim();
  let method = '';
  
  if (choice === '1') method = 'Cash';
  else if (choice === '2') method = 'Speedpoint';
  else if (choice === '3') method = 'PayShap';
  else {
    // Invalid choice - re-ask
    return sendWhatsAppMessage({
      destination: request.customer_phone,
      userName: 'Customer',
      message: "Please select a valid option (1, 2, or 3).\n\n1. Cash\n2. Speedpoint\n3. PayShap"
    });
  }

  await update(ref(db, `parcel_requests/${request.id}`), {
    payment_method: method,
    status: ParcelStatus.READY_FOR_DRIVER_MATCHING
  });

  await sendWhatsAppMessage({
    destination: request.customer_phone,
    userName: 'Customer',
    message: `✅ Parcel request received!\n\nPayment Method: ${method}\n\nWe are looking for an available driver. You’ll be notified once a driver accepts.`
  });
}

/**
 * Efficiency Helper: Fetches only the single most recent active request for the phone number.
 */
async function getActiveRequest(phone: string): Promise<(ParcelRequest & { id: string }) | null> {
  const requestsRef = ref(db, 'parcel_requests');
  const phoneQuery = query(
    requestsRef, 
    orderByChild('customer_phone'), 
    equalTo(phone)
  );
  
  const snapshot = await get(phoneQuery);
  if (!snapshot.exists()) return null;

  const data = snapshot.val();
  const activeStatuses = [
    ParcelStatus.COLLECTING_PICKUP,
    ParcelStatus.COLLECTING_DROPOFF,
    ParcelStatus.COLLECTING_DESCRIPTION,
    ParcelStatus.COLLECTING_PAYMENT
  ];

  // We filter in-memory for status to find the active "conversation thread"
  const requests = Object.keys(data)
    .map(key => ({ ...data[key], id: key }))
    .filter(req => activeStatuses.includes(req.status))
    .sort((a, b) => b.created_at - a.created_at);

  return requests.length > 0 ? requests[0] : null;
}
