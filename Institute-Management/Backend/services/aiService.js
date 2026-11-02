const { GoogleGenAI } = require('@google/genai');
const pool = require('../config/db');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || ''
});

// Helper: Calls a specified Gemini model
const callGeminiModel = async (modelName, prompt) => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text ?? '';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Gemini [${modelName}] Error:`, errorMessage);

    if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
      throw new Error(`AI limit reached on ${modelName}. Please try again shortly.`);
    }
    throw new Error(`AI request failed on ${modelName}.`);
  }
};

/**
 * 1. gemini-3.5-flash-lite -> Mentorship Feedback & Standard Books (< 33 marks)
 * 2. gemini-3.8-flash      -> YouTube Video Recommendations (< 33 marks)
 */
exports.generateStudentMentorship = async (resultId, studentId, studentName, marksList) => {
  try {
    const failedSubjects = marksList.filter(m => Number(m.mark) < 33);

    // --- STEP 1: Lightweight analysis using gemini-3.5-flash-lite ---
    const litePrompt = `You are an academic mentor analyzing results for "${studentName}".
Marks Data:
${JSON.stringify(marksList, null, 2)}

Failed Subjects (< 33 marks):
${JSON.stringify(failedSubjects, null, 2)}

Return strictly a valid JSON object matching this schema (no markdown fences):
{
  "generalFeedback": "A motivating, 2-paragraph constructive review of strengths (>=60) and weak areas.",
  "books": [
    {
      "subject": "Subject Name",
      "bookTitle": "Authoritative Textbook Title",
      "author": "Author Name",
      "reason": "Why this book helps clear the failed subject"
    }
  ]
}
If no subjects failed (< 33), return an empty array for "books". Do NOT use markdown formatting or asterisks.`;

    const liteRaw = await callGeminiModel('gemini-3.5-flash-lite', litePrompt);
    const cleanLiteJson = liteRaw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    
    let baseData = { generalFeedback: '', books: [] };
    try {
      baseData = JSON.parse(cleanLiteJson);
    } catch {
      baseData.generalFeedback = cleanLiteJson;
    }

    // --- STEP 2: YouTube generation using gemini-3.8-flash (Only if subjects failed) ---
    let youtubeResources = [];

    if (failedSubjects.length > 0) {
      try {
        const ytPrompt = `You are a curriculum assistant. Recommend YouTube tutorials for these failed subjects:
${JSON.stringify(failedSubjects, null, 2)}

Return strictly a valid JSON array matching this schema (no markdown fences):
[
  {
    "subject": "Subject Name",
    "topic": "Core difficult concept",
    "searchQuery": "Targeted YouTube search phrase",
    "youtubeUrl": "https://www.youtube.com/results?search_query=URL_ENCODED_QUERY"
  }
]
Provide 2 focused tutorial recommendations per failed subject.`;

        const ytRaw = await callGeminiModel('gemini-3.8-flash', ytPrompt);
        const cleanYtJson = ytRaw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        youtubeResources = JSON.parse(cleanYtJson);
      } catch (err) {
        console.warn('YouTube generation via gemini-3.8-flash bypassed:', err.message);
        // Fallback: Generate valid search URLs programmatically if the model call hits limits
        youtubeResources = failedSubjects.flatMap(sub => [
          {
            subject: sub.subject,
            topic: `${sub.subject} Full Course Revision`,
            searchQuery: `${sub.subject} full course lecture`,
            youtubeUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(sub.subject + ' complete playlist')}`
          }
        ]);
      }
    }

    // Combine both outputs
    const finalPayload = {
      generalFeedback: baseData.generalFeedback || 'Semester results evaluated.',
      books: baseData.books || [],
      youtubeResources: youtubeResources || []
    };

    const finalJsonString = JSON.stringify(finalPayload);

    await pool.query(
      `INSERT INTO ai_feedback (result_id, student_id, feedback_message)
       VALUES ($1, $2, $3)`,
      [resultId, studentId, finalJsonString]
    );

    return finalJsonString;
  } catch (err) {
    console.error(`Mentorship generation failed for student ${studentId}:`, err.message);
    const fallback = JSON.stringify({
      generalFeedback: 'Your examination scores are released. Please connect with your faculty advisor for next steps.',
      books: [],
      youtubeResources: []
    });
    return fallback;
  }
};

/**
 * Interactive Doubts: Powered by gemini-3.5-flash-lite for fast, economical replies
 */
exports.answerStudentDoubt = async (studentId, question, resultId) => {
  try {
    let contextStr = '';
    if (resultId) {
      const contextData = await pool.query(
        `SELECT sub.name AS subject, m.mark 
         FROM marks m
         JOIN subjects sub ON m.subject_id = sub.id
         WHERE m.result_id = $1 AND m.student_id = $2`,
        [resultId, studentId]
      );
      contextStr = `Student Result Context: ${JSON.stringify(contextData.rows)}`;
    }

    const prompt = `You are an AI Academic Tutor.
${contextStr}

Student Question:
"${question}"

Provide a direct, step-by-step academic explanation without markdown asterisks.`;

    const reply = await callGeminiModel('gemini-3.5-flash-lite', prompt);

    await pool.query(
      `INSERT INTO ai_feedback (result_id, student_id, student_query, response)
       VALUES ($1, $2, $3, $4)`,
      [resultId || null, studentId, question, reply]
    );

    return reply;
  } catch (err) {
    console.error(`AI doubt failed for student ${studentId}:`, err.message);
    throw err;
  }
};