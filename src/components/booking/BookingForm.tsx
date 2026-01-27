import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import type { TimeSlot } from '@/types'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

// Validation schema (Requirements 3.6, 3.7, 12.1, 12.2)
export const bookingFormSchema = z.object({
  client_name: z.string().min(2, 'Имя должно содержать минимум 2 символа'),
  client_email: z.string().email('Некорректный email'),
  client_phone: z.string().regex(/^\+?[0-9]{10,15}$/, 'Некорректный номер телефона (10-15 цифр)'),
  comment: z.string().optional(),
})

export type BookingFormData = z.infer<typeof bookingFormSchema>

interface BookingFormProps {
  timeSlot: TimeSlot | null
  lawyerId: string
  onSubmit: (data: BookingFormData) => Promise<void>
  isSubmitting: boolean
}

export function BookingForm({
  timeSlot,
  onSubmit,
  isSubmitting,
}: BookingFormProps) {
  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      client_name: '',
      client_email: '',
      client_phone: '',
      comment: '',
    },
  })

  const handleSubmit = async (data: BookingFormData) => {
    await onSubmit(data)
  }

  const formatTime = (time: string) => time.slice(0, 5)

  if (!timeSlot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Форма записи</CardTitle>
          <CardDescription>
            Выберите дату и время для записи на консультацию
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Пожалуйста, выберите время консультации
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Форма записи</CardTitle>
        <CardDescription>
          Запись на {format(parseISO(timeSlot.date), 'd MMMM yyyy', { locale: ru })} в {formatTime(timeSlot.start_time)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя *</FormLabel>
                  <FormControl>
                    <Input placeholder="Введите ваше имя" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="example@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+79001234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий</FormLabel>
                  <FormControl>
                    <Input placeholder="Опишите вашу ситуацию (необязательно)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Переход к оплате...' : 'Оплатить и записаться (10 ₽)'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
