const express = require("express");
const axios = require("axios");
const cors = require("cors");
const multer = require("multer");
const pdf = require("pdf-parse");

const app = express();
const port = 3001;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware to enable CORS and parse JSON bodies
app.use(cors());
app.use(express.json());

// Define the API endpoint that the frontend will call
app.post("/api/ask", upload.single("file"), async (req, res) => {
  try {
    // We now only require a question. Context is optional.
    const { question } = req.body;
    let context = "";

    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    if (req.file) {
      const dataBuffer = req.file.buffer;
      const data = await pdf(dataBuffer);
      context = data.text;
    }

    let prompt;

    // Check if context is provided and create the appropriate prompt
    if (context && context.trim() !== "") {
      // Prompt to use when context IS provided
      prompt = `You are a helpful teaching assistant. Answer the following question based on the provided text, but feel free to use your own general knowledge to provide a more complete and helpful answer. Prioritize the provided text as the main source of truth.
                   ---
                   Provided Text: "${context}"
                   ---
                   Question: "${question}"`;
    } else {
      // Simpler prompt to use when NO context is provided
      prompt = question;
    }

    // Send the request to the Ollama API
    const ollamaResponse = await axios.post(
      "http://localhost:11434/api/generate",
      {
        model: "phi3",
        prompt: prompt,
        stream: false,
      }
    );
    res.json({ answer: ollamaResponse.data.response });
  } catch (error) {
    console.error("Error communicating with Ollama:", error);
    res.status(500).json({ error: "Failed to get a response from the AI." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
