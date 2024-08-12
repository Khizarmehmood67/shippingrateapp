import { NextResponse } from 'next/server';

export async function POST(req) {
  const body = await req.json();
  const rate = body.rate;
  const orderPrice = parseFloat(rate.subtotal_price) / 100; // Convert from cents to euros

  let shippingRates = [];

  if (orderPrice < 10) {
    const productPrice = parseFloat(rate.items[0].price) / 100; // Assuming single product price in euros
    const shippingCost = productPrice * 0.2; // 20% of product price
    shippingRates.push({
      service_name: 'Custom Shipping',
      service_code: 'CUSTOM_SHIPPING',
      total_price: Math.round(shippingCost * 100), // Convert back to cents
      currency: 'EUR',
    });
  } else {
    shippingRates.push({
      service_name: 'Standard Shipping',
      service_code: 'STANDARD_SHIPPING',
      total_price: 0,
      currency: 'EUR',
    });
  }

  return NextResponse.json({ rates: shippingRates });
}

export async function GET() {
  return NextResponse.json({ message: 'Webhook received' });
}
