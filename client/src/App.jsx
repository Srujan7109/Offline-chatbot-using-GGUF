// src/App.jsx

import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import "./App.css";

// Required setup for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

function App() {
  const [context, setContext] = useState("");
  const [fileName, setFileName] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setFileName(file.name);
      setIsLoading(true);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const pdf = await pdfjsLib.getDocument(event.target.result).promise;
          let fullText = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item) => item.str)
              .join(" ");
            fullText += pageText + "\n";
          }
          setContext(fullText);
        } catch (error) {
          console.error("Error reading PDF:", error);
          setContext("Sorry, I couldn't read the content of that PDF.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setContext("");
      setFileName("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setAnswer("");

    try {
      const response = await fetch("https://offline-chatbot-using-gguf.onrender.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ context, question }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      console.error("Error fetching the AI response:", error);
      setAnswer(
        "Sorry, something went wrong. Please check the server and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Offline AI Q&A Tutor 🧠</h1>
      <div className="container">
        <div className="context-section">
          <h2>1. Select Local Study Material (PDF)</h2>
          <input type="file" accept=".pdf" onChange={handleFileChange} />
          {fileName && <p>Loaded: {fileName}</p>}
        </div>

        <div className="qa-section">
          <h2>2. Ask a Question</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question..."
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Thinking..." : "Ask AI"}
            </button>
          </form>

          <h2>3. Answer from AI</h2>
          <div className="answer-box">
            {isLoading ? (
              <div className="loader"></div>
            ) : (
              <p>
                {answer ||
                  "Select a PDF and ask a question, or just ask a general knowledge question."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
