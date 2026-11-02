const pool = require('../config/db');

// List of subjects assigned to this faculty
exports.getAssignedSubjects = async (facultyId) => {
    const result = await pool.query(
        `SELECT s.id, s.name, s.code, s.semester, d.id AS dept_id, d.name AS department_name
         FROM subjects s
         JOIN departments d ON s.department_id = d.id
         WHERE s.faculty_id = $1`,
        [facultyId]
    );
    return result.rows;
};

// Fetch roster of all students taking this subject
exports.getStudentRosterForSubject = async (subjectId, facultyId) => {
    // Verify ownership
    const check = await pool.query(
        `SELECT id FROM subjects WHERE id = $1 AND faculty_id = $2`,
        [subjectId, facultyId]
    );

    if (check.rows.length === 0) {
        throw new Error('Unauthorized: You are not assigned to teach this subject.');
    }

    const roster = await pool.query(
        `SELECT m.id AS mark_id, m.mark, m.is_submitted, s.id AS student_id, s.name AS student_name, s.email, r.semester
         FROM marks m
         JOIN students s ON m.student_id = s.id
         JOIN results r ON m.result_id = r.id
         WHERE m.subject_id = $1`,
        [subjectId]
    );

    return roster.rows;
};

// Batch update marks for students in the assigned subject
// marksData = [{ mark_id: 1, mark: 75 }, { mark_id: 2, mark: 45 }]
exports.submitMarksForSubject = async (subjectId, facultyId, marksData) => {
    // Verify ownership
    const check = await pool.query(
        `SELECT id FROM subjects WHERE id = $1 AND faculty_id = $2`,
        [subjectId, facultyId]
    );

    if (check.rows.length === 0) {
        throw new Error('Unauthorized: You are not assigned to teach this subject.');
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        for (const item of marksData) {
            await client.query(
                `UPDATE marks 
                 SET mark = $1, is_submitted = true 
                 WHERE id = $2 AND subject_id = $3`,
                [item.mark, item.mark_id, subjectId]
            );
        }

        await client.query('COMMIT');
        return { message: `Marks submitted successfully for ${marksData.length} students.` };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

exports.getQueriesForFaculty = async (facultyId) => {
    const result = await pool.query(
        `SELECT q.id, q.query_message, q.response, q.created_at, s.name AS student_name, s.email AS student_email
         FROM queries q
         JOIN students s ON q.student_id = s.id
         WHERE q.faculty_id = $1
         ORDER BY q.created_at DESC`,
        [facultyId]
    );
    return result.rows;
};

exports.respondToQuery = async (queryId, facultyId, response) => {
    const result = await pool.query(
        `UPDATE queries SET response = $1 WHERE id = $2 AND faculty_id = $3`,
        [response, queryId, facultyId]
    );

    if (result.rowCount === 0) {
        throw new Error('Query not found or not assigned to you.');
    }
};