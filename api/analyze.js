export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST method required"
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing in Vercel."
      });
    }

    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({
        error: "Chart image is required."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
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
                  text:
                    "Analyze this trading chart screenshot. " +
                    "Return ONLY valid JSON. " +
                    "Fields: market, timeframe, trend, signal, confidence, support, resistance, reasons, risk. " +
                    "signal must be CALL / UP, PUT / DOWN, or NO TRADE. " +
                    "confidence must be 0 to 100. " +
                    "If the chart is unclear, use NO TRADE. " +
                    "Never guarantee profit."
                },
                {
                  type: "input_image",
                  image_url: image
                }
              ]
            }
          ]
        })
      }
    );

    const raw = await response.text();

    if (!response.ok) {
      let message = "OpenAI API request failed.";

      try {
        const errorData = JSON.parse(raw);
        message = errorData?.error?.message || message;
      } catch {}

      return res.status(500).json({
        error: message
      });
    }

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(500).json({
        error: "Invalid response received from OpenAI."
      });
    }

    let output = data.output_text || "";

    if (!output && data.output) {
      for (const item of data.output) {
        for (const part of item.content || []) {
          if (part.type === "output_text") {
            output = part.text;
            break;
          }
        }

        if (output) break;
      }
    }

    if (!output) {
      return res.status(500).json({
        error: "AI returned an empty response."
      });
    }

    output = output
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    let result;

    try {
      result = JSON.parse(output);
    } catch {
      return res.status(500).json({
        error: "AI response was not valid JSON."
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      error: error.message || "Server error."
    });
  }
}
