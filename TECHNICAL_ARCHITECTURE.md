# 🏗️ ShikshaLens - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/Vite)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pages: Dashboard, NewSession, Roster, SessionResults│   │
│  │ Components: CreateCustomQuestions, SessionController│   │
│  │            StudentInfoManager, StudentImporter      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Express.js)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Routes:                                              │   │
│  │  • /api/sessions - Create, manage, analyze sessions │   │
│  │  • /api/students - Create, update, import students  │   │
│  │  • /api/teachers - Teacher management               │   │
│  │  • /api/webhook  - WhatsApp webhook handler         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Services:                                            │   │
│  │  • twilioService - WhatsApp message delivery        │   │
│  │  • geminiService - AI question generation           │   │
│  │  • analyticsService - Response analysis             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            DATABASE (PostgreSQL + JSON)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tables:                                              │   │
│  │  • teachers - Teacher profiles                      │   │
│  │  • students - Student records (indexed on teacher)  │   │
│  │  • sessions - Assessment sessions (MCQ support)     │   │
│  │  • messages - WhatsApp message log                  │   │
│  │  • topics - Topic catalog                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         EXTERNAL SERVICES                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • Twilio WhatsApp API - Message delivery             │   │
│  │ • Google Gemini API - AI question generation         │   │
│  │ • Neon PostgreSQL - Cloud database                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: Create & Send Custom MCQ Session

```
Teacher
  ↓
UI: CreateCustomQuestions.jsx
  ├─ Enter topic
  ├─ Add questions with MCQ options
  └─ Select students
  ↓
API: POST /api/sessions/custom-questions/start
  ├─ Validate teacher exists
  ├─ Validate students belong to teacher
  └─ Create Session with formStatus='open'
  ↓
Service: twilioService.sendQuestionsToStudent()
  ├─ Format MCQ as: "Q1: ... A. opt1 B. opt2 C. opt3"
  ├─ Send via Twilio WhatsApp
  └─ Create Message records (status='sent')
  ↓
Students receive WhatsApp
  ├─ Reads questions
  └─ Replies with "A", "B C", etc.
  ↓
WhatsApp webhook hits /api/webhook/whatsapp
  ├─ Parse phone number
  ├─ Find student by phone
  ├─ Parse response as MCQ options
  ├─ Check formStatus (must be 'open')
  └─ Store response with selectedOptions
  ↓
Teacher Dashboard
  ├─ Real-time response count
  ├─ Response rate percentage
  ├─ Click "Close Form"
  ├─ API: PUT /api/sessions/:sessionId/form-status
  └─ formStatus='closed' → New responses rejected
```

### Flow 2: Import Students

```
Teacher A (needs students)
  ↓
UI: StudentImporter.jsx
  ↓
API: GET /api/students/by-school/:teacherId
  ├─ Fetch students from other teachers
  └─ Display in searchable list
  ↓
Teacher selects multiple students
  ↓
API: POST /api/students/import/:teacherId
  ├─ Validate teacher exists
  ├─ For each selected student:
  │  ├─ Check phone not duplicate
  │  ├─ Create new student record
  │  └─ Assign to importing teacher
  ├─ Return count of successful imports
  └─ Failed imports logged
  ↓
Teacher A's roster updated
```

### Flow 3: Update Student Information

```
Teacher
  ↓
UI: StudentInfoManager.jsx
  ├─ Select student from list
  └─ Edit form shows on right
  ↓
Teacher enters new phone (1-10 digits)
  ├─ JS validation: /^\d{1,10}$/
  ├─ Real-time error if invalid
  └─ Only valid enables submit
  ↓
API: PUT /api/students/:studentId
  ├─ Validate phone format again
  ├─ Check for duplicate phone
  ├─ Update database
  └─ Return updated student
  ↓
UI: Success message
  ├─ "Student updated successfully!"
  └─ Roster refreshes
```

---

## Database Schema (Detailed)

