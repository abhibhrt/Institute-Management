const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const facultyService = require('../services/facultyService');
const studentService = require('../services/studentService');

// Unified Login
exports.login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        const allowedTables = {
            admin: 'administrations',
            teacher: 'teachers',
            student: 'students'
        };

        const table = allowedTables[role];
        if (!table) {
            return res.status(400).json({ message: 'Invalid role specified.' });
        }

        const result = await pool.query(
            `SELECT * FROM ${table} WHERE email = $1`,
            [email]
        );

        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, role, email: user.email, name: user.name, department_id: user.department_id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token, role, user: { id: user.id, name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Faculty Controller Handlers
exports.getAssignedSubjects = async (req, res) => {
    try {
        const data = await facultyService.getAssignedSubjects(req.user.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSubjectRoster = async (req, res) => {
    try {
        const data = await facultyService.getStudentRosterForSubject(req.params.subjectId, req.user.id);
        res.json(data);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
};

exports.submitSubjectMarks = async (req, res) => {
    try {
        const result = await facultyService.submitMarksForSubject(req.params.subjectId, req.user.id, req.body.marks);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getFacultyQueries = async (req, res) => {
    try {
        const data = await facultyService.getQueriesForFaculty(req.user.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.respondQuery = async (req, res) => {
    try {
        await facultyService.respondToQuery(req.params.queryId, req.user.id, req.body.response);
        res.json({ message: 'Response saved.' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Student Controller Handlers
exports.getStudentResults = async (req, res) => {
    try {
        const data = await studentService.getStudentPublishedResults(req.user.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.askTeacher = async (req, res) => {
    try {
        await studentService.askTeacherDoubt(req.user.id, req.body.faculty_id, req.body.query_message);
        res.status(201).json({ message: 'Doubt sent to professor.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentQueries = async (req, res) => {
    try {
        const data = await studentService.getStudentDoubts(req.user.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getTeachersForStudent = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email FROM teachers ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDepartmentsForTeachers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM Departments');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 