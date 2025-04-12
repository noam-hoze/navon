# Navon

<div align="center">
  <img src="public/vite.svg" alt="Navon Logo" width="120" height="120">
  <h3>Smart E-Commerce Customer Service Chatbot</h3>
</div>

## 🌟 Overview

Navon is an intelligent customer service chatbot designed specifically for Hebrew-speaking e-commerce customers. Available as a plugin for WordPress (and Shopify in the future), it provides real-time assistance for common customer inquiries including:

-   Product information and recommendations
-   Order status and delivery inquiries
-   Return and exchange policies
-   Pricing and discount questions
-   Size and variant availability
-   Shipping and payment methods
-   Store policies and FAQs

The chatbot leverages local LLM technology via Ollama to deliver human-like, contextually relevant responses in Hebrew.

## ✨ Features

-   **Native Hebrew Support**: Fully right-to-left (RTL) interface with fluent Hebrew responses
-   **E-Commerce Integration**: Seamlessly connects with WordPress (and Shopify coming soon) to access real-time product data
-   **Dynamic Data Access**: Pulls live inventory, order data, and store policies directly from your platform
-   **Clean UI**: Minimalist, mobile-friendly chat interface that embeds easily on any page
-   **Locally Hosted**: Uses Ollama for local inference, keeping your data secure and costs predictable
-   **Fast Responses**: Optimized for quick responses to minimize customer wait times

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v16 or higher)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
-   [Ollama](https://ollama.ai/) installed and running locally with the `nous-hermes2` model
-   WordPress site with WooCommerce (for WordPress plugin integration)

### Installation

#### Development Setup

1. Clone this repository:

    ```bash
    git clone https://github.com/your-username/navon.git
    cd navon
    ```

2. Install dependencies:

    ```bash
    npm install
    # or
    yarn
    ```

3. Start Ollama with the required model:

    ```bash
    ollama run nous-hermes2
    ```

4. Create a `.env` file with your configuration:

    ```
    OLLAMA_API_URL=http://localhost:11434/api/chat
    ```

5. Start the development server:

    ```bash
    npm run dev
    # or
    yarn dev
    ```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

#### WordPress Plugin Installation (Coming Soon)

1. Download the Navon WordPress plugin from the WordPress plugin repository
2. Install and activate the plugin through your WordPress admin panel
3. Configure the plugin settings to connect with your Ollama instance
4. Customize appearance and behavior through the WordPress admin interface

## 💻 Usage

The chatbot appears as a sidebar widget on your e-commerce website. Customers can:

1. Ask questions about any aspect of your store - from products to policies
2. Receive contextually aware responses that incorporate current store data
3. Get personalized assistance based on real-time inventory and store information

## 📦 E-Commerce Integration

In production, Navon directly integrates with your e-commerce platform:

-   **WordPress/WooCommerce**: Pulls product catalog, inventory, order data, and store policies
-   **Shopify** (Coming soon): Will integrate with Shopify's API for comprehensive store data access

The current demo uses a static product catalog in `src/data/stock.js` for demonstration purposes only.

## 🔧 Customization

You can customize:

-   The chatbot's appearance by modifying the WordPress plugin settings
-   Response behavior by adjusting the system prompt
-   Widget placement and visibility rules through your WordPress admin

## 📝 License

MIT

---

<div align="center">
  <p>Built with React, Vite, and Ollama</p>
</div>
