# Requirements Document

## Introduction

Система онлайн-записи на консультации для адвокатского бюро. Позволяет клиентам записываться на консультации к юристам, юристам — управлять своим расписанием, а суперадмину — контролировать всю систему.

## Glossary

- **System**: Веб-приложение для онлайн-записи на консультации
- **Client**: Посетитель сайта, записывающийся на консультацию (без авторизации)
- **Lawyer**: Авторизованный юрист, управляющий своим расписанием
- **Superadmin**: Администратор системы с полным доступом
- **Time_Slot**: Временной интервал, доступный для записи
- **Appointment**: Запись клиента на консультацию
- **Supabase_Client**: Клиент для взаимодействия с Supabase API

## Requirements

### Requirement 1: Просмотр списка юристов

**User Story:** As a Client, I want to view a list of available lawyers, so that I can choose a specialist for my consultation.

#### Acceptance Criteria

1. WHEN a Client visits the home page, THE System SHALL display a list of lawyers as cards with photo, name, and specialization
2. WHEN a Client clicks on a lawyer card, THE System SHALL navigate to the lawyer's booking page
3. WHILE the lawyers list is loading, THE System SHALL display a loading indicator
4. IF no lawyers are available, THEN THE System SHALL display an appropriate message

### Requirement 2: Выбор времени консультации

**User Story:** As a Client, I want to select an available time slot, so that I can book a consultation at a convenient time.

#### Acceptance Criteria

1. WHEN a Client views a lawyer's booking page, THE System SHALL display a calendar with available dates
2. WHEN a Client selects a date, THE System SHALL display available time slots for that date
3. WHEN a Client selects a time slot, THE System SHALL highlight the selected slot and enable the booking form
4. IF no time slots are available for a selected date, THEN THE System SHALL display a message suggesting to choose another date
5. THE System SHALL only display time slots where is_available equals true

### Requirement 3: Форма записи на консультацию

**User Story:** As a Client, I want to fill out a booking form, so that I can complete my appointment request.

#### Acceptance Criteria

1. WHEN a Client submits the booking form, THE System SHALL validate all required fields (name, phone, email)
2. WHEN validation passes, THE System SHALL create an Appointment with status "pending"
3. WHEN an Appointment is created, THE System SHALL mark the Time_Slot as unavailable
4. WHEN booking is successful, THE System SHALL navigate to a confirmation page
5. IF validation fails, THEN THE System SHALL display specific error messages for each invalid field
6. THE System SHALL validate email format using standard email regex pattern
7. THE System SHALL validate phone format

### Requirement 4: Подтверждение записи

**User Story:** As a Client, I want to see a confirmation of my booking, so that I know my appointment was successfully created.

#### Acceptance Criteria

1. WHEN a Client completes booking, THE System SHALL display a confirmation page with appointment details
2. THE System SHALL display the lawyer name, date, time, and client information on the confirmation page

### Requirement 5: Авторизация юриста

**User Story:** As a Lawyer, I want to log in to the system, so that I can manage my schedule and appointments.

#### Acceptance Criteria

1. WHEN a Lawyer enters valid credentials, THE System SHALL authenticate via Supabase Auth and redirect to the dashboard
2. IF credentials are invalid, THEN THE System SHALL display an error message
3. WHEN a Lawyer logs out, THE System SHALL clear the session and redirect to the login page
4. THE System SHALL store user role in the users table and verify it on protected routes

### Requirement 6: Дашборд юриста

**User Story:** As a Lawyer, I want to see today's appointments on my dashboard, so that I can prepare for consultations.

#### Acceptance Criteria

1. WHEN a Lawyer views the dashboard, THE System SHALL display a table of today's appointments
2. THE System SHALL display appointment time, client name, contact information, and status in the table
3. WHILE appointments are loading, THE System SHALL display a loading indicator

### Requirement 7: Управление временными слотами

**User Story:** As a Lawyer, I want to create and manage time slots, so that clients can book consultations.

#### Acceptance Criteria

1. WHEN a Lawyer creates a new time slot, THE System SHALL validate that date, start_time, and end_time are provided
2. WHEN a Lawyer creates a time slot, THE System SHALL save it to the time_slots table with is_available set to true
3. THE System SHALL prevent creating overlapping time slots for the same lawyer
4. WHEN a Lawyer views the slots page, THE System SHALL display all their time slots grouped by date

### Requirement 8: Просмотр и управление записями юриста

**User Story:** As a Lawyer, I want to view and manage all my appointments, so that I can track and update their status.

#### Acceptance Criteria

1. WHEN a Lawyer views the appointments page, THE System SHALL display all their appointments
2. THE System SHALL allow filtering appointments by date and status
3. WHEN a Lawyer cancels an appointment, THE System SHALL update the status to "cancelled"
4. WHEN an appointment is cancelled, THE System SHALL mark the associated Time_Slot as available again

### Requirement 9: Панель суперадмина — список юристов

**User Story:** As a Superadmin, I want to view all lawyers with their statistics, so that I can monitor the system.

#### Acceptance Criteria

1. WHEN a Superadmin views the lawyers list, THE System SHALL display all lawyers with their appointment counts
2. THE System SHALL display total appointments and completed appointments for each lawyer

### Requirement 10: Панель суперадмина — все записи

**User Story:** As a Superadmin, I want to view all appointments in the system, so that I can monitor booking activity.

#### Acceptance Criteria

1. WHEN a Superadmin views the appointments page, THE System SHALL display all appointments from all lawyers
2. THE System SHALL allow filtering by lawyer, date, and status

### Requirement 11: Защищенные маршруты

**User Story:** As a System, I want to protect routes based on user roles, so that unauthorized users cannot access restricted areas.

#### Acceptance Criteria

1. WHEN an unauthenticated user tries to access a protected route, THE System SHALL redirect to the login page
2. WHEN a Lawyer tries to access superadmin routes, THE System SHALL redirect to the lawyer dashboard
3. WHEN a Superadmin tries to access lawyer routes, THE System SHALL allow access (superadmin has full access)
4. THE System SHALL verify user role from the users table on each protected route access

### Requirement 12: Валидация форм

**User Story:** As a System, I want to validate all form inputs, so that data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL use react-hook-form with zod for form validation
2. WHEN a form field is invalid, THE System SHALL display the error message below the field
3. THE System SHALL validate required fields, email format, and phone format

### Requirement 13: Обработка ошибок и уведомления

**User Story:** As a User, I want to see clear error messages and notifications, so that I understand what happened.

#### Acceptance Criteria

1. WHEN an API request fails, THE System SHALL display a user-friendly error message
2. WHEN an action is successful, THE System SHALL display a success notification
3. THE System SHALL handle network errors gracefully

### Requirement 14: Адаптивный дизайн

**User Story:** As a User, I want to use the system on any device, so that I can book consultations from mobile or desktop.

#### Acceptance Criteria

1. THE System SHALL implement mobile-first responsive design
2. THE System SHALL use Tailwind CSS breakpoints for responsive layouts
3. THE System SHALL ensure all UI components are usable on screens from 320px width

### Requirement 15: Настройка Supabase

**User Story:** As a Developer, I want to have Supabase properly configured, so that the application can interact with the database.

#### Acceptance Criteria

1. THE System SHALL configure Supabase_Client with environment variables for URL and anon key
2. THE System SHALL create database migrations for all required tables
3. THE System SHALL set up Row Level Security policies for data protection
