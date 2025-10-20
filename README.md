Cancer Clinical Trials Mobile App
Executive Summary

The Cancer Clinical Trials App is a full-stack cross-platform mobile application developed for the Mid-West Cancer Centre. Its primary goal is to enhance communication, scheduling, and support for patients participating in cancer clinical trials.

The app provides patients with a 12-month calendar of trial-related appointments, automated reminders and fasting notifications, FAQ's and medication tracking - all accessible through an intuitive interface. Clinicians and administrators can manage appointments, update trial data, and monitor patient engagement directly through integrated dashboards.

The system is built using React Native (Expo) for the frontend and Supabase for backend services (authentication, database, edge functions). Github Workflow actions are utilised for scheduling of notifications.

Patient Features:

The patient-facing side of the app focuses on convenience, clarity, and engagement during clinical trial participation.

Appointment Management
12-Month Interactive Calendar displaying all scheduled appointments.
Appointment Details Modal includes fasting requirements, medication notes, and preparation steps.
Automated Notifications sent at 10am and 7pm the day before each appointment.

Medication Log
Record trial medication name, frequency, and dates.
Track additional medications taken that are not part of the trial.
Track any side effects or illnesses experienced during the trial.
View historical logs to track adherence and trends.
Print all logs or within a certain range of dates.

FAQ
View common FAQ's about the trial added by clinicians to support you.
Find contact details if more help is required.

Profile & Settings
Update personal information.
Secure login/register using email.

Clinician Features:
Clinicians can efficiently manage and monitor patient schedules and engagement.

Appointment Management
View and manage all clinical trial appointments in a structured calendar view.
Reschedule, add, or remove appointments as needed.
Offset all patient appointments by a number of days.
Filter appointments by patient.

Patient Overview
Assign a patient a trial. 
Access individual patient timelines and progress summaries.
View all logs associated with a patient.
A shared notes section for complete transparency

Admin Features:
Administrators oversee data integrity, access control, and system maintenance.

User Management
Add or remove patients and clinicians from the Supabase backend.
Assign roles and permissions for secure access control.

Data Oversight
Monitor active trials, appointments, and create new trials.
Mass edit all patient appointments/medications per trial.

Tech Stack:
Frontend: React Native (Expo)
Backend: Supabase (PostgreSQL, Auth, Storage, Functions)
Notifications: Expo Notifications API + Github Workflow Actions
