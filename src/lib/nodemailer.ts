import nodemailer from "nodemailer";

export default async function sendEmail({
  email,
  subject,
  emailHtml,
}: {
  email: string | string[];
  subject: string;
  emailHtml: string;
}) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: process.env.APP_EMAIL!,
        pass: process.env.APP_EMAIL_PASSWORD!,
      },
    });

    const mailOptions = {
      from: {
        name: "NUSTBites",
        address: process.env.APP_EMAIL!,
      },
      to: Array.isArray(email) ? email : [email], // ✅ Handles both string and array
      subject,
      html: emailHtml,
    };

    const mailResponse = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", mailResponse);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}
