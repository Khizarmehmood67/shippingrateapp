import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(','),
  hostName: process.env.HOST_NAME.replace(/https?:\/\//, ""),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
});

const updateOrderShippingCost = async (orderId, shippingCost) => {
  const session = new Session({
    shop: process.env.SHOPIFY_SHOP,
    state: 'state',
    isOnline: false,
  });

  session.accessToken = process.env.SHOPIFY_API_SECRET;

  const client = new shopify.clients.Rest({ session });

  const data = {
    order: {
      id: orderId,
      shipping_lines: [
        {
          title: 'Custom Shipping',
          price: shippingCost,
          code: 'CUSTOM_SHIPPING',
          source: 'custom-shopify-app'
        }
      ]
    }
  };

  try {
    const response = await client.put({
      path: `orders/${orderId}`,
      data,
      type: 'application/json',
    });
    console.log('Order updated:', response.body);
  } catch (error) {
    console.error('Error updating order:', error.response.data);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { order } = req.body;
    console.log('Received order:', order);  // Log incoming order for debugging
    const orderPrice = order.total_price / 100; // Convert from cents to euros

    let shippingCost = 0;

    if (orderPrice < 10) {
      const productPrice = order.line_items[0].price / 100; // Assuming single product for simplicity, convert to euros
      shippingCost = productPrice * 0.2; // 20% of the product price
    } else {
      // Do nothing; normal shipping options will apply.
      return res.status(200).send('Normal shipping options apply');
    }

    await updateOrderShippingCost(order.id, Math.round(shippingCost * 100)); // Convert back to cents for Shopify

    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
}
