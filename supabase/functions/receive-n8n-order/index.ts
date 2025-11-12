import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normalize item name for matching (remove numbers, lowercase, trim)
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^\d+\.\s*/, '') // Remove leading numbers like "1. "
    .replace(/\s*\(small\)|\(large\)/gi, '') // Remove size indicators for base matching
    .trim();
}

// Extract size from item name
function extractSize(name: string): 'small' | 'large' | null {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('(small)') || lowerName.includes('small')) return 'small';
  if (lowerName.includes('(large)') || lowerName.includes('large')) return 'large';
  return null;
}

// Find menu item with fuzzy matching
function findMenuItemByName(menuItems: any[], orderItemName: string): any | null {
  const normalizedOrderName = normalizeItemName(orderItemName);
  const requestedSize = extractSize(orderItemName);
  
  console.log(`Trying to match order item: "${orderItemName}"`);
  console.log(`Normalized: "${normalizedOrderName}", Size: ${requestedSize}`);
  
  // First try: exact match (including size)
  for (const item of menuItems) {
    const normalizedMenuName = normalizeItemName(item.name);
    const menuSize = extractSize(item.name);
    
    if (normalizedMenuName === normalizedOrderName && menuSize === requestedSize) {
      console.log(`✓ Exact match found: ${item.name} (${item.price} kr)`);
      return item;
    }
  }
  
  // Second try: match base name with size
  for (const item of menuItems) {
    const normalizedMenuName = normalizeItemName(item.name);
    const menuSize = extractSize(item.name);
    
    if (normalizedMenuName === normalizedOrderName || 
        (normalizedMenuName.includes(normalizedOrderName) && menuSize === requestedSize)) {
      console.log(`✓ Size match found: ${item.name} (${item.price} kr)`);
      return item;
    }
  }
  
  // Third try: partial match (for items without size)
  for (const item of menuItems) {
    const normalizedMenuName = normalizeItemName(item.name);
    
    if (normalizedMenuName.includes(normalizedOrderName) || 
        normalizedOrderName.includes(normalizedMenuName)) {
      console.log(`✓ Partial match found: ${item.name} (${item.price} kr)`);
      return item;
    }
  }
  
  console.log(`✗ NO MATCH FOUND for "${orderItemName}"`);
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload = await req.json();
    console.log('=== N8N Order Received ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.customer?.name || !payload.customer?.phone) {
      console.error('Missing customer name or phone');
      return new Response(
        JSON.stringify({ error: 'Customer name and phone are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      console.error('Missing or empty items array');
      return new Response(
        JSON.stringify({ error: 'Order must contain at least one item' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL: Delivery orders MUST have an address
    if (payload.deliveryMethod === 'delivery' && !payload.deliveryAddress && !payload.customer?.address) {
      console.error('Delivery order without address - REJECTING');
      return new Response(
        JSON.stringify({ error: 'Delivery orders must include an address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine delivery address - use any available source
    let deliveryAddress = '';
    if (payload.deliveryMethod === 'delivery') {
      deliveryAddress = payload.deliveryAddress || payload.customer?.address || '';
      console.log('Address sources:', {
        deliveryAddress: payload.deliveryAddress,
        customerAddress: payload.customer?.address,
        finalAddress: deliveryAddress
      });
      
      if (!deliveryAddress) {
        console.error('CRITICAL: Delivery order but no address found in any field');
        return new Response(
          JSON.stringify({ error: 'Delivery address is required for delivery orders' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch all menu items
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true);

    if (menuError || !menuItems) {
      console.error('Failed to fetch menu items:', menuError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch menu items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Loaded ${menuItems.length} menu items`);

    // Find or create customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone', payload.customer.phone)
      .maybeSingle();

    let customerId: string;

    if (existingCustomer) {
      customerId = existingCustomer.id;
      
      // Update customer address if provided and different
      const updateData: any = {};
      if (payload.customer.name && payload.customer.name !== existingCustomer.name) {
        updateData.name = payload.customer.name;
      }
      if (deliveryAddress && deliveryAddress !== existingCustomer.address) {
        updateData.address = deliveryAddress;
        console.log(`Updating customer address to: ${deliveryAddress}`);
      }
      
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', customerId);
          
        if (updateError) {
          console.error('Failed to update customer:', updateError);
        } else {
          console.log('Customer updated successfully:', updateData);
        }
      }
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: payload.customer.name,
          phone: payload.customer.phone,
          email: payload.customer.email || null,
          address: deliveryAddress || null,
        })
        .select()
        .single();

      if (customerError || !newCustomer) {
        console.error('Failed to create customer:', customerError);
        return new Response(
          JSON.stringify({ error: 'Failed to create customer' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      customerId = newCustomer.id;
      console.log('New customer created:', customerId);
    }

    // Process items and validate prices
    const orderItemsData: any[] = [];
    let totalAmount = 0;
    const failedItems: string[] = [];

    for (const item of payload.items) {
      console.log(`\n--- Processing item: "${item.name}" (qty: ${item.quantity}) ---`);
      
      // Find menu item using fuzzy matching
      const menuItem = findMenuItemByName(menuItems, item.name);

      if (!menuItem) {
        console.error(`✗ CRITICAL: Menu item not found for "${item.name}"`);
        failedItems.push(item.name);
        continue;
      }

      // CRITICAL VALIDATION: Price must be valid and greater than 0
      const basePrice = menuItem.price;
      if (!basePrice || basePrice <= 0 || basePrice === 0.01) {
        console.error(`✗ CRITICAL: Invalid price ${basePrice} for menu item "${menuItem.name}"`);
        failedItems.push(`${item.name} (invalid price: ${basePrice})`);
        continue;
      }

      // Calculate total price with modifiers
      let itemPrice = basePrice;
      
      // Add extra charges for modifiers
      if (item.modifiers && Array.isArray(item.modifiers)) {
        for (const modifier of item.modifiers) {
          const modifierLower = modifier.toLowerCase();
          if (modifierLower.includes('extra cheese')) {
            itemPrice += 10; // Extra cheese costs 10 kr
            console.log(`Added extra cheese: +10 kr`);
          }
        }
      }

      const subtotal = itemPrice * item.quantity;

      console.log(`✓ Item validated: ${menuItem.name}`);
      console.log(`  Base price: ${basePrice} kr`);
      console.log(`  Final price: ${itemPrice} kr`);
      console.log(`  Quantity: ${item.quantity}`);
      console.log(`  Subtotal: ${subtotal} kr`);

      orderItemsData.push({
        menu_item_id: menuItem.id,
        item_name: menuItem.name + (item.modifiers && item.modifiers.length > 0 ? ` + ${item.modifiers.join(', ')}` : ''),
        quantity: item.quantity,
        unit_price: itemPrice,
        subtotal: subtotal,
        special_instructions: item.specialInstructions || null,
      });

      totalAmount += subtotal;
    }

    // REJECT order if any items failed validation
    if (failedItems.length > 0) {
      console.error('✗✗✗ ORDER REJECTED - Failed items:', failedItems);
      return new Response(
        JSON.stringify({ 
          error: 'Order validation failed',
          failed_items: failedItems,
          message: 'Some items could not be matched to menu or have invalid prices'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // REJECT order if no valid items
    if (orderItemsData.length === 0) {
      console.error('✗✗✗ ORDER REJECTED - No valid items');
      return new Response(
        JSON.stringify({ error: 'No valid items in order' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`\n=== Order Summary ===`);
    console.log(`Valid items: ${orderItemsData.length}`);
    console.log(`Total amount: ${totalAmount} kr`);

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customerId,
        delivery_method: payload.deliveryMethod || 'pickup',
        delivery_address: deliveryAddress || null,
        payment_method: payload.paymentMethod || null,
        total_amount: totalAmount,
        notes: payload.notes || null,
        allergy_info: payload.allergyInfo || null,
        external_source: 'n8n',
        order_status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order created:', order.order_number);

    // Add order items
    const itemsWithOrderId = orderItemsData.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      // Try to delete the order since items failed
      await supabase.from('orders').delete().eq('id', order.id);
      return new Response(
        JSON.stringify({ error: 'Failed to create order items' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✓✓✓ Order ${order.order_number} created successfully with ${orderItemsData.length} items`);

    return new Response(
      JSON.stringify({
        success: true,
        order_number: order.order_number,
        order_id: order.id,
        total_amount: totalAmount,
        items_count: orderItemsData.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing order:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
