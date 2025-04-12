import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Assuming your main App component is here
import "./index.css"; // Assuming your main CSS is here

// Find the Navon container added by the shortcode and mount the app
document.addEventListener("DOMContentLoaded", () => {
    const navonElement = document.getElementById("navon-chatbot");

    if (navonElement) {
        // Get position from data attribute set by the shortcode or WP settings
        const position = navonElement.dataset.position || "right"; // Default to 'right'

        // Retrieve API URL and nonce localized by wp_localize_script
        const apiUrl = window.navonSettings?.apiUrl;
        const _nonce = window.navonSettings?.nonce; // Nonce might not be needed directly in App if handled by wrapper

        if (!apiUrl) {
            console.error(
                "Navon Error: API URL not found. Check wp_localize_script."
            );
            // Optionally display an error in the chat widget location
            navonElement.innerHTML =
                '<p style="color: red; padding: 10px;">Error: Could not load configuration.</p>';
            return;
        }

        // Create root and render the App component
        const root = ReactDOM.createRoot(navonElement);
        root.render(
            <React.StrictMode>
                {/* Pass necessary props */}
                <App position={position} apiUrl={apiUrl} />
            </React.StrictMode>
        );
    } else {
        // Optional: Log if the target element wasn't found
        // console.log("Navon Info: Target element #navon-chatbot not found on this page.");
    }
});
