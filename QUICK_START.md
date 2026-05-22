# 🎯 ShikshaLens - Quick Start Guide

## Getting Started in 5 Minutes

### Step 1: Login & Setup Teacher Profile
```
1. Open ShikshaLens dashboard
2. If new, create teacher profile with:
   - Name
   - School
   - Subject (Math, Science, etc.)
   - Grade (5, 6, 7, etc.)
   - Language preference
```

### Step 2: Add Students to Your Class
```
Go to "Roster" page

Option A - Add Manually:
1. Enter student name
2. Enter WhatsApp phone (10 digits max, e.g., 9876543210)
3. Select grade & language
4. Click "Add Student"

Option B - Import from Colleague:
1. Click "Import more" button
2. Search for students by name or phone
3. Select multiple students (checkboxes)
4. Click "Import Selected Students"
5. Done! Students added to your roster
```

### Step 3: Create & Send Questions via WhatsApp

#### Option A: AI-Generated Questions (3 minutes)
```
1. Click "Launch Session" or go to "New Session"
2. Select "AI Generated" tab
3. Choose existing topic or enter custom topic
4. Click "Generate Questions"
5. Preview the 3 questions
6. Click "Send via WhatsApp"
7. Students receive questions instantly
```

#### Option B: Custom Multiple Choice Questions (5 minutes)
```
1. Go to "New Session"
2. Select "Custom Questions" tab
3. Enter topic name and subject
4. Click "+ Add Question"

For each question:
5. Type question (e.g., "What is the capital of India?")
6. Select "Multiple Choice" if it's MCQ
7. Add options:
   - A. New Delhi ✓
   - B. Mumbai
   - C. Bangalore
   - D. Chennai
8. Mark correct answer: "A"
9. Click "Add Question"
10. Repeat for Q2, Q3
11. Click "Start WhatsApp Session"
12. Done! Questions sent to all students
```

---

## Student Experience

### How Students Respond

Students receive on WhatsApp:
```
Hi Rajesh! Your teacher wants to check your understanding 
of today's topic: Indian Geography

Please reply with your answers:

Q1: What is the capital of India?
  A. New Delhi
  B. Mumbai
  C. Bangalore
  D. Chennai

Q2: Which ocean surrounds India?
  A. Atlantic
  B. Indian
  C. Pacific
  D. Arctic

For multiple choice questions, reply with the letter (A, B, C, etc)
Just reply to this message with your answers!
```

**Student replies one of:**
- `A B` (for Q1 and Q2)
- `A, B` (with commas)
- `A;B` (with semicolons)

**Student receives:**
```
Response received. Your teacher will review it and 
send feedback soon. 👍
```

---

## Teacher Dashboard

### Session Management

#### View Real-Time Responses
```
Click on any session → View dashboard

Shows:
- Total students: 25
- Responses received: 18
- Response rate: 72%
- Form status: OPEN / CLOSED
- All student responses with timestamps
- Questions preview on right panel
```

#### Close Form (Stop Accepting Responses)
```
When you're done collecting responses:
1. Click session name
2. Click "Close Form" button
3. New responses are automatically rejected
4. Students get: "Form is now closed"
```

#### Reopen Form (If Needed)
```
1. Click session name
2. Click "Reopen Form" button
3. Late students can still respond
```

---

## Student Information Management

### Update Student Information

```
Go to Roster page → Click "Edit" button

1. Search student by name or phone
2. Click student card
3. Update any field:
   - Name
   - Phone (max 10 digits)
   - Grade
   - Language preference
4. Click "Save Changes"
5. Done!
```

### Phone Number Rules
- **Only digits**: 1234567890 ✅
- **Max 10 digits**: 9876543210 ✅
- **Letters not allowed**: 98765ABCD ❌
- **Symbols not allowed**: 9876-543-210 ❌

---

## Key Features at a Glance

### Feature 1: Multiple Choice Questions
- Create questions with A, B, C, D options
- Students respond with option letters
- Automatic response parsing
- Perfect for formative assessment

### Feature 2: Form Status Control
- Open: Accepting responses
- Closed: No new responses accepted
- Can reopen anytime
- Students notified of status changes

### Feature 3: Student Info Management
- Update student phone numbers (1-10 digits)
- Change language preferences
- Edit grades
- One-click edits

