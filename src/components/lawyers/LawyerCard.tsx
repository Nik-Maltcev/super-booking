import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Lawyer } from '@/types'

interface LawyerCardProps {
  lawyer: Lawyer
  onClick: (lawyerIdOrSlug: string) => void
}

export function LawyerCard({ lawyer, onClick }: LawyerCardProps) {
  const fullName = lawyer.user?.full_name || 'Юрист'
  const avatarUrl = lawyer.avatar_url || '/placeholder-avatar.png'
  // Use slug if available, otherwise use ID
  const bookingLink = lawyer.slug || lawyer.id

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          <img
            src={avatarUrl}
            alt={fullName}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=3b82f6&color=fff`
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <CardTitle className="text-lg truncate">{fullName}</CardTitle>
          <CardDescription className="truncate">{lawyer.specialization}</CardDescription>
        </div>
      </CardHeader>
      {lawyer.bio && (
        <CardContent>
          <p className="text-sm text-gray-600 line-clamp-2">{lawyer.bio}</p>
        </CardContent>
      )}
      <CardContent className="pt-0">
        <Button 
          onClick={() => onClick(bookingLink)} 
          className="w-full"
        >
          Записаться на консультацию
        </Button>
      </CardContent>
    </Card>
  )
}
