<?php
/**
 * API Proxy for Navon
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Bypass authentication checks for the Navon chat endpoint.
 *
 * @param WP_Error|null|true $result Existing authentication result.
 * @return WP_Error|null|true True to bypass further checks, null or WP_Error otherwise.
 */
function navon_bypass_auth_for_chat_route($result) {
    // Check if the current request is for the Navon chat endpoint
    if (isset($_SERVER['REQUEST_URI']) && strpos($_SERVER['REQUEST_URI'], '/wp-json/navon/v1/chat') !== false) {
        // error_log('Navon: Bypassing REST authentication for /navon/v1/chat route.'); // Keep commented unless debugging
        return true; // Returning true bypasses further authentication checks
    }
    return $result;
}
add_filter('rest_authentication_errors', 'navon_bypass_auth_for_chat_route', 99);

/**
 * Permission callback to verify nonce
 */
function navon_chat_permission_check($request) {
    $nonce = $request->get_header('X-WP-Nonce');
    if ($nonce && wp_verify_nonce($nonce, 'navon_api_nonce')) {
        return true; // Permission granted
    }
    // error_log('Navon Nonce Verification FAILED in Check'); // Keep commented unless debugging
    return new WP_Error('rest_forbidden', 'Invalid nonce provided.', array('status' => 403));
}

/**
 * Register REST API endpoints
 */
function navon_register_api_endpoints() {
    register_rest_route('navon/v1', '/chat', array(
        'methods'             => 'POST',
        'callback'            => 'navon_handle_chat_request',
        'permission_callback' => 'navon_chat_permission_check',
    ));
}
add_action('rest_api_init', 'navon_register_api_endpoints');

/**
 * Fetch product data from WooCommerce.
 *
 * @return array Formatted product data.
 */
function navon_fetch_product_data() {
    $products_data = array();
    
    // Check if WooCommerce is active
    if (!class_exists('WooCommerce')) {
        error_log('Navon Error: WooCommerce is not active.');
        return $products_data; // Return empty array if WC not active
    }
    
    // Fetch published products
    $args = array(
        'limit'  => -1, // Fetch all products
        'status' => 'publish',
    );
    $products_query = wc_get_products($args);
    
    if (empty($products_query)) {
        return $products_data;
    }
    
    foreach ($products_query as $product) {
        // Get necessary product details
        $products_data[] = array(
            'id'             => $product->get_id(),
            'name'           => $product->get_name(),
            'price'          => $product->get_price(),
            'stock_status'   => $product->get_stock_status(), // 'instock', 'outofstock', 'onbackorder'
            'categories'     => wp_get_post_terms($product->get_id(), 'product_cat', array('fields' => 'names')),
            // 'permalink'   => get_permalink($product->get_id()), // Optional: Add if needed for links
        );
    }
    
    return $products_data;
}

/**
 * Get cached product data using WordPress Transients.
 *
 * @return array Product data from cache or freshly fetched.
 */
function navon_get_cached_product_data() {
    $cache_key = 'navon_product_cache';
    $cached_data = get_transient($cache_key);

    if (false === $cached_data) {
        // Data not in cache or expired, fetch fresh data
        error_log('Navon: Product cache miss. Fetching fresh data.'); // Log cache miss
        $fresh_data = navon_fetch_product_data();
        
        // Store fresh data in transient for 1 hour
        set_transient($cache_key, $fresh_data, HOUR_IN_SECONDS); 
        return $fresh_data;
    }
    
    // Return data from cache
    // error_log('Navon: Product cache hit.'); // Optional: Log cache hit
    return $cached_data;
}

/**
 * Get system message including product information.
 *
 * @return string The complete system message for the AI.
 */
