<?php
/**
 * Admin settings for Navon
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Add admin menu page
 */
function navon_add_admin_menu() {
    add_menu_page(
        'Navon Settings',        // Page title
        'Navon',                 // Menu title
        'manage_options',        // Capability
        'navon-settings',        // Menu slug
        'navon_settings_page',   // Function to display the page
        'dashicons-format-chat', // Icon
        30                       // Position
    );
}
add_action('admin_menu', 'navon_add_admin_menu');

/**
 * Register settings
 */
function navon_register_settings() {
    register_setting('navon_settings_group', 'navon_settings', 'navon_sanitize_settings');
    
    add_settings_section(
        'navon_api_settings',
        'API Settings',
        'navon_api_settings_section_callback',
        'navon-settings'
    );
    
    add_settings_field(
        'openai_api_key',
        'OpenAI API Key',
        'navon_openai_api_key_callback',
        'navon-settings',
        'navon_api_settings'
    );
    
    add_settings_field(
        'model',
        'Model',
        'navon_model_callback',
        'navon-settings',
        'navon_api_settings'
    );
    
    add_settings_field(
        'max_tokens',
        'Max Tokens',
        'navon_max_tokens_callback',
        'navon-settings',
        'navon_api_settings'
    );
    
    add_settings_field(
        'temperature',
        'Temperature',
        'navon_temperature_callback',
        'navon-settings',
        'navon_api_settings'
    );
    
    add_settings_section(
        'navon_appearance_settings',
        'Appearance Settings',
        'navon_appearance_settings_section_callback',
        'navon-settings'
    );
    
    add_settings_field(
        'position',
        'Default Position',
        'navon_position_callback',
        'navon-settings',
        'navon_appearance_settings'
    );
}
add_action('admin_init', 'navon_register_settings');

/**
 * Sanitize settings
 */
function navon_sanitize_settings($input) {
    $sanitized = array();
    
    if (isset($input['openai_api_key'])) {
        $sanitized['openai_api_key'] = sanitize_text_field($input['openai_api_key']);
    }
    
    if (isset($input['model'])) {
        $sanitized['model'] = sanitize_text_field($input['model']);
    }
    
    if (isset($input['max_tokens'])) {
        $sanitized['max_tokens'] = absint($input['max_tokens']);
    }
    
    if (isset($input['temperature'])) {
        $sanitized['temperature'] = floatval($input['temperature']);
        if ($sanitized['temperature'] < 0) {
            $sanitized['temperature'] = 0;
        } elseif ($sanitized['temperature'] > 1) {
            $sanitized['temperature'] = 1;
        }
    }
    
    if (isset($input['position'])) {
        $sanitized['position'] = sanitize_text_field($input['position']);
    }
    
    return $sanitized;
}

/**
 * Section callbacks
 */
function navon_api_settings_section_callback() {
    echo '<p>Connect Navon to the OpenAI API for intelligent responses.</p>';
}

function navon_appearance_settings_section_callback() {
    echo '<p>Customize how Navon appears on your website.</p>';
}

/**
 * Field callbacks
 */
function navon_openai_api_key_callback() {
    $options = get_option('navon_settings');
    $api_key = isset($options['openai_api_key']) ? $options['openai_api_key'] : '';
    
    // Mask the API key for display
    $displayed_key = !empty($api_key) ? substr($api_key, 0, 5) . '...' . substr($api_key, -5) : '';
    
    ?>
    <input type="text" name="navon_settings[openai_api_key]" value="<?php echo esc_attr($api_key); ?>" class="regular-text" placeholder="sk-..." autocomplete="off" />
    <p class="description">Your OpenAI API key. Current: <?php echo esc_html($displayed_key); ?></p>
    <?php
}

function navon_model_callback() {
    $options = get_option('navon_settings');
    $model = isset($options['model']) ? $options['model'] : 'gpt-3.5-turbo';
    
    ?>
    <select name="navon_settings[model]">
        <option value="gpt-3.5-turbo" <?php selected($model, 'gpt-3.5-turbo'); ?>>GPT-3.5 Turbo</option>
        <option value="gpt-4" <?php selected($model, 'gpt-4'); ?>>GPT-4</option>
    </select>
    <p class="description">The OpenAI model to use. GPT-4 is more capable but more expensive.</p>
    <?php
}

function navon_max_tokens_callback() {
    $options = get_option('navon_settings');
    $max_tokens = isset($options['max_tokens']) ? $options['max_tokens'] : 500;
    
    ?>
    <input type="number" name="navon_settings[max_tokens]" value="<?php echo esc_attr($max_tokens); ?>" min="100" max="4000" step="50" />
    <p class="description">Maximum number of tokens in each response.</p>
    <?php
}

function navon_temperature_callback() {
    $options = get_option('navon_settings');
    $temperature = isset($options['temperature']) ? $options['temperature'] : 0.7;
    
    ?>
    <input type="range" name="navon_settings[temperature]" value="<?php echo esc_attr($temperature); ?>" min="0" max="1" step="0.1" oninput="this.nextElementSibling.value = this.value" />
    <output><?php echo esc_html($temperature); ?></output>
    <p class="description">Controls creativity. Lower values give more predictable responses.</p>
    <?php
}

function navon_position_callback() {
    $options = get_option('navon_settings');
    $position = isset($options['position']) ? $options['position'] : 'right';
    
    ?>
    <select name="navon_settings[position]">
        <option value="right" <?php selected($position, 'right'); ?>>Right</option>
        <option value="left" <?php selected($position, 'left'); ?>>Left</option>
        <option value="center" <?php selected($position, 'center'); ?>>Center</option>
    </select>
    <p class="description">Default position of the chat widget. Can be overridden in the shortcode.</p>
    <?php
}

/**
 * Display settings page
 */
function navon_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        
        <form method="post" action="options.php">
            <?php
            settings_fields('navon_settings_group');
            do_settings_sections('navon-settings');
            submit_button('Save Settings');
            ?>
        </form>
        
        <div class="card" style="max-width: 600px; margin-top: 20px; padding: 10px 20px; background-color: #fff; border: 1px solid #ccd0d4; border-radius: 4px; box-shadow: 0 1px 1px rgba(0,0,0,.04);">
            <h2>How to Use</h2>
            <p>Add the Navon chatbot to any page or post using this shortcode:</p>
            <code>[navon_chatbot]</code>
            
            <p>Customize the position:</p>
            <code>[navon_chatbot position="left"]</code>
        </div>
    </div>
    <?php
} 