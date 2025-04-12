<?php
/**
 * Enqueue scripts for Navon
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Enqueue scripts and styles
 */
function navon_enqueue_scripts() {
    // Only enqueue on frontend pages (not admin)
    if (is_admin()) {
        return;
    }
    
    // Restore check: Only load if shortcode is present
    global $post;
    if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'navon_chatbot')) { 
        
        // Main JavaScript bundle (from React build)
        wp_enqueue_script(
            'navon-chatbot-js',
            NAVON_URL . 'dist/assets/index.js',
            array(),
            NAVON_VERSION,
            true
        );
        
        // Main CSS file (from React build)
        wp_enqueue_style(
            'navon-chatbot-css',
            NAVON_URL . 'dist/assets/index.css',
            array(),
            NAVON_VERSION
        );
        
        // Localize script with REST API information
        wp_localize_script('navon-chatbot-js', 'navonSettings', array(
            'apiUrl' => rest_url('navon/v1/chat'),
            'nonce' => wp_create_nonce('navon_api_nonce'),
            'settings' => get_option('navon_settings'),
        ));
    }
}
add_action('wp_enqueue_scripts', 'navon_enqueue_scripts');

/**
 * Register script for WordPress block editor (if needed)
 */
function navon_register_block_editor_assets() {
    wp_register_script(
        'navon-block-editor-js',
        NAVON_URL . 'dist/assets/editor.js',
        array('wp-blocks', 'wp-element', 'wp-components', 'wp-editor'),
        NAVON_VERSION,
        true
    );
}
add_action('init', 'navon_register_block_editor_assets');

/**
 * Add custom React build configuration
 * This creates a build script specifically for the WordPress plugin
 */
function navon_create_build_script() {
    // Only run this during plugin activation
    if (!defined('WP_INSTALLING') || !WP_INSTALLING) {
        return;
    }
    
    // Create build directory if it doesn't exist
    if (!file_exists(NAVON_PATH . 'dist')) {
        mkdir(NAVON_PATH . 'dist');
        mkdir(NAVON_PATH . 'dist/assets');
    }
    
    // Create a basic placeholder file until the real build is generated
    file_put_contents(NAVON_PATH . 'dist/assets/index.js', '// This file will be replaced by the React build process');
    file_put_contents(NAVON_PATH . 'dist/assets/index.css', '/* This file will be replaced by the React build process */');
    
    // Create a build script
    $build_config = '// vite.wp-config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "src/wp-main.jsx"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
});
';
    
    file_put_contents(NAVON_PATH . 'vite.wp-config.js', $build_config);
    
    // Create WordPress entry point
    $wp_entry = "// src/wp-main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Find the Navon container and mount
document.addEventListener('DOMContentLoaded', () => {
  const navonElement = document.getElementById('navon-chatbot');
  
  if (navonElement) {
    // Get position from data attribute or settings
    const position = navonElement.dataset.position || 'right';
    
    // Create root and render
    const root = ReactDOM.createRoot(navonElement);
    root.render(
      <React.StrictMode>
        <App position={position} apiUrl={window.navonSettings.apiUrl} />
      </React.StrictMode>
    );
  }
});
";
    
    // Make sure the src directory exists
    if (!file_exists(NAVON_PATH . 'src')) {
        mkdir(NAVON_PATH . 'src');
    }
    
    file_put_contents(NAVON_PATH . 'src/wp-main.jsx', $wp_entry);
    
    // Create a README with instructions
    $readme = "# Navon WordPress Plugin

## Development Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Build for WordPress:
   ```
   npm run build:wp
   ```

3. Add this to your package.json scripts:
   ```
   \"build:wp\": \"vite build --config vite.wp-config.js\"
   ```

The build will output files to the `dist` directory, which the plugin will automatically load when the shortcode is used.

## Usage

Add this shortcode to any page or post:
```
[navon_chatbot]
```

Or with custom position:
```
[navon_chatbot position=\"left\"]
```
";
    
    file_put_contents(NAVON_PATH . 'README-WP.md', $readme);
}
add_action('activate_navon/navon.php', 'navon_create_build_script'); 