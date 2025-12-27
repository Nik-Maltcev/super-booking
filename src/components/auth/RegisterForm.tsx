import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useAuthContext } from '@/contexts/AuthContext'
import { showSuccessToast, showErrorToast } from '@/lib/errors'

const registerSchema = z.object({
  full_name: z.string().min(2, 'ФИО должно содержать минимум 2 символа'),
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  confirmPassword: z.string(),
  specialization: z.string().min(2, 'Укажите специализацию'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterForm() {
  const navigate = useNavigate()
  const { signUp } = useAuthContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirmPassword: '',
      specialization: '',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    
    const { error } = await signUp(
      data.email, 
      data.password, 
      data.full_name,
      data.specialization
    )

    setIsSubmitting(false)

    if (error) {
      showErrorToast(error)
      return
    }

    showSuccessToast('Регистрация успешна! Проверьте email для подтверждения.')
    navigate('/login')
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Регистрация юриста
        </CardTitle>
        <CardDescription className="text-center">
          Создайте аккаунт для управления записями
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ФИО</FormLabel>
                  <FormControl>
                    <Input placeholder="Иван Петров" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="lawyer@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Специализация</FormLabel>
                  <FormControl>
                    <Input placeholder="Семейное право" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Пароль</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подтвердите пароль</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Войти
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
