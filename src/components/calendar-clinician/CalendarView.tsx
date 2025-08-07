import React from 'react';
import { Calendar } from 'react-native-calendars';
import { styles } from '../../styles/clinicianCalendar';

type Props = {
  markedDates: any;
  onDayPress: (day: { dateString: string }) => void;
};

const CalendarView = ({ markedDates, onDayPress }: Props) => (
  <Calendar
    current={new Date().toISOString()}
    minDate={new Date().toISOString()}
    markedDates={markedDates}
    onDayPress={onDayPress}
    markingType="multi-dot"
    theme={{
      calendarBackground: '#ffffff',
      textSectionTitleColor: '#3f51b5',
      selectedDayBackgroundColor: '#3f51b5',
      selectedDayTextColor: '#ffffff',
      todayTextColor: '#3f51b5',
      dayTextColor: '#2d4150',
      textDisabledColor: '#d9e1e8',
      dotColor: '#3f51b5',
      selectedDotColor: '#ffffff',
      arrowColor: '#3f51b5',
      monthTextColor: '#3f51b5',
      indicatorColor: '#3f51b5',
      textDayFontSize: 16,
      textMonthFontSize: 16,
      textDayHeaderFontSize: 16
    }}
    style={styles.calendar}
  />
);

export default CalendarView;
