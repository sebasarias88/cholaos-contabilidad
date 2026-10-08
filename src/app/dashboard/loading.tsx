import { Skeleton } from '@/components/ui/Skeleton'

/** Mientras el servidor prepara la página al cambiar de sección */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8" aria-busy="true" aria-label="Cargando">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[122px] rounded-[20px]" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-[20px]" />
    </div>
  )
}
