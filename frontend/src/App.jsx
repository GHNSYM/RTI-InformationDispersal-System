import { BrowserRouter, Routes } from 'react-router-dom';
import routes from './routes/userRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {routes}
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
