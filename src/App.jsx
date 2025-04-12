import { useState } from "react";
import axios from "axios";
import stock from "./data/stock"; // same format as before

function App() {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");

    const sendMessage = async () => {
        try {
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
                        content: input,
                    },
                ],
                stream: false,
            });

            setResponse(res.data.message.content);
        } catch (error) {
            console.error(error);
            setResponse("שגיאה בתגובה מהמודל.");
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

            {input && (
                <div
                    style={{
                        backgroundColor: "#e1f5fe",
                        padding: "10px",
                        borderRadius: "10px",
                        marginBottom: "10px",
                    }}
                >
                    <strong>אתה:</strong>
                    <p>{input}</p>
                </div>
            )}

            {response && (
                <div
                    style={{
                        backgroundColor: "#fff8e1",
                        padding: "10px",
                        borderRadius: "10px",
                        marginBottom: "10px",
                    }}
                >
                    <strong>בוט:</strong>
                    <p>{response}</p>
                </div>
            )}

            <input
                type="text"
                value={input}
                placeholder="כתוב את ההודעה שלך..."
                onChange={(e) => setInput(e.target.value)}
                style={{
                    width: "100%",
                    padding: "0.5rem",
                    fontSize: "1rem",
                    marginTop: "1rem",
                    direction: "rtl",
                    textAlign: "right",
                    color: "black",
                    background: "#eee",
                    border: "none",
                    borderRadius: "6px",
                }}
            />
            <button
                onClick={sendMessage}
                style={{
                    marginTop: "1rem",
                    padding: "0.5rem 1rem",
                    width: "100%",
                    background: "#2196f3",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "1rem",
                }}
            >
                שלח
            </button>
        </div>
    );
}

export default App;
