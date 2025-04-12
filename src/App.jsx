import { useState, useEffect, useRef } from "react";
import axios from "axios";
import stock from "./data/stock"; // same format as before
import "./App.css"; // Assuming App.css might have relevant styles, keep it
import "./index.css"; // Import index.css for global styles

// Default props for standalone mode
const defaultProps = {
    position: "right",
    apiUrl: "https://api.openai.com/v1/chat/completions",
};

function App({
    position = defaultProps.position,
    apiUrl = defaultProps.apiUrl,
}) {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [apiKeyStatus, setApiKeyStatus] = useState("unknown");
    const [isWordPress, setIsWordPress] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // State for chat visibility
    const messagesEndRef = useRef(null); // Ref for scrolling

    // Check if running in WordPress environment
    useEffect(() => {
        // Check if navonSettings exists in window (added by WordPress)
        if (window.navonSettings) {
            setIsWordPress(true);
            setApiKeyStatus(
                window.navonSettings.settings?.openai_api_key
                    ? "available"
                    : "missing"
            );
        } else {
            // Check if API key is available in standalone mode
            const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
            if (openaiKey) {
                console.log(
                    "API key available (masked):",
                    openaiKey.substring(0, 10) + "..."
                );
                setApiKeyStatus("available");
            } else {
                console.warn("API key not found in environment variables");
                setApiKeyStatus("missing");
            }
        }
    }, []);

    const sendMessage = async () => {
        if (!input.trim()) return;

        try {
            // Add user message to chat history
            const newMessages = [...messages, { role: "user", content: input }];
            setMessages(newMessages);

            setInput(""); // Clear input after sending

            // Set loading state to true before API call
            setIsLoading(true);

            let response;

            if (isWordPress) {
                // WordPress mode: Use the WordPress REST API endpoint
                response = await axios.post(
                    window.navonSettings.apiUrl,
                    {
                        messages: newMessages.map((msg) => ({
                            role: msg.role,
                            content: msg.content,
                        })),
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            "X-WP-Nonce": window.navonSettings.nonce,
                        },
                    }
                );

                // Add bot response to chat history - WordPress API proxy formats the response
                setMessages([
                    ...newMessages,
                    {
                        role: "assistant",
                        content: response.data.choices[0].message.content,
                    },
                ]);
            } else {
                // Standalone mode: Use direct OpenAI connection
                const contextSummary =
                    "להלן רשימת המוצרים הקיימים במלאי:\n" +
                    stock
                        .map(
                            (p) =>
                                `• ${p.name} (${p.category}), מחיר: ₪${p.price}, מלאי כולל: ${p.stock}`
                        )
                        .join("\n");

                // Prepare conversation history for OpenAI
                const systemMessage = {
                    role: "system",
                    content: `אתה נציג שירות לקוחות ישראלי בחנות אונליין. 

כללי שיחה:
- דבר בעברית טבעית ויומיומית, לא ספרותית או פורמלית מדי
- השתמש במשפטים קצרים וישירים
- הגב באופן אישי ואנושי
- השתמש באימוג'ים במידה 😊
- כשמתאים, השתמש בביטויים כמו "מעולה", "בדיוק", "אין בעיה", "שמח לעזור"
- אל תשתמש בשפה גבוהה או מליצית

מבנה תשובה טוב:
1. הכר בבקשת הלקוח
2. שאל שאלות קצרות וישירות אם צריך מידע נוסף
3. הצע פתרונות ברורים
4. סיים בצורה חמה ומזמינה

דוגמאות לשיחות (אל תחזור על אלה, רק למד מהסגנון):

לקוח: "קיבלתי את הכוס, אבל היא הגיעה שבורה. 😕"
נבון: "אוי, מצטער לשמוע את זה! תוכל לשלוח לי תמונה של הנזק?"

לקוח: "רציתי להחזיר את התיק שהזמנתי לפני חודש ומשהו. לא התחברתי אליו."
נבון: "אני בודק… רואה שההזמנה בוצעה לפני 35 ימים. לצערי, מדיניות ההחזרות שלנו היא עד 30 יום מיום הקנייה."

לקוח: "שלחתי עכשיו בתמונה."
נבון: "תודה. רואה את הסדק בבירור. יש לך אפשרות לבחור בין החזר כספי לבין שליחה מחדש של מוצר חדש. מה תעדיף?"

לקוח: "ההזמנה שלי הגיעה אחרי יומיים איחור! זה היה למתנה ליום הולדת — לא הספקתי לתת את זה בזמן. זה פשוט מביך."
נבון: "אני ממש מצטער לשמוע על כך. זה באמת מתסכל, ואני מתנצל על העיכוב. אני רוצה לבדוק איך נוכל לפצות אותך על כך. האם קיבלת את המוצר במצב תקין?"

המוצרים במלאי:
${contextSummary}`,
                };

                // Full conversation history including system message
                const fullConversation = [
                    systemMessage,
                    ...newMessages.map((msg) => ({
                        role: msg.role,
                        content: msg.content,
                    })),
                ];

                // Get API key, with fallbacks
                const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

                console.log("Using API endpoint:", apiUrl);
                console.log("API key status:", apiKeyStatus);

                if (!apiKey) {
                    throw new Error(
                        "API key not available in environment variables"
                    );
                }

                // OpenAI API call
                response = await axios.post(
                    apiUrl,
                    {
                        model: "gpt-3.5-turbo", // You can use other models like "gpt-4" if available
                        messages: fullConversation,
                        temperature: 0.7,
                        max_tokens: 500,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${apiKey}`,
                        },
                    }
                );

                // Add bot response to chat history
                setMessages([
                    ...newMessages,
                    {
                        role: "assistant",
                        content: response.data.choices[0].message.content,
                    },
                ]);
            }
        } catch (error) {
            console.error("Error details:", error);

            // More informative error message
            let errorMessage = "שגיאה בתגובה מהמודל.";

            if (error.response) {
                console.error("Response status:", error.response.status);
                console.error("Response data:", error.response.data);

                if (error.response.status === 401) {
                    errorMessage =
                        "שגיאת אימות: המפתח API אינו חוקי או פג תוקף.";
                } else if (error.response.status === 429) {
                    errorMessage =
                        "הגעת למגבלת השימוש באי-פי-איי. נסה שוב מאוחר יותר.";
                }
            }

            // Add error message to chat
            setMessages([
                ...messages,
                { role: "assistant", content: errorMessage },
            ]);
        } finally {
            // Set loading state to false after API call (success or error)
            setIsLoading(false);
        }
    };

    // Handle Enter key press
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };

    // --- Function to toggle chat visibility ---
    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    // --- Scroll to bottom effect ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <>
            {/* Toggle Button - always visible */}
            <button
                onClick={toggleChat}
                className="navon-chat-toggle-button"
                aria-label={isOpen ? "Close Chat" : "Open Chat"}
            >
                {/* Placeholder Icon - Replace with SVG or icon font later */}
                {isOpen ? "✕" : "💬"}
            </button>

            {/* Chat Bubble Container */}
            <div
                className={`navon-chat-bubble-container ${
                    isOpen ? "is-open" : ""
                }`}
            >
                {/* Existing Chat UI goes here */}
                <div className="navon-chat-header">
                    {/* Optional Header? */}
                    <span>Navon Chat</span>
                    <button onClick={toggleChat} className="navon-close-button">
                        ✕
                    </button>
                </div>

                <div className="navon-messages-list">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`navon-message ${msg.role}`}
                        >
                            {/* Basic rendering, could be improved */}
                            <p>{msg.content}</p>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="navon-message assistant loading">
                            <p>מקליד...</p> {/* Typing indicator */}
                        </div>
                    )}
                    {/* Element to scroll to */}
                    <div ref={messagesEndRef} />
                </div>

                {apiKeyStatus === "missing" && (
                    <div className="navon-api-key-warning">
                        <p>
                            שים לב: מפתח API אינו זמין. הצ'אט לא יוכל לשלוח
                            הודעות.
                        </p>
                    </div>
                )}

                <div className="navon-input-area">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="הקלד הודעה..."
                        disabled={isLoading || apiKeyStatus === "missing"}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={
                            isLoading ||
                            !input.trim() ||
                            apiKeyStatus === "missing"
                        }
                    >
                        שלח
                    </button>
                </div>
            </div>
        </>
    );
}

export default App;
