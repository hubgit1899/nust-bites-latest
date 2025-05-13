// Helper function to get current minutes from midnight in Pakistan timezone
export function getCurrentMinutesInPakistan() {
  try {
    // Use the Intl API for better timezone handling
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Karachi", // Pakistan timezone
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });

    const timeString = formatter.format(now);
    const [hours, minutes] = timeString.split(":").map(Number);

    return hours * 60 + minutes;
  } catch (error) {
    // Fallback to server time if timezone conversion fails
    console.error("Timezone conversion error:", error);
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

export function formatTime(minutes: number) {
  const hrs24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hrs24 >= 12 ? "PM" : "AM";
  const hrs12 = hrs24 % 12 === 0 ? 12 : hrs24 % 12;
  return `${hrs12.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")} ${period}`;
}
