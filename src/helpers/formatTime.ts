export function formatTime(minutes: number) {
  const hrs24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hrs24 >= 12 ? "PM" : "AM";
  const hrs12 = hrs24 % 12 === 0 ? 12 : hrs24 % 12;
  return `${hrs12.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")} ${period}`;
}
