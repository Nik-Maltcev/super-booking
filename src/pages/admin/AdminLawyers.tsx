import { useQueryClient } from '@tanstack/react-query'
import { useLawyersWithStats } from '@/hooks/useLawyers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ErrorDisplay } from '@/components/ui/error-display'

export function AdminLawyers() {
  const queryClient = useQueryClient()
  const { lawyers, isLoading, error } = useLawyersWithStats()

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['lawyers', 'withStats'] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Юристы</h2>
          <p className="text-gray-600">Список всех юристов со статистикой записей</p>
        </div>
        <ErrorDisplay 
          error={error} 
          onRetry={handleRetry}
          title="Ошибка загрузки юристов"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Юристы</h2>
        <p className="text-gray-600">Список всех юристов со статистикой записей</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Все юристы ({lawyers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {lawyers.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Юристы не найдены
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Юрист</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Специализация</TableHead>
                  <TableHead className="text-center">Всего записей</TableHead>
                  <TableHead className="text-center">Подтверждённых</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lawyers.map((lawyer) => (
                  <TableRow key={lawyer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {lawyer.avatar_url ? (
                          <img
                            src={lawyer.avatar_url}
                            alt={lawyer.user?.full_name || 'Юрист'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {lawyer.user?.full_name?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <span className="font-medium">
                          {lawyer.user?.full_name || 'Без имени'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {lawyer.user?.email || '-'}
                    </TableCell>
                    <TableCell>{lawyer.specialization}</TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {lawyer.total_appointments}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {lawyer.completed_appointments}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
