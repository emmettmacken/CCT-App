export type Appointment = {
    dateTime: string;
    duration: number;
    type: string;
    location: string;
    clinician_name: string;
    clinician_contact: string;
    fasting_required?: boolean;
    medications_to_avoid?: string;
    special_instructions?: string;
    name?: string;
};
export type AppointmentData = {
    marked: boolean;
    dotColor: string;
    selected: boolean;
    selectedColor: string;
    appointmentData: any;
};