import axios from 'axios';

export async function POST(req, res) {
  const { SHOPIFY_API_KEY, SHOPIFY_API_SECRET, SHOPIFY_SHOP } = process.env;

  try {
    const { order } = await req.json();
    console.log('Received order:', order);  // Log incoming order for debugging
    const orderPrice = order.total_price / 100; // Convert from cents to euros

    let shippingCost = 0;

    if (orderPrice < 10) {
      const productPrice = order.line_items[0].price / 100; // Assuming single product for simplicity, convert to euros
      shippingCost = productPrice * 0.2; // 20% of the product price
    } else {
      // Do nothing; normal shipping options will apply.
      return res.status(200).json({ message: 'Normal shipping options apply' });
    }

    const response = await axios.put(
      `https://${SHOPIFY_SHOP}/admin/api/2022-04/orders/${order.id}.json`,
      {
        order: {
          id: order.id,
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
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
