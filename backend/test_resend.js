import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resendClient = new Resend(process.env.RESEND_API_KEY);

async function test() {
  const { data, error } = await resendClient.emails.send({
    from: `Aditya <${process.env.EMAIL_FROM}>`,
    to: "test@example.com",
    subject: "Test",
    html: "<p>TEST</p>"
  });
  console.log("Data:", data);
  console.log("Error:", error);
}

test();
