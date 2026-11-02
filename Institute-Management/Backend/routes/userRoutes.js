const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const aiController = require('../controllers/aiController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public
router.post('/login', userController.login);

// Faculty Endpoints
router.get('/teacher/subjects', authenticate, authorize(['teacher']), userController.getAssignedSubjects);
router.get('/teacher/roster/:subjectId', authenticate, authorize(['teacher']), userController.getSubjectRoster);
router.put('/teacher/marks/:subjectId', authenticate, authorize(['teacher']), userController.submitSubjectMarks);
router.get('/teacher/queries', authenticate, authorize(['teacher']), userController.getFacultyQueries);
router.put('/teacher/query-reply/:queryId', authenticate, authorize(['teacher']), userController.respondQuery);
router.get('/teacher/departments', authenticate, authorize(['teacher']), userController.getDepartmentsForTeachers);


// Student Endpoints
router.get('/student/results', authenticate, authorize(['student']), userController.getStudentResults);
router.post('/student/ask-teacher', authenticate, authorize(['student']), userController.askTeacher);
router.get('/student/queries', authenticate, authorize(['student']), userController.getStudentQueries);
router.post('/student/ask-ai', authenticate, authorize(['student']), aiController.askAi);
router.get('/student/teachers', authenticate, authorize(['student']), userController.getTeachersForStudent);

module.exports = router;