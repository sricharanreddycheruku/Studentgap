import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NewSession from './pages/NewSession';
import Roster from './pages/Roster';
import SessionResults from './pages/SessionResults';
import StudentProgress from './pages/StudentProgress';
import WhatsAppSetup from './pages/WhatsAppSetup';

const hasTeacherSession = () => Boolean(localStorage.getItem('classpulse-teacher'));

const RequireTeacher = ({ children }) => (
  hasTeacherSession() ? children : <Navigate to="/login" replace />
);

const App = () => {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#11233f]">
      <Navbar />
      <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireTeacher><Dashboard /></RequireTeacher>} />
          <Route path="/roster" element={<RequireTeacher><Roster /></RequireTeacher>} />
          <Route path="/whatsapp" element={<RequireTeacher><WhatsAppSetup /></RequireTeacher>} />
          <Route path="/session/new" element={<RequireTeacher><NewSession /></RequireTeacher>} />
          <Route path="/sessions/new" element={<RequireTeacher><NewSession /></RequireTeacher>} />
          <Route path="/session/:sessionId" element={<RequireTeacher><SessionResults /></RequireTeacher>} />
          <Route path="/sessions/:sessionId" element={<RequireTeacher><SessionResults /></RequireTeacher>} />
          <Route path="/student/:studentId" element={<RequireTeacher><StudentProgress /></RequireTeacher>} />
          <Route path="/students/:studentId" element={<RequireTeacher><StudentProgress /></RequireTeacher>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
