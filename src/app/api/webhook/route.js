import axios from 'axios';

export async function POST(req, res) {
  const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SHOP } = process.env;

  try {
    const body = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      });
      req.on('end', () => {
        resolve(JSON.parse(data));
      });
    });

    console.log('Received body:', body);  // Log the entire incoming body for debugging

    if (body && body.order) {
      const { order } = body;
      console.log('Received order:', order);  // Log incoming order for debugging

      const orderId = order.id;
      const orderPrice = order.total_price / 100; // Convert from cents to euros

      let shippingCost = 0;

      if (orderPrice < 10) {
        const productPrice = order.line_items[0].price / 100; // Assuming single product for simplicity, convert to euros
        shippingCost = productPrice * 0.2; // 20% of the product price
      } else {
        console.log('Normal shipping options apply for order:', orderId);
        return res.status(200).json({ message: 'Normal shipping options apply' });
      }

      console.log(`Calculated shipping cost for order ${orderId}: ${shippingCost}`);

      const response = await axios.put(
        `https://${SHOPIFY_SHOP}/admin/api/2022-04/orders/${orderId}.json`,
        {
          order: {
            id: orderId,
            shipping_lines: [
              {
                title: 'Custom Shipping',
                price: Math.round(shippingCost * 100), // Convert back to cents for Shopify
                code: 'CUSTOM_SHIPPING',
                source: 'custom-shopify-app'
              }
            ]
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_API_SECRET,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Order updated:', response.data);
      return res.status(200).json({ message: 'Webhook received' });
    } else {
      console.log('Non-order payload received:', body);
      return res.status(200).json({ message: 'Non-order payload received' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
