const express = require('express');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { previewQuestions, startSession } = require('../controllers/questionController');
const { analyzeSession } = require('../controllers/analysisController');
const { resendSessionFeedback } = require('../controllers/feedbackController');
const { assertWhatsAppReady, sendQuestionsToStudent } = require('../services/whatsappService');
const { addClient, removeClient } = require('../services/sseService');

const router = express.Router();

router.post('/questions/preview', previewQuestions);
router.post('/start', startSession);
router.post('/custom-questions/start', async (req, res) => {
  try {
    const { teacherId, topic, subject, grade, language, questions: customQuestions } = req.body;

    if (!teacherId || !topic || !Array.isArray(customQuestions) || !customQuestions.length) {
      return res.status(400).json({ success: false, error: 'Teacher, topic, and questions are required.' });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found.' });
    }

    const finalSubject = subject || teacher.subject;
    const finalGrade = grade || teacher.grade;
    const finalLanguage = language || teacher.language;

    // Validate questions
    const validQuestions = customQuestions.map((q, idx) => ({
      _id: q._id || `q_${idx}`,
      question: q.question || '',
      type: q.type || 'text', // 'text' or 'multiple_choice'
      options: (q.type === 'multiple_choice' && Array.isArray(q.options)) ? q.options : [],
      correctAnswer: q.correctAnswer || ''
    })).filter(q => q.question);

    if (!validQuestions.length) {
      return res.status(400).json({ success: false, error: 'Provide at least one valid question.' });
    }

    const students = await Student.find({ teacherId });
    if (!students.length) {
      return res.status(400).json({ success: false, error: 'Add at least one student to this teacher before starting a session.' });
    }

    assertWhatsAppReady();

    const session = await Session.create({
      teacherId,
      topic,
      subject: finalSubject,
      grade: finalGrade,
      language: finalLanguage,
      questions: validQuestions,
      status: 'active',
      formStatus: 'open',
      groupedStudents: { advanced: [], average: [], needsSupport: [] }
    });

    console.log(`[session] Starting custom question session ${topic} for ${students.length} students.`);
    const deliveryLogs = await Promise.all(students.map((student) => sendQuestionsToStudent(student, session)));
    const sent = deliveryLogs.filter((log) => log.status === 'sent').length;

    const populated = await Session.findById(session._id).populate('teacherId', 'name subject grade language');
    return res.status(201).json({
      success: true,
      session: populated,
      delivery: { sent, failed: deliveryLogs.length - sent, total: deliveryLogs.length }
    });
  } catch (error) {
    console.error('[session] Custom start failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:sessionId/form-status', async (req, res) => {
  try {
    const { formStatus } = req.body;
    
    if (!['open', 'closed'].includes(formStatus)) {
      return res.status(400).json({ success: false, error: 'Form status must be "open" or "closed".' });
    }

    const session = await Session.findById(req.params.sessionId);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    session.formStatus = formStatus;
    await session.save();

    const updated = await Session.findById(session._id)
      .populate('teacherId', 'name subject grade language')
      .populate('responses.studentId', 'name phone riskLevel confidenceLevel');

    console.log(`[session] Form status updated to ${formStatus} for session ${session.topic}.`);
    return res.json({ success: true, session: updated });
  } catch (error) {
    console.error('[session] Form status update failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:sessionId/analyze', analyzeSession);
router.post('/:sessionId/analyse', analyzeSession);
router.post('/:sessionId/feedback', resendSessionFeedback);

router.get('/:sessionId/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const { sessionId } = req.params;
  addClient(sessionId, res);

  res.write(`event: connected\ndata: ${JSON.stringify({ sessionId })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_) {}
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(sessionId, res);
  });
});

router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const sessions = await Session.find({ teacherId: req.params.teacherId }).sort({ date: -1 });
    return res.json({ success: true, sessions });
  } catch (error) {
    console.error('[sessions] Teacher sessions failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:sessionId', async (req, res) => {
  try {
    const [session, messages] = await Promise.all([
      Session.findById(req.params.sessionId)
        .populate('teacherId', 'name school subject grade language')
        .populate('responses.studentId', 'name phone riskLevel confidenceLevel'),
      Message.find({ sessionId: req.params.sessionId }).sort({ createdAt: -1 }).limit(50).populate('studentId', 'name')
    ]);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    return res.json({ success: true, session, messages });
  } catch (error) {
    console.error('[sessions] Detail failed:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
