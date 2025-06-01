"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles, Trophy, Coins, ArrowRight } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

export default function HomePage() {
  const isMobile = useMobile()

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col items-center justify-center p-4 text-white">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${Math.random() * 10 + 5}px`,
              height: `${Math.random() * 10 + 5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 10}s linear infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-3xl w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <img
              src="/placeholder.svg?height=120&width=120"
              alt="Snake.io Logo"
              className={`object-contain ${isMobile ? "w-24 h-24" : "w-32 h-32"}`}
            />
            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black font-bold rounded-full p-1 text-xs animate-pulse">
              NOVO!
            </div>
          </div>
        </div>

        <h1
          className={`font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 ${isMobile ? "text-3xl" : "text-4xl md:text-6xl"}`}
        >
          PROMOÇÃO EXCLUSIVA!
        </h1>

        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg mb-6 animate-pulse">
          <p className={`font-bold ${isMobile ? "text-lg" : "text-xl md:text-2xl"}`}>
            CONVITE ESPECIAL APENAS PARA VOCÊ!
          </p>
        </div>

        <Card className="bg-black/40 backdrop-blur-md border-yellow-500/50 mb-6">
          <CardContent className={`${isMobile ? "p-4" : "p-4 md:p-6"}`}>
            <h2 className={`font-bold mb-4 ${isMobile ? "text-xl" : "text-2xl md:text-3xl"}`}>
              Ganhe R$1 por cada ponto!
            </h2>
            <p className={`mb-6 ${isMobile ? "text-base" : "text-lg md:text-xl"}`}>
              Participe agora do nosso desafio exclusivo e transforme sua habilidade em dinheiro real!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-800/50 p-4 rounded-lg flex flex-col items-center">
                <Sparkles className={`text-yellow-400 mb-2 ${isMobile ? "h-6 w-6" : "h-6 w-6 md:h-8 md:w-8"}`} />
                <p className={`font-semibold ${isMobile ? "text-sm" : "text-sm md:text-base"}`}>
                  Promoção por tempo limitado
                </p>
              </div>
              <div className="bg-blue-800/50 p-4 rounded-lg flex flex-col items-center">
                <Trophy className={`text-yellow-400 mb-2 ${isMobile ? "h-6 w-6" : "h-6 w-6 md:h-8 md:w-8"}`} />
                <p className={`font-semibold ${isMobile ? "text-sm" : "text-sm md:text-base"}`}>Competição exclusiva</p>
              </div>
              <div className="bg-blue-800/50 p-4 rounded-lg flex flex-col items-center">
                <Coins className={`text-yellow-400 mb-2 ${isMobile ? "h-6 w-6" : "h-6 w-6 md:h-8 md:w-8"}`} />
                <p className={`font-semibold ${isMobile ? "text-sm" : "text-sm md:text-base"}`}>
                  Ganhos reais garantidos
                </p>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm mb-2 text-yellow-300">Restam apenas:</p>
              <div className="flex justify-center gap-2 mb-4">
                {[2, 3, 5, 9].map((num, i) => (
                  <div
                    key={i}
                    className="bg-black/60 w-12 h-12 flex items-center justify-center rounded-md text-xl font-mono"
                  >
                    {num}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Link href="/game" className="block">
          <Button
            className={`bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold rounded-full animate-bounce ${isMobile ? "text-lg py-4 px-6 w-full" : "text-lg py-6 px-8 w-full md:w-auto"}`}
          >
            JOGAR AGORA <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>

        <p className="mt-4 text-sm text-white/70">
          *Sujeito aos termos e condições. Limite máximo de R$100 por jogador.
        </p>
      </div>
    </div>
  )
}