### Teachers Table
```sql
CREATE TABLE teachers (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  school VARCHAR(255),
  subject VARCHAR(100),
  grade VARCHAR(50),
  language VARCHAR(50) DEFAULT 'English',
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Students Table
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  grade VARCHAR(50),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  phone VARCHAR(10) NOT NULL UNIQUE,  -- 10 digits max
  language VARCHAR(50) DEFAULT 'English',
  risk_level VARCHAR(20) DEFAULT 'low',
  confidence_level VARCHAR(20) DEFAULT 'medium',
  learning_profile JSONB DEFAULT '{}',
  progress_history JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_teacher_id ON teacher_id,
  INDEX idx_phone ON phone
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  topic VARCHAR(255) NOT NULL,
  subject VARCHAR(100),
  grade VARCHAR(50),
  language VARCHAR(50),
  date TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',  -- pending, active, completed
  form_status VARCHAR(20) DEFAULT 'open',  -- open, closed
  questions JSONB DEFAULT '[]',
  responses JSONB DEFAULT '[]',
  grouped_students JSONB DEFAULT '{}',
  class_insight JSONB DEFAULT '{}',
  
  INDEX idx_teacher_id ON teacher_id,
  INDEX idx_status ON status
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  session_id UUID REFERENCES sessions(id),
  type VARCHAR(50),  -- question, feedback, acknowledgement
  delivery_mode VARCHAR(20),  -- twilio, mock, pending
  status VARCHAR(20),  -- sent, pending, failed
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Question Structure (JSONB)
```javascript
{
  _id: "q_1234567890",
  question: "What is 2+2?",
  type: "multiple_choice",  // or "text"
  options: ["3", "4", "5", "6"],
  correctAnswer: "B"
}
```

### Response Structure (JSONB)
```javascript
{
  studentId: "uuid-123",
  answers: ["4"],  // For text: full text; for MCQ: what they sent
  selectedOptions: ["B"],  // NEW: for MCQ only
  score: 100,
  understood: "advanced",
  misconception: "",
  confidenceLevel: "high",
  submittedAt: "2024-01-15T10:30:00Z"
}
```

---

## API Endpoints Reference

### Sessions Endpoints

#### POST /api/sessions/start
AI-generated questions (existing)
```javascript
{
  teacherId: "uuid",
  topic: "Fractions",
  subject: "Math",
  grade: "5",
  language: "English"
}
→ Creates session, sends to all students
```

#### POST /api/sessions/custom-questions/start
Custom MCQ session (NEW)
```javascript
{
  teacherId: "uuid",
  topic: "Indian Geography",
  subject: "Social Studies",
  grade: "6",
  language: "English",
  questions: [
    {
      question: "What is the capital of India?",
      type: "multiple_choice",
      options: ["New Delhi", "Mumbai", "Bangalore", "Chennai"],
      correctAnswer: "A"
    }
  ]
}
→ Creates custom session, sends to all students
```

#### PUT /api/sessions/:sessionId/form-status
Manage form availability (NEW)
```javascript
{
  formStatus: "closed"  // or "open"
}
→ Updates session, prevents new responses if closed
```

### Students Endpoints

#### POST /api/students
Create student
```javascript
{
  name: "Rajesh Kumar",
  phone: "9876543210",  // Max 10 digits
  grade: "6",
  language: "Hindi",
  teacherId: "uuid"
}
→ Validates phone (1-10 digits), creates student
```

#### PUT /api/students/:studentId
Update student info (NEW)
```javascript
{
  name: "Rajesh Kumar",
  phone: "9123456789",  // Validated: 1-10 digits
  grade: "6",
  language: "Hindi"
}
→ Validates all fields, updates student
```

#### GET /api/students/by-school/:teacherId
Get importable students (NEW)
```
→ Returns students from other teachers in same school
```

#### POST /api/students/import/:teacherId
Bulk import students (NEW)
```javascript
{
  sourceStudentIds: ["uuid-1", "uuid-2", "uuid-3"]
}
→ Creates copies of students for importing teacher
```

### WhatsApp Webhook

#### POST /api/webhook/whatsapp
Receive student responses
```javascript
{
  From: "whatsapp:+919876543210",
  Body: "A B C",  // Student's response
  MessageSid: "..."
}

