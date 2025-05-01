import sendEmail from "@/lib/nodemailer";
import VerificationEmail from "../../emails/VerificationEmail";
import { render } from "@react-email/components";
import { ApiResponse } from "@/types/ApiResponse";

export async function sendVerificationEmail(
  email: string,
  username: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    const emailHtml = await render(
      VerificationEmail({ username, otp: verifyCode })
    );
    await sendEmail({
      email,
      subject: "NUSTBites | Verification Code",
      emailHtml,
    });
    return {
      success: true,
      message: "Verification email sent successfully",
    };
  } catch (emailError) {
    console.error("Error sending verification email:", emailError);
    return {
      success: false,
      message: "Failed to send verification email",
    };
  }
}
