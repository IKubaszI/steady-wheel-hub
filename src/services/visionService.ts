const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = String(reader.result);
      const base64Data = result.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
};

export interface GeminiReceiptResult {
  vendor: string;
  date: string;
  amount: number | string;
}

export async function recognizeReceiptGemini(file: File, apiKey: string): Promise<GeminiReceiptResult> {
  const base64Content = await fileToBase64(file);
  const mimeType = file.type || "image/png";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Analyze this receipt/invoice image and extract the following details as a valid JSON object only. Do not wrap in markdown code blocks. The JSON must contain these exact keys:\n- 'vendor': name of the seller/merchant (string)\n- 'date': date of the transaction in YYYY-MM-DD format (string, if not found or unclear leave as empty string)\n- 'amount': total amount to pay (number, representing the final total amount, e.g. 3690.00)",
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Content,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error?.message || "Gemini API request failed");
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Empty response from Gemini API");
  }

  const parsed = JSON.parse(rawText.trim()) as GeminiReceiptResult;
  return parsed;
}
