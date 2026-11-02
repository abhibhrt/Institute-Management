const adminService = require('../services/adminService');

// Lookups
exports.getLookups = async (req, res) => {
  try {
    const data = await adminService.getLookups();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Departments
exports.createDepartment = async (req, res) => {
  try {
    const dept = await adminService.createDepartment(req.body.name);
    res.status(201).json(dept);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const response = await adminService.deleteDepartment(req.params.id);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Subjects
exports.createSubject = async (req, res) => {
  try {
    const sub = await adminService.createSubject(req.body);
    res.status(201).json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assignFaculty = async (req, res) => {
  try {
    await adminService.assignFacultyToSubject(req.params.subjectId, req.body.faculty_id);
    res.json({ message: 'Faculty assigned to subject successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const response = await adminService.deleteSubject(req.params.id);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Teachers
exports.createTeacher = async (req, res) => {
  try {
    const teacher = await adminService.createTeacher(req.body);
    res.status(201).json(teacher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const response = await adminService.deleteTeacher(req.params.id);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Students
exports.createStudent = async (req, res) => {
  try {
    const student = await adminService.createStudent(req.body);
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const response = await adminService.deleteStudent(req.params.id);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Exam Lifecycle
exports.initializeSemesterExam = async (req, res) => {
  try {
    const { department_id, semester } = req.body;
    const result = await adminService.initializeSemesterExam(department_id, semester);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.publishSemesterResults = async (req, res) => {
  try {
    const { department_id, semester } = req.body;
    const response = await adminService.publishSemesterResults(department_id, semester);
    if (!response.ready) {
      return res.status(400).json(response);
    }
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};