export const dateReader = (timestamp: number) => {
  // Convert to milliseconds
  const date = new Date(timestamp);

  // Get readable date components
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // Months are zero-based in JavaScript
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Format the date as a string
  const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")} ${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Format the date as a string
  const newFormattedDate = `${year}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")} ${hours}:${minutes}${seconds}`;

  return newFormattedDate;
};
