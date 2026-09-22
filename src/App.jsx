import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import BackToTop from './components/BackToTop';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import AcademicsPage from './pages/AcademicsPage';
import PlacementsPage from './pages/PlacementsPage';
import CampusLifePage from './pages/CampusLifePage';
import LostFoundPage from './pages/LostFoundPage';
import CommunitiesPage from './pages/CommunitiesPage';
import ChatPage from './pages/ChatPage';
import EventsPage from './pages/EventsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/academics" element={<AcademicsPage />} />
          <Route path="/placements" element={<PlacementsPage />} />
          <Route path="/campus-life" element={<CampusLifePage />} />
          <Route path="/lost-found" element={<LostFoundPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <BackToTop />
    </BrowserRouter>
  );
}

export default App;
