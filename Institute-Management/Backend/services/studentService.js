const pool = require('../config/db');
const aiService = require('./aiService');

exports.getStudentPublishedResults = async (studentId) => {
  // Fetch student info, department name, semester, and academic year
  const resultsQuery = await pool.query(
    `SELECT 
        r.id, 
        r.semester, 
        d.name AS department_name, 
        s.id AS student_id,
        s.name AS student_name,
        s.email AS student_email,
        s.curr_sem,
        s.year AS academic_year,
        s.phoneno
     FROM results r
     JOIN departments d ON r.department_id = d.id
     JOIN students s ON r.student_id = s.id
     WHERE r.student_id = $1 AND r.is_published = true
     ORDER BY r.semester DESC`,
    [studentId]
  );

  const published = resultsQuery.rows;

  for (let r of published) {
    const marksRes = await pool.query(
      `SELECT sub.name AS subject, sub.code, m.mark, t.name AS faculty_name
       FROM marks m
       JOIN subjects sub ON m.subject_id = sub.id
       LEFT JOIN teachers t ON sub.faculty_id = t.id
       WHERE m.result_id = $1`,
      [r.id]
    );

    r.marks = marksRes.rows;

    const aiFeedbackRes = await pool.query(
      `SELECT feedback_message 
       FROM ai_feedback
       WHERE result_id = $1 AND student_query IS NULL`,
      [r.id]
    );

    if (aiFeedbackRes.rows.length > 0) {
      r.ai_feedback = aiFeedbackRes.rows[0].feedback_message;
    } else {
      try {
        const feedback = await aiService.generateStudentMentorship(
          r.id,
          studentId,
          r.student_name,
          marksRes.rows
        );
        r.ai_feedback = feedback || 'Feedback generated.';
      } catch (err) {
        r.ai_feedback = 'AI feedback is temporarily unavailable.';
      }
    }
  }

  return published;
};

exports.askTeacherDoubt = async (studentId, facultyId, query_message) => {
    await pool.query(
        `INSERT INTO queries (student_id, faculty_id, query_message)
         VALUES ($1, $2, $3)`,
        [studentId, facultyId, query_message]
    );
};

exports.getStudentDoubts = async (studentId) => {
    const result = await pool.query(
        `SELECT q.id, q.query_message, q.response, q.created_at, t.name AS faculty_name
         FROM queries q
         JOIN teachers t ON q.faculty_id = t.id
         WHERE q.student_id = $1
         ORDER BY q.created_at DESC`,
        [studentId]
    );

    return result.rows;
};