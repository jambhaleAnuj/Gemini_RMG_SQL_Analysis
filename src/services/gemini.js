// Gemini AI Service for Natural Language to SQL conversion
const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL_ID = "gemini-3-flash-preview";

class GeminiService {
  constructor() {
    this.apiKey = null;
    this.conversationHistory = [];
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem("gemini_api_key", key);
  }

  getApiKey() {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem("gemini_api_key");
    }
    return this.apiKey;
  }

  clearApiKey() {
    this.apiKey = null;
    localStorage.removeItem("gemini_api_key");
  }

  async generateSQL(question, schemaContext, sampleData) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const systemPrompt = `You are an expert SQL query generator and data analyst. Your task is to convert natural language questions into precise SQL queries.

CRITICAL RULES:
1. ONLY output valid SQLite SQL queries
2. Always use double quotes for table and column names: "table_name", "column_name"
3. Use the EXACT table and column names from the schema provided
4. When searching for text, use LIKE with wildcards: WHERE "column" LIKE '%value%'
5. Make queries case-insensitive for text searches using LOWER()
6. Return meaningful columns, not just SELECT *
7. Include aggregations (COUNT, SUM, AVG, etc.) when appropriate
8. Handle NULL values appropriately
9. Use JOINs when data from multiple tables is needed
10. Order results meaningfully when appropriate

RESPONSE FORMAT:
You must respond in this exact JSON format:
{
  "sql": "YOUR SQL QUERY HERE",
  "explanation": "Brief explanation of what this query does",
  "visualization": "table|bar|line|pie|area|none",
  "visualizationConfig": {
    "xField": "column_name_for_x_axis",
    "yField": "column_name_for_y_axis_or_value",
    "groupField": "optional_column_for_grouping"
  }
}

For visualization field:
- "table" - for detailed data listings
- "bar" - for comparing categories
- "line" - for time series or trends
- "pie" - for showing proportions (use with 10 or fewer categories)
- "area" - for cumulative trends
- "none" - when no visualization makes sense

${schemaContext}

${sampleData}`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}\n\nUSER QUESTION: ${question}\n\nRemember: Respond ONLY with valid JSON in the exact format specified.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    try {
      const response = await fetch(
        `${API_ENDPOINT}/${MODEL_ID}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `API Error: ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from Gemini");
      }

      const textContent = data.candidates[0].content?.parts?.[0]?.text;
      if (!textContent) {
        throw new Error("Empty response from Gemini");
      }

      // Parse JSON response
      return this.parseGeminiResponse(textContent);
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  parseGeminiResponse(text) {
    // Try to extract JSON from the response
    let jsonStr = text.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return {
        sql: parsed.sql,
        explanation: parsed.explanation || "Query generated",
        visualization: parsed.visualization || "table",
        visualizationConfig: parsed.visualizationConfig || {},
      };
    } catch (e) {
      // If JSON parsing fails, try to extract SQL directly
      const sqlMatch = text.match(/SELECT[\s\S]*?(?:;|$)/i);
      if (sqlMatch) {
        return {
          sql: sqlMatch[0].replace(/;$/, ""),
          explanation: "Query extracted from response",
          visualization: "table",
          visualizationConfig: {},
        };
      }
      throw new Error("Could not parse Gemini response");
    }
  }

  async explainResult(question, sql, results, schemaContext) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    // Limit results for context
    const limitedResults = results.values.slice(0, 20);
    const resultsText =
      limitedResults.length > 0
        ? `Columns: ${results.columns.join(", ")}\nData:\n${limitedResults
            .map((row) => row.join(", "))
            .join("\n")}`
        : "No results found";

    const prompt = `You are a data analyst assistant. The user asked: "${question}"

The SQL query executed was:
${sql}

The results are:
${resultsText}
${
  results.rowCount > 20
    ? `\n(Showing 20 of ${results.rowCount} total rows)`
    : ""
}

Provide a concise, natural language summary of the results. Focus on:
1. Directly answering the user's question
2. Key insights from the data
3. Any notable patterns or outliers
4. Specific numbers and facts from the results

Keep the response brief but informative. Format numbers appropriately (with commas for thousands, etc.).`;

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    };

    try {
      const response = await fetch(
        `${API_ENDPOINT}/${MODEL_ID}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `API Error: ${response.status}`
        );
      }

      const data = await response.json();
      return (
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Unable to generate explanation"
      );
    } catch (error) {
      console.error("Gemini Explain Error:", error);
      return "Unable to generate explanation: " + error.message;
    }
  }

  async suggestQuestions(schemaContext) {
    const apiKey = this.getApiKey();
    if (!apiKey) return [];

    const prompt = `Based on this database schema, suggest 5 useful analytical questions that a business user might want to ask. Return ONLY a JSON array of strings.

${schemaContext}

Example format: ["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]`;

    try {
      const response = await fetch(
        `${API_ENDPOINT}/${MODEL_ID}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
          }),
        }
      );

      if (!response.ok) return [];

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

      // Parse JSON array
      let jsonStr = text.trim();
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr
          .replace(/```json?\n?/g, "")
          .replace(/```/g, "")
          .trim();
      }

      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Error suggesting questions:", e);
      return [];
    }
  }
}

const geminiService = new GeminiService();
export default geminiService;