### Feature 4: Student Import
- Import students from other teachers in your school
- Bulk import multiple students
- No duplicates allowed
- Saves time on roster setup

### Feature 5: Real-Time Tracking
- See response rate in real-time
- View all student responses
- Timestamp of each response
- Session status indicators

---

## Troubleshooting

### Students Not Receiving Messages
```
Check:
1. Student phone numbers are correct (10 digits)
2. Form status is "OPEN"
3. WhatsApp is configured in .env file
4. Twilio account has credits
5. Student numbers have WhatsApp installed
```

### Student Response Not Recorded
```
Possible causes:
1. Form was closed before they replied
2. Invalid response format (e.g., "Answer 1" instead of "A")
3. Student not in class roster
4. Network timeout during submission
```

### Can't Import Students
```
Check:
1. Both teachers in same school
2. No duplicate phone numbers
3. Student's current teacher exists
4. Sufficient permissions
```

### Phone Number Validation Fails
```
Ensure:
1. Only digits (0-9)
2. Maximum 10 digits
3. No spaces, dashes, or letters
4. No country code (+91, etc.)
```

---

## Best Practices

### Before Launching Session
- ✅ Verify all student phone numbers
- ✅ Test with 1-2 students first
- ✅ Prepare clear questions
- ✅ Ensure students have WhatsApp
- ✅ Set realistic response deadline

### When Creating Questions
- ✅ Keep questions short & clear
- ✅ Use 3-4 options for MCQ
- ✅ Avoid ambiguous wording
- ✅ Match student grade level
- ✅ Review before launching

### When Reviewing Responses
- ✅ Check common mistakes
- ✅ Identify struggling students
- ✅ Prepare targeted feedback
- ✅ Plan re-teaching if needed
- ✅ Share insights with students

---

## Common Workflows

### Workflow 1: Quick Formative Assessment
```
3 min - Create 3 MCQ questions
1 min - Launch to class
5 min - Students respond
2 min - Review responses & identify misconceptions
11 min - TOTAL TIME
```

### Workflow 2: Custom Assessment
```
5 min - Design custom questions with options
2 min - Import students from colleague
1 min - Launch session
5 min - Monitor responses
3 min - Review & plan next steps
16 min - TOTAL TIME
```

### Workflow 3: Student Management
```
2 min - Edit student information
1 min - Import 5 students from other teacher
2 min - Verify all phone numbers
5 min - TOTAL TIME
```

---

## Advanced Tips

### Tip 1: Use Both AI and Custom
- Use **AI-generated** for standardized topics
- Use **Custom** for specific concepts you want to test
- Mix throughout the year

### Tip 2: Batch Import Students
- Get student list from other teachers
- Import entire class at once
- Saves time on manual entry

### Tip 3: Monitor Response Rate
- Close form at 80-90% response
- Wait for stragglers (give 5 min)
- Data quality > quantity

### Tip 4: Reopen Form Strategically
- Close initially to review responses
- Reopen for students who couldn't respond
- Set specific deadline (e.g., "15 minutes")

### Tip 5: Track Over Time
- Compare results across sessions
- See student improvement
- Identify persistent misconceptions

---

## Data Privacy & Security

✅ **Your data is secure:**
- Phone numbers encrypted in database
- WhatsApp messages sent securely via Twilio
- Teacher accounts are password-protected
- Student responses are private to teacher
- No data shared with third parties

✅ **Teacher controls:**
- Can edit/delete student information
- Can close forms anytime
- Can review responses privately
- Full access to student data

---

## Support & Help

### Need Help?
```
1. Check this guide first
2. Review design principles (human-centered)
3. Try the troubleshooting section
4. Contact your school administrator
5. Reach out to the support team
```

### Feedback or Suggestions?
```
We'd love to hear from you!
Submit feature requests or bug reports to:
team@shiksha-lens.edu
```

---

## Summary

🎯 **ShikshaLens makes formative assessment:**
- ✅ Quick (3-5 minutes)
- ✅ Easy (1-2 clicks)
- ✅ Effective (real-time insights)
- ✅ Scalable (1 student → 1000+)
- ✅ Affordable (low bandwidth)

**You're ready to transform learning in your classroom!**

Start with Step 1 above and you'll be sending questions via WhatsApp in minutes.

Good luck! 🚀
