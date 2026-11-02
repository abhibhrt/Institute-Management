const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// --- Departments ---
exports.createDepartment = async (name) => {
  const result = await pool.query(
    'INSERT INTO departments (name) VALUES ($1) RETURNING *',
    [name]
  );
  return result.rows[0];
};

exports.deleteDepartment = async (id) => {
  await pool.query('DELETE FROM departments WHERE id = $1', [id]);
  return { message: 'Department deleted successfully' };
};

// --- Subjects ---
exports.createSubject = async ({ name, code, semester, department_id, faculty_id }) => {
  const result = await pool.query(
    `INSERT INTO subjects (name, code, semester, department_id, faculty_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, code, semester, department_id, faculty_id || null]
  );
  return result.rows[0];
};

exports.assignFacultyToSubject = async (subjectId, facultyId) => {
  await pool.query(
    'UPDATE subjects SET faculty_id = $1 WHERE id = $2',
    [facultyId, subjectId]
  );
};

exports.deleteSubject = async (id) => {
  await pool.query('DELETE FROM subjects WHERE id = $1', [id]);
  return { message: 'Subject deleted successfully' };
};

// --- Teachers / Faculty ---
exports.createTeacher = async ({ name, empid, email, password, phoneno, department_id }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO teachers (name, empid, email, password, phoneno, department_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, empid, email, department_id`,
    [name, empid, email, hashedPassword, phoneno, department_id]
  );
  return result.rows[0];
};

exports.deleteTeacher = async (id) => {
  await pool.query('DELETE FROM teachers WHERE id = $1', [id]);
  return { message: 'Faculty deleted successfully' };
};

// --- Students ---
exports.createStudent = async ({ name, email, password, phoneno, curr_sem, year, department_id }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `INSERT INTO students (name, email, password, phoneno, curr_sem, year, department_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, name, email, curr_sem, year, department_id`,
    [name, email, hashedPassword, phoneno, curr_sem, year, department_id]
  );
  return result.rows[0];
};

exports.deleteStudent = async (id) => {
  await pool.query('DELETE FROM students WHERE id = $1', [id]);
  return { message: 'Student deleted successfully' };
};

// --- Exam Lifecycle ---
exports.initializeSemesterExam = async (department_id, semester) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const subjectsRes = await client.query(
      'SELECT id, faculty_id FROM subjects WHERE department_id = $1 AND semester = $2',
      [department_id, semester]
    );
    const subjectsList = subjectsRes.rows;
    if (subjectsList.length === 0) {
      throw new Error('No subjects found for this Department and Semester.');
    }

    const unassigned = subjectsList.filter((s) => !s.faculty_id);
    if (unassigned.length > 0) {
      throw new Error(`Cannot initialize: ${unassigned.length} subject(s) lack an assigned faculty.`);
    }

    const studentsRes = await client.query(
      'SELECT id FROM students WHERE department_id = $1 AND curr_sem = $2',
      [department_id, semester]
    );
    const studentsList = studentsRes.rows;
    if (studentsList.length === 0) {
      throw new Error('No active students found enrolled in this Department and Semester.');
    }

    let initializedCount = 0;
    for (const student of studentsList) {
      const checkRes = await client.query(
        'SELECT id FROM results WHERE student_id = $1 AND semester = $2',
        [student.id, semester]
      );

      let resultId;
      if (checkRes.rows.length === 0) {
        const newRes = await client.query(
          `INSERT INTO results (student_id, semester, department_id, is_published)
           VALUES ($1, $2, $3, FALSE) RETURNING id`,
          [student.id, semester, department_id]
        );
        resultId = newRes.rows[0].id;
      } else {
        resultId = checkRes.rows[0].id;
      }

      for (const sub of subjectsList) {
        await client.query(
          `INSERT INTO marks (result_id, subject_id, student_id, mark, is_submitted)
           VALUES ($1, $2, $3, NULL, FALSE)
           ON CONFLICT (result_id, subject_id, student_id) DO NOTHING`,
          [resultId, sub.id, student.id]
        );
      }
      initializedCount++;
    }

    await client.query('COMMIT');
    return {
      message: `Exam initialized successfully for ${initializedCount} students across ${subjectsList.length} subjects.`
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

exports.publishSemesterResults = async (department_id, semester) => {
  const pendingQuery = await pool.query(
    `SELECT m.id, sub.name AS subject_name, s.name AS student_name, t.name AS faculty_name
     FROM marks m
     JOIN results r ON m.result_id = r.id
     JOIN subjects sub ON m.subject_id = sub.id
     JOIN students s ON m.student_id = s.id
     LEFT JOIN teachers t ON sub.faculty_id = t.id
     WHERE r.department_id = $1 
       AND r.semester = $2 
       AND m.is_submitted = FALSE`,
    [department_id, semester]
  );

  if (pendingQuery.rows.length > 0) {
    return {
      ready: false,
      message: 'Cannot publish semester results. Some subject marks are still unsubmitted by faculty.',
      pendingEntries: pendingQuery.rows
    };
  }

  const resultsQuery = await pool.query(
    `SELECT r.id FROM results r
     WHERE r.department_id = $1 AND r.semester = $2 AND r.is_published = FALSE`,
    [department_id, semester]
  );

  if (resultsQuery.rows.length === 0) {
    return { ready: false, message: 'No unpublished semester results found for this cohort.' };
  }

  await pool.query(
    'UPDATE results SET is_published = TRUE WHERE department_id = $1 AND semester = $2',
    [department_id, semester]
  );

  return {
    ready: true,
    message: `Successfully published results for ${resultsQuery.rows.length} students.`
  };
};

// --- Comprehensive Lookups ---
exports.getLookups = async () => {
  const [departments, teachers, students, subjects] = await Promise.all([
    pool.query(`
      SELECT d.id, d.name, 
        (SELECT COUNT(*) FROM students WHERE department_id = d.id)::int as student_count,
        (SELECT COUNT(*) FROM teachers WHERE department_id = d.id)::int as faculty_count
      FROM departments d ORDER BY d.name ASC
    `),
    pool.query(`
      SELECT t.id, t.name, t.empid, t.email, t.phoneno, t.department_id, d.name as department_name
      FROM teachers t
      LEFT JOIN departments d ON t.department_id = d.id
      ORDER BY t.name ASC
    `),
    pool.query(`
      SELECT s.id, s.name, s.email, s.phoneno, s.curr_sem, s.year, s.department_id, d.name as department_name
      FROM students s
      LEFT JOIN departments d ON s.department_id = d.id
      ORDER BY s.name ASC
    `),
    pool.query(`
      SELECT sub.id, sub.name, sub.code, sub.semester, sub.department_id, sub.faculty_id,
             d.name as department_name, t.name as faculty_name 
      FROM subjects sub
      LEFT JOIN departments d ON sub.department_id = d.id
      LEFT JOIN teachers t ON sub.faculty_id = t.id 
      ORDER BY sub.semester ASC, sub.name ASC
    `)
  ]);

  return {
    departments: departments.rows,
    teachers: teachers.rows,
    students: students.rows,
    subjects: subjects.rows
  };
};