import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useLawyers } from '@/hooks/useLawyers'
import { LawyerCard } from '@/components/lawyers'
import { ErrorDisplay } from '@/components/ui/error-display'

export function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { lawyers, isLoading, error } = useLawyers()

  const handleLawyerClick = (lawyerId: string) => {
    navigate(`/booking/${lawyerId}`)
  }

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ['lawyers'] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Загрузка списка юристов...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ErrorDisplay 
          error={error} 
          onRetry={handleRetry}
          title="Ошибка загрузки данных"
        />
      </div>
    )
  }

  if (lawyers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Юристы временно недоступны</p>
          <p className="text-gray-500 text-sm mt-2">Пожалуйста, попробуйте позже</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Наши юристы</h2>
        <p className="text-gray-600 mt-2">Выберите специалиста для записи на консультацию</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lawyers.map((lawyer) => (
          <LawyerCard
            key={lawyer.id}
            lawyer={lawyer}
            onClick={handleLawyerClick}
          />
        ))}
      </div>
    </div>
  )
}
