module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST method required" });
  }

  try {
    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Analyze this trading chart screenshot.

Give a clear technical analysis:
1. Market direction: UP or DOWN
2. Confidence percentage
3. Important support/resistance
4. Short explanation based on price action, candles and indicators.

Do NOT claim certainty or guaranteed profit. This is analysis only.`
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

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "OpenAI API error"
      });
    }

    return res.status(200).json({
      success: true,
      result: data.output_text || "No analysis returned."
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
};
