export function getHebrewDay(dateString){
  const daysHebrew = ["יום ראשון","יום שני","יום שלישי","יום רביעי","יום חמישי","יום שישי","שבת"];
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return daysHebrew[date.getDay()];
}
