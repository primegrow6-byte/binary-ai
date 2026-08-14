module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST method required" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured in Vercel."
      });
    }

    const { image } = req.body || {};

    if (!image || !image.startsWith("data:image/")) {
      return res.status(400).json({
        error: "A valid chart image is required."
      });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analyze only what is visible in this trading chart screenshot.

Return ONLY valid JSON in this format:

{
  "market": "Unknown",
  "timeframe": "Unknown",
  "trend": "Bullish",
  "signal": "CALL / UP",
  "confidence": 50,
  "support": "Unknown",
  "resistance": "Unknown",
  "expiry": "Not enough evidence",
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "risk": "Short risk note"
}

Rules:
- signal must be CALL / UP, PUT / DOWN, or NO TRADE.
- confidence must be a number from 0 to 100.
- If the chart is unclear, use NO TRADE and low confidence.
- Never guarantee profit.
- Never invent unreadable prices.
- This is analytical assistance, not financial advice.`
              },
              {
                type: "input_image",
                image_url: image
              }
            ]
          }
        ]
      })
    });

    const text = await response.text();

    if (!response.ok) {
      let errorMessage = "OpenAI API request failed.";

      try {
        const errorData = JSON.parse(text);
        errorMessage =
          errorData?.error?.message || errorMessage;
      } catch (_) {}

      return res.status(response.status).json({
        error: errorMessage
      });
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch (_) {
      return res.status(502).json({
        error: "OpenAI returned an invalid response."
      });
    }

    const outputText =
      data?.output_text ||
      data?.output?.[0]?.content?.find(
        item => item.type === "output_text"
      )?.text;

    if (!outputText) {
      return res.status(502).json({
        error: "AI returned an empty response."
      });
    }

    const cleaned = outputText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    let result;

    try {
      result = JSON.parse(cleaned);
    } catch (_) {
      return res.status(502).json({
        error: "AI returned an unexpected format."
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error?.message || "Server error while analyzing the chart."
    });
  }
};
