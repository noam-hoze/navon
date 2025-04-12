import { useState } from "react";
import axios from "axios";
import stock from "./data/stock"; // same format as before

function App() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        try {
            // Add user message to chat history
            const newMessages = [...messages, { role: "user", content: input }];
            setMessages(newMessages);

            const userMessage = input;
            setInput(""); // Clear input after sending

            // Set loading state to true before API call
            setIsLoading(true);

            const contextSummary =
                "להלן רשימת המוצרים הקיימים במלאי:\n" +
                stock
                    .map(
                        (p) =>
                            `• ${p.name} (${p.category}), מחיר: ₪${p.price}, מלאי כולל: ${p.stock}`
                    )
                    .join("\n");

            const res = await axios.post("http://localhost:11434/api/chat", {
                model: "nous-hermes2",
                messages: [
                    {
                        role: "system",
                        content: `אתה נציג שירות לקוחות ישראלי בחנות אונליין. דבר תמיד בעברית בלבד, בטון אנושי, תקני ואדיב. 
אל תבצע חישובים מיותרים ואל תענה באנגלית.
המוצרים במלאי:
${contextSummary}`,
                    },
                    {
                        role: "user",
                        content: userMessage,
                    },
                ],
                stream: false,
            });

            // Add bot response to chat history
            setMessages([
                ...newMessages,
                { role: "assistant", content: res.data.message.content },
            ]);
        } catch (error) {
            console.error(error);
            // Add error message to chat
            setMessages([
                ...messages,
                { role: "assistant", content: "שגיאה בתגובה מהמודל." },
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

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                right: 0,
                width: "400px",
                height: "100vh",
                background: "#fff",
                padding: "1rem",
                fontFamily: "sans-serif",
                direction: "rtl",
                textAlign: "right",
                boxShadow: "-4px 0 10px rgba(0, 0, 0, 0.2)",
                overflowY: "auto",
                zIndex: 9999,
                color: "black",
            }}
        >
            <h2 style={{ color: "#333" }}>🤖 צ'אט שירות לקוחות</h2>

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
