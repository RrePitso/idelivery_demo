
import emailjs from '@emailjs/browser';

/**
 * iDelivery EmailJS Configuration
 * IMPORTANT: You must create an account at emailjs.com and replace these
 * with your actual Service ID, Template IDs, and Public Key.
 */
const EMAILJS_SERVICE_ID = 'service_idelivery'; // Replace with your Service ID
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY_HERE'; // Replace with your Public Key
const CUSTOMER_ARRIVED_TEMPLATE_ID = 'template_driver_arrived'; // Replace with your Template ID

// Initialize EmailJS
if (EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY_HERE') {
  emailjs.init(EMAILJS_PUBLIC_KEY);
}

export const sendArrivedNotificationEmail = async (orderDetails: any) => {
  console.log('📧 Attempting to send arrival email to:', orderDetails.to_email);
  
  if (!orderDetails.to_email) {
    console.error('❌ Cannot send email: Customer email is missing in order details.');
    return;
  }

  if (EMAILJS_PUBLIC_KEY === 'YOUR_PUBLIC_KEY_HERE') {
    console.warn('⚠️ EmailJS is not configured. Please set your Public Key in utils/email.ts');
    return;
  }

  try {
    const templateParams = {
      to_name: orderDetails.customer_name || 'Customer',
      to_email: orderDetails.to_email,
      order_id: orderDetails.order_id,
      dropoff: orderDetails.dropoff_location || 'Your delivery address',
      parcel_description: orderDetails.parcel_description || 'Your parcel',
      final_total: orderDetails.final_total ? `R${orderDetails.final_total.toFixed(2)}` : 'N/A'
    };

    console.debug('📤 EmailJS Payload:', templateParams);

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      CUSTOMER_ARRIVED_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log('✅ Email sent successfully:', result.status, result.text);
    return result;
  } catch (error) {
    console.error('❌ Failed to send arrival email:', error);
    // Return error so the UI can handle it if needed
    throw error;
  }
};

// Placeholder for other notifications if needed in future
export const sendOrderConfirmationEmail = async (orderDetails: any) => {
  console.log('Order confirmation email logic here');
};
