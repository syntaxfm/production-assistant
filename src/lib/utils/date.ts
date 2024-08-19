export function get_days_in_month(active_date: string) {
  const date = Temporal.PlainDate.from(active_date);
  return date.daysInMonth;
}

// incoming date format: 2024-01-01
export function parse_date(date: string): [year: number, month: number, day: number] {
  const [year, month, day] = date.split("-").map(Number);

  // it's fine if month returns a negative number
  // new Date(2024, -1, 1) will return new Date(2023, 11, 1)
  return [year, month - 1, day]; // month is 0 indexed
}

export function get_param_date(date = Temporal.Now.plainDateISO()) {
  return date.toString();
}
export function format_month_name(date = Temporal.Now.plainDateISO()) {
  return date.toLocaleString("en-US", { month: "long" });
}
export function format_month_year(date = Temporal.Now.plainDateISO()) {
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

// Gets the date from iso string
export function iso_to_plain_date(date?: string | null) {
  if (date) {
    const date_only = date.split("T")[0];
    Temporal.PlainDate.from(date_only);
  }
  return Temporal.Now.plainDateISO();
}

// Function to format a Temporal ISO date to 'MM/dd'
export function format_mmdd(isoString: string): string {
  const date = Temporal.PlainDate.from(isoString);
  return date.toLocaleString("en-US", { month: "2-digit", day: "2-digit" });
}

export function is_in_future(iso_string: string) {
  const date = Temporal.PlainDate.from(iso_string);
  return Temporal.PlainDate.compare(date, Temporal.Now.plainDateISO()) > 0;
}

export function generate_id(): number {
  const now = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return parseInt(`${now}${random.toString().padStart(3, "0")}`);
}
