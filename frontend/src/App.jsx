import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import OtpVerificationPage from "./pages/OtpVerificationPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";
import CallOverlay from "./components/CallOverlay";

import { Toaster } from "react-hot-toast";

function App() {
  const { checkAuth, isCheckingAuth, authUser, pendingVerificationEmail } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen bg-surface relative">
      <Routes>
        <Route path="/" element={authUser ? <ChatPage /> : <Navigate to="/login" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />

        {/* OTP route: accessible only when there's a pending email OR user isn't authed yet */}
        <Route
          path="/verify-otp"
          element={
            authUser ? (
              <Navigate to="/" />
            ) : pendingVerificationEmail ? (
              <OtpVerificationPage />
            ) : (
              <Navigate to="/signup" />
            )
          }
        />
      </Routes>

      <Toaster />

      {/* WebRTC call overlay — mounted at root so it floats above all pages */}
      <CallOverlay />
    </div>
  );
}
export default App;
