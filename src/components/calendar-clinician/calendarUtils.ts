import { parseISO, isSameDay } from 'date-fns';
import { Appointment } from '../../types/clinCalendar';

export const getDotColor = (type: string) => {
  switch (type.toLowerCase()) {
    default: return '#2196F3';
  }
};

export const getMarkedDates = (
  appointments: Appointment[],
  selectedAppointment: Appointment | null
) => {
  const marked: Record<string, any> = {};

  appointments.forEach(appt => {

    const date = appt.date.split('T')[0];

    marked[date] = {
      selected: true,
      selectedColor: '#3f51b5',
      selectedTestColor: '#ffffff',
    };

    if (selectedAppointment && isSameDay(parseISO(appt.date), parseISO(selectedAppointment.date))) {
      marked[date] = {
        ...marked[date],
        selectedColor: '#1e3a8a',
      };
    }
  });

  return marked;
};

export const getAppointmentsForDay = (appointments: Appointment[], day: string) =>
  appointments.filter(appt => appt.date.split('T')[0] === day);