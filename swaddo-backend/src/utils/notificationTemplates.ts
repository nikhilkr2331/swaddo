/**
 * Professional Notification Templates for SwaDDo (Zomato/Swiggy style)
 */

export interface NotificationPayload {
  title: string;
  body: string;
  data: Record<string, string>;
}

export const getCustomerOrderNotification = (status: string, orderId: string, extraData: any = {}): NotificationPayload | null => {
  const stallName = extraData.stallName || 'the merchant';
  const riderName = extraData.riderName || 'your delivery partner';

  switch (status) {
    case 'placed':
      return {
        title: 'Order Received! 🛎️',
        body: `We've received your order. Waiting for ${stallName} to confirm.`,
        data: { type: 'order_update', orderId: orderId.toString(), click_action: `/track?orderId=${orderId}` }
      };
    case 'accepted':
      return {
        title: 'Order Confirmed! 🍲',
        body: `Yay! ${stallName} has accepted your order and is preparing it now.`,
        data: { type: 'order_update', orderId: orderId.toString(), click_action: `/track?orderId=${orderId}` }
      };
    case 'preparing':
      return {
        title: 'Food is in the making! 👨‍🍳',
        body: `Your delicious food is being prepared by ${stallName}.`,
        data: { type: 'order_update', orderId: orderId.toString(), click_action: `/track?orderId=${orderId}` }
      };
    case 'ready':
      return {
        title: 'Food is Ready! 🍱',
        body: `Your order is packed and ready for pickup!`,
        data: { type: 'order_update', orderId: orderId.toString(), click_action: `/track?orderId=${orderId}` }
      };
    case 'assigned':
      return {
        title: 'Delivery Partner Assigned! 🛵',
        body: `${riderName} is on the way to pick up your order.`,
        data: { type: 'order_update', orderId: orderId.toString(), click_action: `/track?orderId=${orderId}` }
      };
    case 'heading_to_customer':
    case 'out_for_delivery':
      return {
        title: 'Out for Delivery! 🚀',
        body: `${riderName} has picked up your order and is heading your way!`,
        data: { type: 'order_update', orderId: orderId.toString(), click_action: `/track?orderId=${orderId}` }
      };
    case 'delivered':
      return {
        title: 'Delivered! 🎉',
        body: `Enjoy your meal! We hope you love it.`,
        data: { type: 'order_update', orderId: orderId.toString(), click_action: `/orders` }
      };
    case 'cancelled':
    case 'declined':
      return {
        title: 'Order Cancelled 😔',
        body: `Unfortunately, your order from ${stallName} was cancelled.`,
        data: { type: 'order_update', orderId: orderId.toString(), click_action: `/orders` }
      };
    default:
      return null;
  }
};

export const getMerchantNotification = (status: string, orderId: string): NotificationPayload | null => {
  switch (status) {
    case 'placed':
    case 'payment_pending':
      return {
        title: 'New Order Received! 🔔',
        body: `You have a new order (#${orderId}) waiting to be accepted.`,
        data: { type: 'new_order', orderId: orderId.toString(), click_action: `/dashboard` }
      };
    default:
      return null;
  }
};

export const getRiderNotification = (status: string, orderId: string): NotificationPayload | null => {
  switch (status) {
    case 'assigned':
      return {
        title: 'New Delivery Assigned! 📦',
        body: `You have a new order (#${orderId}) to pick up. Check your app.`,
        data: { type: 'new_delivery', orderId: orderId.toString(), click_action: `/dashboard` }
      };
    default:
      return null;
  }
};
