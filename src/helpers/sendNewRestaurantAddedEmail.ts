import sendEmail from "@/lib/nodemailer";
import { render } from "@react-email/components";
import { ApiResponse } from "@/types/ApiResponse";
import RestaurantSubmissionEmail from "../../emails/RestaurantSubmissionEmail";

export async function sendRestaurantSubmissionEmail(
  email: string,
  username: string,
  restaurant: {
    name: string;
    orderCode: string;
    address: string;
    city: string;
    accentColor: string;
  }
): Promise<ApiResponse> {
  try {
    const emailHtml = await render(
      RestaurantSubmissionEmail({ username, restaurant })
    );
    await sendEmail({
      email,
      subject: "NUSTBites | Restaurant Submission",
      emailHtml,
    });
    return {
      success: true,
      message: "Restaurant submission email sent successfully",
    };
  } catch (emailError) {
    console.error("Error sending restaurant submission email:", emailError);
    return {
      success: false,
      message: "Failed to send restaurant submission email",
    };
  }
}