function navon_get_system_message() {
    $product_data = navon_get_cached_product_data(); // Get potentially cached data
    
    $system_message = '
    אתה נציג שירות לקוחות ישראלי בחנות אונליין. 

    כללי שיחה:
    - דבר בעברית טבעית ויומיומית, לא ספרותית או פורמלית מדי
    - השתמש במשפטים קצרים וישירים
    - הגב באופן אישי ואנושי
    - השתמש באימוג\'ים במידה 😊
    - כשמתאים, השתמש בביטויים כמו "מעולה", "בדיוק", "אין בעיה", "שמח לעזור"
    - אל תשתמש בשפה גבוהה או מליצית

    מבנה תשובה טוב:
    1. הכר בבקשת הלקוח
    2. שאל שאלות קצרות וישירות אם צריך מידע נוסף
    3. הצע פתרונות ברורים
    4. סיים בצורה חמה ומזמינה
    ';
    
    // Add product information if available
    if (!empty($product_data)) {
        $system_message .= "\n\nמידע על המוצרים שלנו (מבחר מוגבל מוצג כאן):\n";
        $count = 0;
        $max_products_to_list = 15; // Limit how many products we list in the prompt
        
        foreach ($product_data as $product) {
            if ($count >= $max_products_to_list) {
                 $system_message .= sprintf("ועוד %d מוצרים נוספים זמינים...\n", count($product_data) - $max_products_to_list);
                 break;
            }
            $categories_str = !empty($product['categories']) ? implode(', ', $product['categories']) : 'ללא קטגוריה';
            $price_str = !empty($product['price']) ? "₪" . $product['price'] : 'מחיר לא זמין';
            $stock_str = ($product['stock_status'] === 'instock') ? '(זמין במלאי)' : '(לא זמין כרגע)'; // Simplified stock status
            $system_message .= "• {$product['name']} ({$categories_str}) - {$price_str} {$stock_str}\n";
             $count++;
        }
         // Alternative Summary (Uncomment if preferred over listing products):
         /*
         $total_products = count($product_data);
         $category_counts = array();
         foreach ($product_data as $product) {
             foreach ($product['categories'] as $category) {
                 $category_counts[$category] = isset($category_counts[$category]) ? $category_counts[$category] + 1 : 1;
             }
         }
         arsort($category_counts); // Sort categories by count
         $top_categories = array_slice(array_keys($category_counts), 0, 5); // Get top 5 categories
         $system_message .= sprintf("\n\nמידע על המוצרים: %d מוצרים זמינים בסך הכל.\nקטגוריות פופולריות: %s\n", $total_products, implode(', ', $top_categories));
         */

    } else {
         $system_message .= "\n\n(לא נמצא מידע על מוצרים כרגע או ש-WooCommerce אינו פעיל).";
    }
    
    // Add default policies
    $system_message .= "\n\nמדיניות החנות:
    - משלוח חינם בהזמנות מעל ₪200
    - זמן משלוח: 3-5 ימי עסקים
    - החזרות מתקבלות עד 14 יום מקבלת המוצר
    - שעות פעילות שירות לקוחות: א'-ה' 9:00-18:00
    ";
    
    return $system_message;
}

/**
 * Handle chat API requests
 */
function navon_handle_chat_request($request) {
    // Nonce is verified by permission_callback
    
    $settings = get_option('navon_settings');
    if (empty($settings['openai_api_key'])) {
        return new WP_Error('no_api_key', 'No API key provided', array('status' => 400));
    }
    
    $body = json_decode($request->get_body(), true);
    if (empty($body['messages'])) {
        return new WP_Error('invalid_request', 'Invalid request body', array('status' => 400));
    }
    
    // Prepare system message (now includes cached product data internally)
    $system_message = navon_get_system_message();
    
    $messages = $body['messages'];
    array_unshift($messages, array(
        'role' => 'system',
        'content' => $system_message
    ));
    
    // Prepare request to OpenAI
    $api_url = 'https://api.openai.com/v1/chat/completions';
    $api_args = array(
        'headers' => array(
            'Authorization' => 'Bearer ' . $settings['openai_api_key'],
            'Content-Type' => 'application/json',
        ),
        'body' => json_encode(array(
            'model'       => isset($settings['model']) ? $settings['model'] : 'gpt-3.5-turbo',
            'messages'    => $messages,
            'temperature' => isset($settings['temperature']) ? (float) $settings['temperature'] : 0.7,
            'max_tokens'  => isset($settings['max_tokens']) ? (int) $settings['max_tokens'] : 500,
        )),
        'timeout' => 60,
    );
    
    // Send request to OpenAI
    $response = wp_remote_post($api_url, $api_args);
    
    if (is_wp_error($response)) {
        error_log('Navon OpenAI API Error: ' . $response->get_error_message());
        return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
    }
    
    $response_code = wp_remote_retrieve_response_code($response);
    $response_body = wp_remote_retrieve_body($response);
    
    if ($response_code !== 200) {
        $body = json_decode($response_body, true);
        $error_message = isset($body['error']['message']) ? $body['error']['message'] : 'Unknown API error';
        error_log('Navon OpenAI API Error (Code: ' . $response_code . '): ' . $error_message);
        return new WP_Error('api_error', $error_message, array('status' => $response_code));
    }
    
    // Return response to client
    $body = json_decode($response_body, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('Navon Error: Failed to decode OpenAI JSON response. Response: ' . $response_body);
        return new WP_Error('json_decode_error', 'Failed to decode API response', array('status' => 500));
    }

    return $body;
}

// Note: Removed the old navon_get_products() function as it's replaced by the caching logic. 