# Implementation Plan: Lawyer Booking System

## Overview

Пошаговая реализация системы онлайн-записи для адвокатского бюро. Начинаем с настройки проекта и базы данных, затем реализуем авторизацию, публичную часть и личные кабинеты.

## Tasks

- [x] 1. Настройка проекта и инфраструктуры
  - [x] 1.1 Инициализация Vite + React + TypeScript проекта
    - Создать проект с помощью Vite
    - Настроить TypeScript конфигурацию
    - _Requirements: 15.1_

  - [x] 1.2 Установка и настройка зависимостей
    - Установить Tailwind CSS, Shadcn/ui, React Router, React Query, react-hook-form, zod
    - Настроить Tailwind CSS
    - Инициализировать Shadcn/ui
    - _Requirements: 14.1, 14.2_

  - [x] 1.3 Настройка Supabase клиента
    - Создать lib/supabase.ts с конфигурацией клиента
    - Настроить переменные окружения (.env)
    - _Requirements: 15.1_

  - [x] 1.4 Создание TypeScript типов
    - Создать types/index.ts со всеми интерфейсами (User, Lawyer, TimeSlot, Appointment)
    - _Requirements: 3.1, 3.2_

- [x] 2. Создание SQL миграций для Supabase
  - [x] 2.1 Создать миграцию для таблиц базы данных
    - Создать файл supabase/migrations с SQL для всех таблиц
    - Включить индексы и ограничения
    - _Requirements: 15.2_

  - [x] 2.2 Создать RLS политики
    - Добавить Row Level Security политики для всех таблиц
    - _Requirements: 15.3_

- [x] 3. Настройка UI компонентов Shadcn/ui
  - [x] 3.1 Добавить базовые компоненты Shadcn/ui
    - Button, Card, Input, Label, Form, Table, Calendar, Select, Dialog, Toast
    - _Requirements: 14.1_

- [x] 4. Реализация авторизации
  - [x] 4.1 Создать хук useAuth
    - Реализовать signIn, signOut, получение текущего пользователя и роли
    - _Requirements: 5.1, 5.3, 5.4_

  - [x] 4.2 Создать компонент LoginForm
    - Форма входа с валидацией через zod
    - Обработка ошибок авторизации
    - _Requirements: 5.1, 5.2, 12.1, 12.2_

  - [x] 4.3 Создать компонент ProtectedRoute
    - Проверка авторизации и роли пользователя
    - Редирект на login или dashboard при несоответствии роли
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ]*4.4 Написать property-тест для защиты маршрутов
    - **Property 11: Route Protection by Role**
    - **Validates: Requirements 11.1, 11.2, 11.3**

- [x] 5. Checkpoint - Проверка авторизации
  - Убедиться, что авторизация работает корректно
  - Проверить защиту маршрутов
  - Спросить пользователя, если возникнут вопросы

- [x] 6. Реализация публичной части - Список юристов
  - [x] 6.1 Создать хук useLawyers
    - Получение списка юристов из Supabase
    - Использование React Query для кэширования
    - _Requirements: 1.1_

  - [x] 6.2 Создать компонент LawyerCard
    - Карточка юриста с фото, именем, специализацией
    - Обработка клика для перехода к бронированию
    - _Requirements: 1.1, 1.2_

  - [x] 6.3 Создать страницу HomePage
    - Список юристов с загрузочным состоянием
    - Обработка пустого списка
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 7. Реализация публичной части - Бронирование
  - [x] 7.1 Создать хук useTimeSlots
    - Получение доступных слотов для юриста
    - Фильтрация по дате и доступности
    - _Requirements: 2.1, 2.2, 2.5_

  - [ ]*7.2 Написать property-тест для фильтрации слотов
    - **Property 1: Available Slots Filtering**
    - **Validates: Requirements 2.5**

  - [x] 7.3 Создать компонент TimeSlotPicker
    - Календарь для выбора даты
    - Список доступных слотов для выбранной даты
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 7.4 Создать компонент BookingForm
    - Форма с полями: имя, телефон, email, комментарий
    - Валидация через zod
    - _Requirements: 3.1, 3.5, 3.6, 3.7, 12.1, 12.2_

  - [ ]*7.5 Написать property-тест для валидации формы
    - **Property 4: Form Validation - Email and Phone**
    - **Validates: Requirements 3.6, 3.7**

  - [x] 7.6 Создать хук useAppointments
    - Создание записи
    - Обновление доступности слота
    - _Requirements: 3.2, 3.3_

  - [ ]*7.7 Написать property-тест для создания записи
    - **Property 2: Booking Creates Pending Appointment**
    - **Property 3: Booking Marks Slot Unavailable**
    - **Validates: Requirements 3.2, 3.3**

  - [x] 7.8 Создать страницу BookingPage
    - Интеграция TimeSlotPicker и BookingForm
    - Навигация на страницу подтверждения
    - _Requirements: 2.1, 3.4_

  - [x] 7.9 Создать страницу ConfirmationPage
    - Отображение деталей записи
    - _Requirements: 4.1, 4.2_

