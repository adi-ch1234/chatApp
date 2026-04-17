import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { ShieldCheckIcon, MailIcon, LoaderIcon, RefreshCwIcon } from "lucide-react";

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60;

function OtpVerificationPage() {
  const navigate = useNavigate();
  const { pendingVerificationEmail, verifyOtp, resendOtp, isVerifyingOtp, isResendingOtp } =
    useAuthStore();

  // 6-digit OTP stored as an array of strings
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);

  // Countdown timers
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // Redirect to login if there's no pending email (e.g. user navigated here directly)
  useEffect(() => {
    if (!pendingVerificationEmail) {
      navigate("/login", { replace: true });
    }
  }, [pendingVerificationEmail, navigate]);

  // OTP expiry countdown
  useEffect(() => {
    if (expirySeconds <= 0) return;
    const id = setInterval(() => setExpirySeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [expirySeconds]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ── Digit input logic ──────────────────────────────────────────────────────

  const handleChange = (index, value) => {
    // Accept only single digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);

    // Auto-advance to next box
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Clear current box
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else if (index > 0) {
        // Move focus back and clear prev box
        inputRefs.current[index - 1]?.focus();
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => (next[i] = char));
    setDigits(next);
    // Focus last filled box
    const lastIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIdx]?.focus();
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const otp = digits.join("");
      if (otp.length < OTP_LENGTH) return;
      const success = await verifyOtp(otp);
      if (success) navigate("/", { replace: true });
    },
    [digits, verifyOtp, navigate]
  );

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0 || isResendingOtp) return;
    await resendOtp();
    setExpirySeconds(OTP_EXPIRY_SECONDS);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setDigits(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  }, [resendCooldown, isResendingOtp, resendOtp]);

  const isComplete = digits.every((d) => d !== "");
  const isExpired = expirySeconds <= 0;

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-surface">
      <div className="relative w-full max-w-lg">
        <BorderAnimatedContainer>
          <div className="p-8 md:p-10 flex flex-col items-center w-full">

            {/* Icon + Heading */}
            <div className="text-center mb-8">
              <div className="relative inline-flex mb-4">
                <div className="absolute inset-0 rounded-full bg-primary-action/20 blur-xl" />
                <div className="relative w-16 h-16 rounded-full bg-el-1 border border-outline-variant flex items-center justify-center">
                  <ShieldCheckIcon className="w-8 h-8 text-primary-action" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-on-surface mb-2">Verify Your Email</h1>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                We sent a 6-digit code to
              </p>
              <div className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-el-1 border border-outline-variant">
                <MailIcon className="w-3.5 h-3.5 text-primary-action" />
                <span className="text-primary text-sm font-medium">
                  {pendingVerificationEmail}
                </span>
              </div>
            </div>

            {/* OTP inputs */}
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex justify-center gap-2 md:gap-3 mb-6" onPaste={handlePaste}>
                {digits.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-digit-${i}`}
                    ref={(el) => (inputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={isVerifyingOtp || isExpired}
                    autoFocus={i === 0}
                    className={[
                      "w-11 h-14 md:w-13 md:h-16 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200",
                      "bg-el-1 text-on-surface placeholder-outline",
                      digit
                        ? "border-primary-action shadow-[0_0_12px_rgba(0,122,255,0.25)]"
                        : "border-outline-variant focus:border-primary-action/70",
                      isExpired ? "opacity-40 cursor-not-allowed" : "",
                    ].join(" ")}
                  />
                ))}
              </div>

              {/* Expiry timer */}
              <div className="text-center mb-5">
                {isExpired ? (
                  <p className="text-ds-error text-sm font-medium">
                    Code expired — please request a new one.
                  </p>
                ) : (
                  <p className="text-outline text-sm">
                    Code expires in{" "}
                    <span
                      className={`font-mono font-semibold ${
                        expirySeconds < 60 ? "text-ds-error" : "text-primary-action"
                      }`}
                    >
                      {formatTime(expirySeconds)}
                    </span>
                  </p>
                )}
              </div>

              {/* Verify button */}
              <button
                id="verify-otp-btn"
                type="submit"
                disabled={!isComplete || isVerifyingOtp || isExpired}
                className="auth-btn flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifyingOtp ? (
                  <>
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </form>

            {/* Resend section */}
            <div className="mt-6 text-center">
              <p className="text-outline text-sm mb-2">Didn't receive the code?</p>
              <button
                id="resend-otp-btn"
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResendingOtp}
                className={[
                  "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
                  resendCooldown > 0 || isResendingOtp
                    ? "text-outline-variant cursor-not-allowed"
                    : "text-primary-action hover:text-primary",
                ].join(" ")}
              >
                {isResendingOtp ? (
                  <>
                    <LoaderIcon className="w-3.5 h-3.5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="w-3.5 h-3.5" />
                    {resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend Code"}
                  </>
                )}
              </button>
            </div>

            {/* Subtle back link */}
            <p className="mt-6 text-xs text-outline-variant">
              Wrong email?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-outline hover:text-on-surface transition-colors underline underline-offset-2"
              >
                Go back to sign up
              </button>
            </p>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default OtpVerificationPage;
