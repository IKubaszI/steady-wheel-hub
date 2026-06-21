import { type Vehicle } from "@/data/mockData";

export interface ParsedAssistantCommand {
  type: "receipt" | "maintenance";
  data: {
    vehicleId: string | null;
    // For receipt
    vendor?: string;
    category?: "fuel" | "parts" | "service" | "insurance" | "other";
    amount?: number;
    date?: string;
    fuelLiters?: number;
    description?: string;
    // For maintenance
    type?: string;
    cost?: number;
    status?: "completed" | "upcoming" | "overdue";
    notes?: string;
  };
}

export async function parseAssistantCommand(
  commandText: string,
  vehicles: Vehicle[],
  apiKey: string
): Promise<ParsedAssistantCommand> {
  const currentDate = new Date().toISOString().slice(0, 10);
  
  const vehicleListStr = JSON.stringify(
    vehicles.map((v) => ({
      id: v.id,
      brand: v.brand,
      model: v.model,
      plate: v.plate,
      color: v.color,
    }))
  );

  const prompt = `You are an expert voice and text command assistant for GarageOS, a car maintenance and expense tracking application.
Your goal is to parse natural language instructions (written or spoken in Polish or English), extract the relevant fields, and match the instruction to a specific vehicle from the user's fleet.

User's Fleet (List of Vehicles):
${vehicleListStr}

Current Date is: ${currentDate}

Instructions:
1. Identify if the user wants to add a "receipt" (expense/invoice/paragon/wydatek/koszt/tankowanie) or a "maintenance" (reminder/service/przegląd/naprawa/wymiana części/opon).
2. Match the vehicleId: Compare the user's input (such as license plate digits like "kbc1246", vehicle brand, model, or color) against the User's Fleet. Pick the vehicle ID that best matches. Try to match even if the plate has slightly different spacing or capitalization. If no vehicle matches or is mentioned, return null (or the ID of the first vehicle if only one exists in the fleet).
3. Extract the following fields based on the type of instruction:

If the type is "receipt":
- 'vendor': name of the seller/merchant or type of expense (e.g. Orlen, Shell, GEICO, Mechanik, Sklep, Paliwo, or generic default if unclear). String.
- 'category': "fuel" (for fuel/tankowanie), "parts" (for parts/części), "service" (for mechanic/wymiana/serwis), "insurance" (for insurance/ubezpieczenie/oc/ac), or "other" (for other/inne).
- 'amount': total cost/payment amount. Number.
- 'date': YYYY-MM-DD format. Default to current date if not specified or unclear.
- 'fuelLiters': number of liters (e.g. 30 litrów, 30l). Fill only if category is "fuel" and liters were mentioned, otherwise omit or set to null.
- 'description': any other details, short description, notes, or comments about the receipt/invoice. String.

If the type is "maintenance":
- 'type': type of maintenance service (e.g. Przegląd techniczny, Wymiana oleju, Wymiana opon, Serwis). String.
- 'cost': cost of the maintenance. Number. Defaults to 0 if not mentioned.
- 'date': YYYY-MM-DD format. Default to current date if not specified or unclear.
- 'status': "upcoming" (for planned future services/reminders, e.g. "przypomnienie o przeglądzie w czerwcu", "zaplanuj wymianę opon"), "completed" (for completed past actions), or "overdue".
- 'notes': any other details or notes mentioned in the text. String.

User Command: "${commandText}"

Return ONLY a valid JSON object matching the ParsedAssistantCommand format. Do not use markdown syntax, backticks, or any explanation text outside the JSON.`;

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
                text: prompt,
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
    throw new Error(errorData?.error?.message || "Gemini Assistant API request failed");
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Empty response from Gemini Assistant API");
  }

  const parsed = JSON.parse(rawText.trim()) as ParsedAssistantCommand;
  return parsed;
}
