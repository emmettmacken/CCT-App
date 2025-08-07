import { parseISO, isSameDay } from 'date-fns';
import { Appointment } from '../../types/clinCalendar';

export const getDotColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'checkup': return '#4CAF50';
    case 'treatment': return '#FF9800';
    case 'consultation': return '#2196F3';
    default: return '#9C27B0';
  }
};

export const getMarkedDates = (
  appointments: Appointment[],
  selectedAppointment: Appointment | null
) => {
  const marked: Record<string, any> = {};
  appointments.forEach(appt => {
    const date = appt.date.split('T')[0];
    if (!marked[date]) {
      marked[date] = { marked: true, dotColor: getDotColor(appt.type) };
    } else {
      marked[date].dots = marked[date].dots || [];
      marked[date].dots.push({ color: getDotColor(appt.type) });
    }

    if (selectedAppointment && isSameDay(parseISO(appt.date), parseISO(selectedAppointment.date))) {
      marked[date].selected = true;
      marked[date].selectedColor = '#3f51b5';
    }
  });

  return marked;
};

export const getAppointmentsForDay = (appointments: Appointment[], day: string) =>
  appointments.filter(appt => appt.date.split('T')[0] === day);
