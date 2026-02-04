import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-bold text-orange-600 dark:text-orange-400">404</h1>
      <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-4">
        Evento no encontrado
      </h2>
      <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-center max-w-md">
        El evento que buscas no existe o el enlace es incorrecto.
      </p>
      <Link href="/" className="mt-6">
        <Button className="bg-orange-600 hover:bg-orange-700">
          Crear nuevo evento
        </Button>
      </Link>
    </div>
  )
}
