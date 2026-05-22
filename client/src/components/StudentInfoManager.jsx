import React, { useState } from 'react';
import './StudentInfoManager.css';

export default function StudentInfoManager({ students, teacherId, onClose }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setEditData(student);
    setError('');
    setSuccess('');
  };

  const handleChange = (field, value) => {
    // Validate phone number
    if (field === 'phone') {
      value = String(value).replace(/[^0-9]/g, '').slice(0, 10);
    }

    setEditData({
      ...editData,
      [field]: value
    });
  };

  const handleSave = async () => {
    if (!editData.name?.trim()) {
      setError('Name is required');
      return;
    }

    if (!editData.phone?.trim()) {
      setError('Phone is required');
      return;
    }

    if (!/^\d{1,10}$/.test(editData.phone)) {
      setError('Phone must be 1-10 digits only');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/students/${editData._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editData.name,
          phone: editData.phone,
          grade: editData.grade,
          language: editData.language
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to update student');
        setLoading(false);
        return;
      }

      setSuccess(`${data.student.name} updated successfully!`);
      setSelectedStudent(null);

      // Refresh the students list
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="student-info-manager">
      <div className="manager-header">
        <h2>Update Student Information</h2>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="manager-content">
        <div className="students-list">
          <h3>Select Student</h3>
          <div className="student-items">
            {students && students.length > 0 ? (
              students.map((student) => (
                <button
                  key={student._id}
                  onClick={() => handleSelectStudent(student)}
                  className={`student-item ${selectedStudent?._id === student._id ? 'selected' : ''}`}
                >
                  <div className="student-name">{student.name}</div>
                  <div className="student-phone">{student.phone}</div>
                </button>
              ))
            ) : (
              <p className="no-students">No students found</p>
            )}
          </div>
        </div>

        {selectedStudent && (
          <div className="edit-form">
            <h3>Edit Student Details</h3>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Student name"
              />
            </div>

            <div className="form-group">
              <label>Phone Number (10 digits max)</label>
              <input
                type="tel"
                value={editData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Enter phone number"
                maxLength="10"
              />
              <small>Only digits allowed, maximum 10 digits</small>
            </div>

            <div className="form-group">
              <label>Grade</label>
              <input
                type="text"
                value={editData.grade || ''}
                onChange={(e) => handleChange('grade', e.target.value)}
                placeholder="e.g., 5, 6"
              />
            </div>

            <div className="form-group">
              <label>Language Preference</label>
              <select
                value={editData.language || 'English'}
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <option>English</option>
                <option>Hindi</option>
                <option>Marathi</option>
                <option>Tamil</option>
                <option>Telugu</option>
              </select>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="action-buttons">
              <button
                onClick={handleSave}
                className="save-btn"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="cancel-btn"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
