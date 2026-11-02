const pool = require('./db');
const bcrypt = require('bcryptjs');

const initDb = async () => {
    try {
        const tableQueries = `
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            );

            CREATE TABLE IF NOT EXISTS administrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS teachers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                empid VARCHAR(50) NOT NULL UNIQUE,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                phoneno VARCHAR(20),
                department_id INT REFERENCES departments(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) NOT NULL UNIQUE,
                semester INT NOT NULL,
                department_id INT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
                faculty_id INT NULL REFERENCES teachers(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                phoneno VARCHAR(20),
                curr_sem INT NOT NULL,
                year INT NOT NULL,
                department_id INT REFERENCES departments(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS results (
                id SERIAL PRIMARY KEY,
                semester INT NOT NULL,
                student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                department_id INT NOT NULL REFERENCES departments(id),
                is_published BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT UQ_Student_Sem UNIQUE(student_id, semester)
            );

            CREATE TABLE IF NOT EXISTS marks (
                id SERIAL PRIMARY KEY,
                result_id INT NOT NULL REFERENCES results(id) ON DELETE CASCADE,
                subject_id INT NOT NULL REFERENCES subjects(id),
                student_id INT NOT NULL REFERENCES students(id),
                mark DECIMAL(5,2) NULL,
                is_submitted BOOLEAN DEFAULT FALSE,
                CONSTRAINT UQ_Result_Subject_Student UNIQUE(result_id, subject_id, student_id)
            );

            CREATE TABLE IF NOT EXISTS queries (
                id SERIAL PRIMARY KEY,
                student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                faculty_id INT NOT NULL REFERENCES teachers(id),
                query_message TEXT NOT NULL,
                response TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS ai_feedback (
                id SERIAL PRIMARY KEY,
                result_id INT NULL REFERENCES results(id) ON DELETE CASCADE,
                student_id INT NULL REFERENCES students(id) ON DELETE NO ACTION,
                feedback_message TEXT NULL,
                student_query TEXT NULL,
                response TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await pool.query(tableQueries);
        console.log('Database tables verified/created successfully.');

        // Seed Default Admin
        const adminCheck = await pool.query(`SELECT id FROM administrations LIMIT 1`);
        if (adminCheck.rows.length === 0) {
            const defaultHashedPassword = await bcrypt.hash('admin123', 10);
            await pool.query(
                `INSERT INTO administrations (name, email, password) VALUES ($1, $2, $3)`,
                ['Main Admin', 'admin@college.com', defaultHashedPassword]
            );
            console.log('Default admin seeded: admin@college.com / admin123');
        }
    } catch (err) {
        console.error('Error in initDb:', err);
    }
};

module.exports = initDb;