import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Protected from './components/Protected';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Citas from './pages/Citas';
import Historial from './pages/Historial';
import HistorialPaciente from './pages/HistorialPaciente';
import ChatList from './pages/ChatList';
import ChatRoom from './pages/ChatRoom';
import Admin from './pages/Admin';

function App() {
  const { user, loading } = useAuth();

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="registro" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route
          path="citas"
          element={
            <Protected roles={['patient', 'doctor']}>
              <Citas />
            </Protected>
          }
        />
        <Route
          path="historial"
          element={
            <Protected roles={['patient', 'doctor']}>
              <Historial />
            </Protected>
          }
        />
        <Route
          path="historial/paciente/:patientId"
          element={
            <Protected roles={['doctor']}>
              <HistorialPaciente />
            </Protected>
          }
        />
        <Route
          path="chat"
          element={
            <Protected roles={['patient', 'doctor']}>
              <ChatList />
            </Protected>
          }
        />
        <Route
          path="chat/:userId"
          element={
            <Protected roles={['patient', 'doctor']}>
              <ChatRoom />
            </Protected>
          }
        />
        <Route
          path="admin"
          element={
            <Protected roles={['admin']}>
              <Admin />
            </Protected>
          }
        />
        <Route path="*" element={loading ? null : <Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
