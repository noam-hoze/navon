import { useState, useEffect } from "react";
import axios from "axios";
import stock from "./data/stock"; // same format as before

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

    // Get position-specific styles
    const getPositionStyles = () => {
        const baseStyles = {
            position: "fixed",
            width: "400px",
            height: "100vh",
            background: "#fff",
            padding: "1rem",
            fontFamily: "sans-serif",
            direction: "rtl",
            textAlign: "right",
            boxShadow: "0 0 10px rgba(0, 0, 0, 0.2)",
            overflowY: "auto",
            zIndex: 9999,
            color: "black",
            top: 0,
        };

        // Apply position-specific styles
        switch (position) {
            case "left":
                return {
                    ...baseStyles,
                    left: 0,
                    borderRight: "1px solid #ccc",
                };
            case "center":
                return {
                    ...baseStyles,
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderLeft: "1px solid #ccc",
                    borderRight: "1px solid #ccc",
                };
            case "right":
            default:
                return {
                    ...baseStyles,
                    right: 0,
                    borderLeft: "1px solid #ccc",
                };
        }
    };

    return (
        <div style={getPositionStyles()}>
            <h2 style={{ color: "#333" }}>🤖 צ'אט שירות לקוחות</h2>

            {apiKeyStatus === "missing" && (
                <div
                    style={{
                        backgroundColor: "#ffebee",
                        color: "#c62828",
                        padding: "10px",
                        borderRadius: "6px",
                        marginBottom: "10px",
                    }}
                >
                    <strong>אזהרה:</strong>{" "}
                    {isWordPress
                        ? "מפתח API לא מוגדר בהגדרות WordPress"
                        : "מפתח API חסר, בדוק את קובץ .env"}
                </div>
            )}

            <div
                style={{
                    marginBottom: "1rem",
                    maxHeight: "calc(100vh - 150px)",
                    overflowY: "auto",
                }}
            >
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            backgroundColor:
                                msg.role === "user" ? "#e1f5fe" : "#fff8e1",
                            padding: "10px",
                            borderRadius: "10px",
                            marginBottom: "10px",
                        }}
                    >
                        <strong>
                            {msg.role === "user" ? "אתה:" : "נבון:"}
                        </strong>
                        <p>{msg.content}</p>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div
                        style={{
                            backgroundColor: "#fff8e1",
                            padding: "10px",
                            borderRadius: "10px",
                            marginBottom: "10px",
                        }}
                    >
                        <strong>נבון:</strong>
                        <div className="typing-indicator">
                            <span
                                style={{
                                    display: "inline-block",
                                    width: "8px",
                                    height: "8px",
                                    backgroundColor: "#333",
                                    borderRadius: "50%",
                                    margin: "0 2px",
                                    animation: "typing 1s infinite ease-in-out",
                                    animationDelay: "0s",
                                }}
                            ></span>
                            <span
                                style={{
                                    display: "inline-block",
                                    width: "8px",
                                    height: "8px",
                                    backgroundColor: "#333",
                                    borderRadius: "50%",
                                    margin: "0 2px",
                                    animation: "typing 1s infinite ease-in-out",
                                    animationDelay: "0.2s",
                                }}
                            ></span>
                            <span
                                style={{
                                    display: "inline-block",
                                    width: "8px",
                                    height: "8px",
                                    backgroundColor: "#333",
                                    borderRadius: "50%",
                                    margin: "0 2px",
                                    animation: "typing 1s infinite ease-in-out",
                                    animationDelay: "0.4s",
                                }}
                            ></span>
                        </div>
                        <style>
                            {`
                                @keyframes typing {
                                    0% { transform: translateY(0px); }
                                    50% { transform: translateY(-5px); }
                                    100% { transform: translateY(0px); }
                                }
                            `}
                        </style>
                    </div>
                )}
            </div>

            <input
                type="text"
                value={input}
                placeholder="כתוב את ההודעה שלך..."
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                style={{
                    width: "100%",
                    padding: "0.5rem",
                    fontSize: "1rem",
                    marginTop: "1rem",
                    direction: "rtl",
                    textAlign: "right",
                    color: "black",
                    background: isLoading ? "#f0f0f0" : "#eee",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isLoading ? "not-allowed" : "text",
                }}
            />
            <button
                onClick={sendMessage}
                disabled={isLoading}
                style={{
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    width: "100%",
                    background: isLoading ? "#90caf9" : "#2196f3",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontSize: "1rem",
                    opacity: isLoading ? 0.7 : 1,
                }}
            >
                {isLoading ? "מחכה לתגובה..." : "שלח"}
            </button>
        </div>
    );
}

export default App;
