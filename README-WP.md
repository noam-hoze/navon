# Navon - AI Customer Service Chatbot for WordPress

<div align="center">
  <h3>Smart Hebrew E-Commerce Customer Service Chatbot</h3>
</div>

## Overview

Navon is an intelligent customer service chatbot designed specifically for Hebrew-speaking e-commerce customers. It provides real-time assistance through a conversational interface on your WordPress site.

## Features

-   **Native Hebrew Support**: Fully RTL interface with natural Hebrew responses
-   **WooCommerce Integration**: Automatically pulls product data from your store
-   **OpenAI Powered**: Uses advanced AI models for human-like conversations
-   **Easy to Install**: Simple setup with minimal configuration
-   **Customizable**: Control appearance and behavior through settings

## Installation

1. Download the Navon plugin zip file
2. Go to WordPress Admin → Plugins → Add New → Upload Plugin
3. Upload the zip file and click "Install Now"
4. Activate the plugin

## Configuration

1. Go to WordPress Admin → Navon
2. Enter your OpenAI API key
3. Select your preferred model (GPT-3.5 Turbo or GPT-4)
4. Adjust other settings as needed
5. Save settings

## Usage

Add the Navon chatbot to any page or post using this shortcode:

```
[navon_chatbot]
```

You can customize the position:

```
[navon_chatbot position="left"]
```

Available positions:

-   `right` (default)
-   `left`
-   `center`

## For Developers

### Building from Source

1. Install dependencies:

    ```
    npm install
    ```

2. Build for WordPress:
    ```
    npm run build:wp
    ```

The build will output files to the `dist` directory, which the plugin will automatically load.

### Customizing the System Prompt

You can modify the AI instructions in `includes/api-proxy.php` in the `navon_get_system_message` function.

### WooCommerce Integration

The plugin automatically detects if WooCommerce is active and will include product information in the AI context. No additional setup is required.

## Requirements

-   WordPress 5.8 or higher
-   PHP 7.4 or higher
-   OpenAI API key
-   WooCommerce (optional, for product integration)

## Support

For issues, questions, or feature requests, please contact us at [support@example.com](mailto:support@example.com).

## License

MIT
