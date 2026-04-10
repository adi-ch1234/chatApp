import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate, createOtpEmailTemplate } from "../emails/emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to Loqui!",
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }

  console.info("[Email] Welcome email sent successfully to:", data);
};

export const sendOtpEmail = async (email, name, otp) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Your Loqui Verification Code",
    html: createOtpEmailTemplate(name, otp),
  });

  if (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send verification email");
  }

  console.info("[Email] OTP email sent successfully to:", data);
};
