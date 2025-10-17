import { parseISO } from "date-fns";

export const getAppointmentDateTime = (appt: any) => {
  if (appt.time) {
    return parseISO(`${appt.date}T${appt.time}`);
  }
  return parseISO(appt.date);
};

export const addDays = (date: Date, days: number) => {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
};

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}-${month}-${year}`;
};

export const parseDateUTC = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};
