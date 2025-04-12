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
        // Log that we are bypassing auth for this route
        // error_log('Navon: Bypassing REST authentication for /navon/v1/chat route.'); // Keep commented unless debugging
        return true; // Returning true bypasses further authentication checks
    }
    
    // For any other route, return the original result
    return $result;
}
add_filter('rest_authentication_errors', 'navon_bypass_auth_for_chat_route', 99); // Use high priority

/**
 * Permission callback to verify nonce
 */
function navon_chat_permission_check($request) {
    $nonce = $request->get_header('X-WP-Nonce');
    // error_log('Navon Nonce Received in Check: ' . print_r($nonce, true)); // Optional: keep for debugging
    if ($nonce && wp_verify_nonce($nonce, 'navon_api_nonce')) {
        // error_log('Navon Nonce Verification SUCCESS in Check'); // Optional: keep for debugging
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
        'methods' => 'POST',
        'callback' => 'navon_handle_chat_request',
        // Restore the proper nonce check in the permission callback
        'permission_callback' => 'navon_chat_permission_check',
    ));
}
add_action('rest_api_init', 'navon_register_api_endpoints');

/**
 * Handle chat API requests
 */
function navon_handle_chat_request($request) {
    // Nonce is already verified by permission_callback
    
    // Get plugin settings
    $settings = get_option('navon_settings');
    
    // Check if API key is set
    if (empty($settings['openai_api_key'])) {
        return new WP_Error('no_api_key', 'No API key provided', array('status' => 400));
    }
    
    // Get request parameters
    $body = json_decode($request->get_body(), true);
    if (empty($body['messages'])) {
        return new WP_Error('invalid_request', 'Invalid request body', array('status' => 400));
    }
    
    // Get WooCommerce products if available
    $products = navon_get_products();
    
    // Prepare system message with product information
    $system_message = navon_get_system_message($products);
    
    // Prepend system message to conversation
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
            'model' => isset($settings['model']) ? $settings['model'] : 'gpt-3.5-turbo',
            'messages' => $messages,
            'temperature' => isset($settings['temperature']) ? (float) $settings['temperature'] : 0.7,
            'max_tokens' => isset($settings['max_tokens']) ? (int) $settings['max_tokens'] : 500,
        )),
        'timeout' => 60,
    );
    
    // Send request to OpenAI
    $response = wp_remote_post($api_url, $api_args);
    
    // Check for errors
    if (is_wp_error($response)) {
        return new WP_Error('api_error', $response->get_error_message(), array('status' => 500));
    }
    
    // Check response code
    $response_code = wp_remote_retrieve_response_code($response);
    if ($response_code !== 200) {
        $body = json_decode(wp_remote_retrieve_body($response), true);
        $error_message = isset($body['error']['message']) ? $body['error']['message'] : 'Unknown API error';
        return new WP_Error('api_error', $error_message, array('status' => $response_code));
    }
    
    // Return response to client
    $body = json_decode(wp_remote_retrieve_body($response), true);
    return $body;
}

/**
 * Get WooCommerce products
 */
function navon_get_products() {
    $products = array();
    
    // Check if WooCommerce is active
    if (in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
        // Limit to 20 products for performance
        $args = array(
            'limit' => 20,
            'status' => 'publish',
            'stock_status' => 'instock',
            'orderby' => 'date',
            'order' => 'DESC',
        );
        
        $products_query = wc_get_products($args);
        
        foreach ($products_query as $product) {
            $products[] = array(
                'id' => $product->get_id(),
                'name' => $product->get_name(),
                'price' => $product->get_price(),
                'regular_price' => $product->get_regular_price(),
                'sale_price' => $product->get_sale_price(),
                'stock_quantity' => $product->get_stock_quantity(),
                'categories' => wp_get_post_terms($product->get_id(), 'product_cat', array('fields' => 'names')),
                'permalink' => get_permalink($product->get_id()),
            );
        }
    }
    
    return $products;
}

/**
 * Get system message with product information
 */
function navon_get_system_message($products) {
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
    if (!empty($products)) {
        $system_message .= "\n\nמידע על המוצרים שלנו:\n";
        
        foreach ($products as $product) {
            $categories = implode(', ', $product['categories']);
            $system_message .= "• {$product['name']} ({$categories}), מחיר: ₪{$product['price']}" . 
                               ($product['stock_quantity'] ? ", מלאי: {$product['stock_quantity']}" : '') . "\n";
        }
    }
    
    // Add default policies
    $system_message .= "
    מדיניות החנות:
    - משלוח חינם בהזמנות מעל ₪200
    - זמן משלוח: 3-5 ימי עסקים
    - החזרות מתקבלות עד 14 יום מקבלת המוצר
    - שעות פעילות שירות לקוחות: א'-ה' 9:00-18:00
    ";
    
    return $system_message;
} 