- [x] 8. Checkpoint - Проверка публичной части
  - Убедиться, что бронирование работает end-to-end
  - Проверить валидацию форм
  - Спросить пользователя, если возникнут вопросы

- [x] 9. Реализация личного кабинета юриста
  - [x] 9.1 Создать компонент LawyerLayout
    - Sidebar с навигацией (Dashboard, Slots, Appointments)
    - Header с информацией о пользователе
    - _Requirements: 6.1_

  - [x] 9.2 Создать страницу LawyerDashboard
    - Таблица записей на сегодня
    - Отображение времени, клиента, контактов, статуса
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]*9.3 Написать property-тест для дашборда
    - **Property 5: Dashboard Shows Today's Appointments Only**
    - **Validates: Requirements 6.1**

  - [x] 9.4 Создать страницу SlotsManagement
    - Форма создания нового слота (дата, время начала/окончания)
    - Список существующих слотов сгруппированных по дате
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]*9.5 Написать property-тесты для управления слотами
    - **Property 6: New Slot Is Available**
    - **Property 7: No Overlapping Slots**
    - **Validates: Requirements 7.2, 7.3**

  - [x] 9.6 Создать страницу LawyerAppointments
    - Таблица всех записей с фильтрами (дата, статус)
    - Кнопка отмены записи
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]*9.7 Написать property-тесты для отмены записи
    - **Property 8: Cancellation Updates Status**
    - **Property 9: Cancellation Restores Slot Availability**
    - **Validates: Requirements 8.3, 8.4**

- [x] 10. Checkpoint - Проверка кабинета юриста
  - Убедиться, что все функции юриста работают
  - Проверить создание слотов и отмену записей
  - Спросить пользователя, если возникнут вопросы

- [x] 11. Реализация панели суперадмина
  - [x] 11.1 Создать компонент AdminLayout
    - Sidebar с навигацией (Lawyers, Appointments)
    - _Requirements: 9.1_

  - [x] 11.2 Создать страницу AdminLawyers
    - Список всех юристов со статистикой (количество записей)
    - _Requirements: 9.1, 9.2_

  - [ ]*11.3 Написать property-тест для статистики
    - **Property 12: Lawyer Statistics Accuracy**
    - **Validates: Requirements 9.1**

  - [x] 11.4 Создать страницу AdminAppointments
    - Таблица всех записей с фильтрами (юрист, дата, статус)
    - _Requirements: 10.1, 10.2_

  - [ ]*11.5 Написать property-тест для фильтрации
    - **Property 10: Appointment Filtering**
    - **Validates: Requirements 8.2, 10.2**

- [x] 12. Настройка роутинга
  - [x] 12.1 Настроить React Router
    - Публичные маршруты: /, /booking/:lawyerId, /confirmation/:appointmentId, /login
    - Защищенные маршруты юриста: /lawyer/*
    - Защищенные маршруты админа: /admin/*
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 13. Обработка ошибок и уведомления
  - [x] 13.1 Настроить Toast уведомления
    - Успешные операции
    - Ошибки валидации и API
    - _Requirements: 13.1, 13.2_

  - [x] 13.2 Добавить обработку сетевых ошибок
    - Отображение сообщений об ошибках
    - Кнопка повторной попытки
    - _Requirements: 13.3_

- [x] 14. Final Checkpoint - Финальная проверка
  - Убедиться, что все тесты проходят
  - Проверить работу всех функций
  - Спросить пользователя, если возникнут вопросы

## Notes

- Задачи, помеченные `*`, являются опциональными (property-тесты) и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для отслеживания
- Checkpoints обеспечивают инкрементальную валидацию
- Property-тесты валидируют универсальные свойства корректности
- Unit-тесты валидируют конкретные примеры и граничные случаи
