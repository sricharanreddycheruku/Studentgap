const express = require('express');
const Student = require('../models/Student');
const Message = require('../models/Message');

const router = express.Router();

const normalizePhone = (value = '') => String(value).replace(/\s+/g, '').replace(/^\+/, '');

const validatePhone = (phone) => {
  const normalized = normalizePhone(phone);
  if (!/^\d{7,15}$/.test(normalized)) {
    return { valid: false, error: 'Phone number must be 7–15 digits (include country code, e.g. 919876543210 for India).' };
  }
  return { valid: true, phone: normalized };
};

router.post('/', async (req, res) => {
  try {
    const phoneValidation = validatePhone(req.body.phone);
    if (!phoneValidation.valid) {
      return res.status(400).json({ success: false, error: phoneValidation.error });
    }

    const payload = { ...req.body, phone: phoneValidation.phone };
    const required = ['name', 'grade', 'teacherId', 'phone'];
    const missing = required.filter((field) => !String(payload[field] || '').trim());

    if (missing.length) {
      return res.status(400).json({ success: false, error: `Missing required student fields: ${missing.join(', ')}.` });
    }

    const student = await Student.create(payload);
    console.log(`[students] Created student ${student.name} with phone ${student.phone}.`);
    return res.status(201).json({ success: true, student });
  } catch (error) {
    const duplicatePhone = error.code === '23505' && String(error.constraint || '').includes('students_phone');
    console.error('[students] Create failed:', error.message);
    return res.status(duplicatePhone ? 409 : 500).json({
      success: false,
      error: duplicatePhone ? 'A student with this phone number already exists.' : error.message
    });
  }
});

router.put('/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    if (req.body.phone) {
      const phoneValidation = validatePhone(req.body.phone);
      if (!phoneValidation.valid) {
        return res.status(400).json({ success: false, error: phoneValidation.error });
      }
      req.body.phone = phoneValidation.phone;
    }

    await Student.updateOne({ _id: student._id }, req.body);
    const updated = await Student.findById(student._id);
    console.log(`[students] Updated student ${student.name}.`);
    return res.json({ success: true, student: updated });
  } catch (error) {
    const duplicatePhone = error.code === '23505' && String(error.constraint || '').includes('students_phone');
    console.error('[students] Update failed:', error.message);
    return res.status(duplicatePhone ? 409 : 500).json({
      success: false,
      error: duplicatePhone ? 'A student with this phone number already exists.' : error.message
    });
  }
});

router.delete('/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }
    await Student.deleteOne({ _id: student._id });
    console.log(`[students] Deleted student ${student.name}.`);
    return res.json({ success: true });
  } catch (error) {
    console.error('[students] Delete failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/progress/:studentId', async (req, res) => {
  try {
    const [student, messages] = await Promise.all([
      Student.findById(req.params.studentId).populate('teacherId', 'name school subject grade'),
      Message.find({ studentId: req.params.studentId }).sort({ createdAt: -1 }).limit(20)
    ]);

    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    return res.json({ success: true, student, messages });
  } catch (error) {
    console.error('[students] Progress failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:teacherId', async (req, res) => {
  try {
    const students = await Student.find({ teacherId: req.params.teacherId }).sort({ name: 1 });
    return res.json({ success: true, students });
  } catch (error) {
    console.error('[students] Teacher roster failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/by-school/:teacherId', async (req, res) => {
  try {
    const teacher = await require('../models/Teacher').findById(req.params.teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found.' });
    }
    const students = await Student.find({ teacherId: { $ne: req.params.teacherId } }).sort({ name: 1 });
    return res.json({ success: true, students });
  } catch (error) {
    console.error('[students] School students failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import/:teacherId', async (req, res) => {
  try {
    const { sourceStudentIds } = req.body;
    const targetTeacherId = req.params.teacherId;

    if (!Array.isArray(sourceStudentIds) || !sourceStudentIds.length) {
      return res.status(400).json({ success: false, error: 'Provide array of student IDs to import.' });
    }

    const sourceStudents = await Student.find({ _id: { $in: sourceStudentIds } });
    const importedStudents = [];

    for (const sourceStudent of sourceStudents) {
      try {
        const newStudent = await Student.create({
          ...sourceStudent,
          _id: undefined,
          teacherId: targetTeacherId,
          createdAt: new Date()
        });
        importedStudents.push(newStudent);
      } catch (err) {
        console.warn(`Failed to import student ${sourceStudent.name}:`, err.message);
      }
    }

    console.log(`[students] Imported ${importedStudents.length} students.`);
    return res.json({ success: true, importedCount: importedStudents.length, students: importedStudents });
  } catch (error) {
    console.error('[students] Import failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
