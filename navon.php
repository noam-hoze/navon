<?php
/**
 * Plugin Name: Navon - AI Customer Service Chatbot
 * Description: A smart Hebrew customer service chatbot for e-commerce stores
 * Version: 1.0.0
 * Author: Navon
 * Text Domain: navon
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('NAVON_PATH', plugin_dir_path(__FILE__));
define('NAVON_URL', plugin_dir_url(__FILE__));
define('NAVON_VERSION', '1.0.0');

// Include required files
require_once NAVON_PATH . 'includes/admin-settings.php';
require_once NAVON_PATH . 'includes/api-proxy.php';
require_once NAVON_PATH . 'includes/enqueue-scripts.php';

/**
 * Plugin activation hook
 */
function navon_activate() {
    // Create default settings
    $default_settings = array(
        'openai_api_key' => '',
        'model' => 'gpt-3.5-turbo',
        'max_tokens' => 500,
        'temperature' => 0.7,
    );
    
    // Only add options if they don't exist
    if (!get_option('navon_settings')) {
        add_option('navon_settings', $default_settings);
    }
    
    // Create the REST API endpoint
    navon_register_api_endpoints();
    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'navon_activate');

/**
 * Plugin deactivation hook
 */
function navon_deactivate() {
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'navon_deactivate');

/**
 * Initialize the plugin
 */
function navon_init() {
    // Register shortcode to display the chatbot
    add_shortcode('navon_chatbot', 'navon_chatbot_shortcode');
}
add_action('init', 'navon_init');

/**
 * Shortcode function to display the chatbot
 */
function navon_chatbot_shortcode($atts) {
    $atts = shortcode_atts(array(
        'position' => 'right', // Options: right, left, center
    ), $atts);
    
    ob_start();
    ?>
    <div id="navon-chatbot" 
         data-position="<?php echo esc_attr($atts['position']); ?>"
         data-nonce="<?php echo wp_create_nonce('navon_api_nonce'); ?>">
        <!-- The React app will be mounted here -->
    </div>
    <?php
    return ob_get_clean();
} 