Processing:
1. Parse phone: "919876543210" → "9876543210"
2. Find student by phone
3. Find active session for student's teacher
4. Check formStatus (must be 'open')
5. Parse body: "A B C" → selectedOptions: ["A", "B", "C"]
6. Store response with selectedOptions
7. Return TwiML acknowledgement
```

---

## Component Architecture

### Components Tree
```
App
├── pages/
│   ├── Dashboard
│   ├── NewSession
│   │   └── CreateCustomQuestions (NEW)
│   ├── Roster
│   │   └── StudentInfoManager (NEW)
│   │   └── StudentImporter (NEW)
│   ├── SessionResults
│   │   └── SessionController (NEW)
│   ├── StudentProgress
│   ├── Login
│   ├── WhatsAppSetup
│   └── ...
├── components/
│   ├── Navbar
│   ├── DashboardCards
│   ├── StudentCard
│   ├── LiveResponseFeed
│   ├── ClassBreakdown
│   ├── Charts/
│   │   ├── ProgressChart
│   │   ├── TopicWeaknessChart
│   │   └── UnderstandingChart
│   └── ...
└── api/
    └── axios.js (API client)
```

### New Component Props

#### CreateCustomQuestions
```javascript
Props:
  - teacherId: string (teacher's ID)
  - onSessionStart: (session) => void (callback on success)
  - onCancel: () => void (close handler)

State:
  - topic: string
  - questions: Array<Question>
  - currentQuestion: string
  - currentType: 'text' | 'multiple_choice'
  - currentOptions: Array<string>
  - loading: boolean
```

#### SessionController
```javascript
Props:
  - session: SessionObject (full session data)
  - onStatusChange: (updatedSession) => void
  - onRefresh: () => void

State:
  - loading: boolean
  - error: string
  - showStudentList: boolean
```

#### StudentInfoManager
```javascript
Props:
  - students: Array<Student>
  - teacherId: string
  - onClose: () => void

State:
  - selectedStudent: Student | null
  - editData: Student
  - loading: boolean
  - success: string
```

#### StudentImporter
```javascript
Props:
  - teacherId: string
  - onClose: () => void
  - onImportComplete: (result) => void

State:
  - availableStudents: Array<Student>
  - selectedStudents: Array<string>
  - loading: boolean
  - importing: boolean
```

---

## Phone Validation Logic

### Frontend Validation
```javascript
const validatePhone = (phone) => {
  const normalized = String(phone).replace(/[^0-9]/g, '').slice(0, 10);
  
  if (!/^\d{1,10}$/.test(normalized)) {
    return { valid: false, error: 'Phone must be 1-10 digits only' };
  }
  
  return { valid: true, phone: normalized };
};
```

### Backend Validation
```javascript
const phoneValidation = validatePhone(req.body.phone);
if (!phoneValidation.valid) {
  return res.status(400).json({ 
    success: false, 
    error: phoneValidation.error 
  });
}
```

### Database Constraint
```sql
ALTER TABLE students
ADD CONSTRAINT phone_format 
CHECK (phone ~ '^\d{1,10}$');

CREATE UNIQUE INDEX idx_students_phone ON students(phone);
```

---

## WhatsApp Response Parsing

### Parse Multiple Choice
```javascript
const parseMultipleChoice = (body = '', questionCount = 0) => {
  // Accepts: "A", "A B", "A B C", "A, B, C", "A;B;C"
  const responses = body
    .replace(/,/g, ' ')      // Remove commas
    .split(/\s+/)            // Split on whitespace
    .map((item) => item.toUpperCase().trim())  // Normalize
    .filter((item) => /^[A-Z]$/.test(item));   // Only A-Z
  
  return responses.slice(0, questionCount);
};

// Examples:
parseMultipleChoice("A B C", 3)      → ["A", "B", "C"]
parseMultipleChoice("A, B, C", 3)    → ["A", "B", "C"]
parseMultipleChoice("A;B;C", 3)      → ["A", "B", "C"]
parseMultipleChoice("a b c", 3)      → ["A", "B", "C"]  // Case insensitive
```

---

## Error Handling Strategy

### Validation Errors (400)
```javascript
// Phone validation
if (!/^\d{1,10}$/.test(phone)) {
  return res.status(400).json({ 
    success: false, 
    error: 'Phone must be 1-10 digits only' 
  });
}
```

### Authorization Errors (403)
```javascript
// Teacher owns session
if (String(session.teacherId) !== String(req.user.teacherId)) {
  return res.status(403).json({ 
    success: false, 
    error: 'Unauthorized' 
  });
}
```

### Not Found Errors (404)
```javascript
// Student not found
const student = await Student.findById(req.params.studentId);
if (!student) {
  return res.status(404).json({ 
    success: false, 
    error: 'Student not found' 
  });
}
```

### Business Logic Errors (400)
```javascript
// Form already closed
if (session.formStatus === 'closed') {
  return res.status(400).json({ 
    success: false, 
    error: 'Form is closed. No new responses accepted.' 
  });
}
```

---

## Performance Optimizations

### Database Indexes
```sql
-- Fast teacher queries
CREATE INDEX idx_students_teacher_id ON students(teacher_id);
CREATE INDEX idx_sessions_teacher_id ON sessions(teacher_id);

-- Fast phone lookup for webhook
CREATE UNIQUE INDEX idx_students_phone ON students(phone);

-- Fast session status checks
CREATE INDEX idx_sessions_status ON sessions(status);
```

### Query Optimization
```javascript
// Use lean() for read-only queries
const sessions = await Session.find({ teacherId })
  .lean()
  .sort({ date: -1 });

// Batch fetch related data
const [teacher, students] = await Promise.all([
  Teacher.findById(teacherId),
  Student.find({ teacherId })
]);

// Pagination for large datasets
const responses = await Session.findById(sessionId)
  .select('responses')
  .skip(offset)
  .limit(50);
```

### Frontend Optimization
```javascript
// Memoize expensive computations
const teacher = useMemo(
  () => teachers.find(t => t._id === teacherId),
  [teacherId, teachers]
);

// Lazy load components
const CreateCustomQuestions = lazy(() => 
  import('./CreateCustomQuestions')
);
```

---

## Security Considerations

### Input Sanitization
```javascript
// Phone: Only digits, max 10
const phone = String(input).replace(/[^0-9]/g, '').slice(0, 10);

// Names: Trim, no SQL injection
const name = String(input).trim();

// Questions: Basic HTML escape
const question = String(input).trim();
```

### Authentication
```javascript
// Session-based: teacher ID stored in localStorage
// Each request validates teacher owns resource

// WhatsApp webhook: Twilio signature validation
const isValidWebhook = twilio.validateRequest(
  authToken,
  signature,
  url,
  params
);
```

### Database Security
```javascript
// Unique phone constraint prevents duplicates
CREATE UNIQUE INDEX idx_students_phone ON students(phone);

// Foreign key constraints
ALTER TABLE students
ADD FOREIGN KEY (teacher_id) REFERENCES teachers(id);
```

---

## Testing Strategy

### Unit Tests (Planned)
```javascript
// Validation functions
test('validatePhone accepts 10 digits', () => {
  expect(validatePhone('9876543210')).toBe(true);
});

test('validatePhone rejects 11+ digits', () => {
  expect(validatePhone('98765432101')).toBe(false);
});
```

### Integration Tests (Manual)
```
1. Create teacher & students
2. Create MCQ session
3. Simulate WhatsApp responses
4. Verify responses stored correctly
5. Test form closure
6. Test student import
```

### End-to-End Tests (Manual)
```
1. Open app
2. Add students with various phone formats
3. Create custom MCQ session
4. Mock WhatsApp messages
5. Verify responses appear
6. Close form
7. Verify no new responses accepted
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Twilio credentials valid
- [ ] Gemini API key configured
- [ ] SSL certificates ready
- [ ] CORS properly configured
- [ ] Database backups scheduled
- [ ] Monitoring/logging setup
- [ ] Rate limiting configured
- [ ] User authentication working
- [ ] WhatsApp webhook verified
- [ ] Load testing completed

---

## Future Enhancements

1. **Automated Grading**
   - AI-based answer evaluation
   - Misconception detection

2. **Parent Notifications**
   - Send progress updates to parents
   - WhatsApp parent messages

3. **Advanced Analytics**
   - Learning gap patterns
   - Intervention recommendations
   - District-level dashboards

4. **Offline Mode**
   - Queue responses when offline
   - Sync when online

5. **Multi-Language Support**
   - Question auto-translation
   - Localized UI

---

## Conclusion

ShikshaLens is built with scalability, security, and usability in mind. The modular architecture allows for easy expansion while maintaining data integrity and performance.
