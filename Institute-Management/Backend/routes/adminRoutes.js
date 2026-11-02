const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate, authorize(['admin']));

// Lookups
router.get('/lookups', adminController.getLookups);

// Departments
router.post('/department', adminController.createDepartment);
router.delete('/department/:id', adminController.deleteDepartment);

// Subjects
router.post('/subject', adminController.createSubject);
router.put('/subject/assign-faculty/:subjectId', adminController.assignFaculty);
router.delete('/subject/:id', adminController.deleteSubject);

// Teachers
router.post('/teacher', adminController.createTeacher);
router.delete('/teacher/:id', adminController.deleteTeacher);

// Students
router.post('/student', adminController.createStudent);
router.delete('/student/:id', adminController.deleteStudent);

// Exam Lifecycle
router.post('/exam/initialize', adminController.initializeSemesterExam);
router.post('/exam/publish', adminController.publishSemesterResults);

module.exports = router;