"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Trophy, Gift, Medal, BookOpen, Users, MessageCircle, RefreshCw } from "lucide-react"
import Link from "next/link"
import SnakeGame from "@/components/snake-game"
import { useMobile } from "@/hooks/use-mobile"

export default function GamePage() {
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [earnings, setEarnings] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [rewardLevel, setRewardLevel] = useState(0)
  const [showReward, setShowReward] = useState(false)
  const [showAchievement, setShowAchievement] = useState(false)
  const [achievementName, setAchievementName] = useState("")
  const [achievements, setAchievements] = useState<string[]>([])
  const isMobile = useMobile()
  const [finalScore, setFinalScore] = useState(0)

  // Leaderboard data
  const [leaderboard] = useState([
    { name: "Player103", score: 3546 },
    { name: "isadora01", score: 1833 },
    { name: "montofon", score: 1594 },
    { name: "Player818", score: 1577 },
    { name: "venenosa", score: 1508 },
  ])

  useEffect(() => {
    const storedHighScore = localStorage.getItem("snakeHighScore")
    if (storedHighScore) {
      setHighScore(Number.parseInt(storedHighScore))
    }

    const storedAchievements = localStorage.getItem("snakeAchievements")
    if (storedAchievements) {
      setAchievements(JSON.parse(storedAchievements))
    }

    // Prevent scrolling on mobile when touching the game
    const preventScroll = (e: TouchEvent) => {
      if (
        e.target instanceof Element &&
        (e.target.id === "game-container" ||
          e.target.closest("#game-container") ||
          e.target.id === "button-left" ||
          e.target.id === "button-right")
      ) {
        e.preventDefault()
      }
    }

    document.addEventListener("touchmove", preventScroll, { passive: false })
    return () => document.removeEventListener("touchmove", preventScroll)
  }, [])

  const handleGameOver = (finalScore: number) => {
    console.log("HandleGameOver called with:", finalScore)
    setFinalScore(finalScore)
    setScore(finalScore)
    setEarnings(finalScore)
    setGameOver(true)

    if (finalScore > highScore) {
      setHighScore(finalScore)
      localStorage.setItem("snakeHighScore", finalScore.toString())
    }
  }

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore)
    setEarnings(newScore) // Cada ponto = R$1

    // Check for reward milestones - sistema cumulativo
    if (newScore === 5 && rewardLevel < 1) {
      setRewardLevel(1)
      setShowReward(true)
      setTimeout(() => setShowReward(false), 4000)
    } else if (newScore === 10 && rewardLevel < 2) {
      setRewardLevel(2)
      setShowReward(true)
      setTimeout(() => setShowReward(false), 4000)
    } else if (newScore === 15 && rewardLevel < 3) {
      setRewardLevel(3)
      setShowReward(true)
      setTimeout(() => setShowReward(false), 4000)
    }
  }

  const handleAchievement = (achievement: string) => {
    setAchievementName(achievement)
    setShowAchievement(true)
    setTimeout(() => setShowAchievement(false), 3000)

    // Save achievement
    if (!achievements.includes(achievement)) {
      const newAchievements = [...achievements, achievement]
      setAchievements(newAchievements)
      localStorage.setItem("snakeAchievements", JSON.stringify(newAchievements))
    }
  }

  const startNewGame = () => {
    setScore(0)
    setEarnings(0)
    setFinalScore(0)
    setGameOver(false)
    setRewardLevel(0)
  }

  const getRewardMessage = (level: number) => {
    const rewards = {
      1: "🎉 PARABÉNS! Você desbloqueou o EBOOK EXCLUSIVO! 📚",
      2: "🚀 INCRÍVEL! Acesso liberado à ÁREA DE MEMBROS! 👥",
      3: "💎 FANTÁSTICO! Bem-vindo ao GRUPO VIP do WhatsApp! 📱",
    }
    return rewards[level as keyof typeof rewards] || ""
  }

  const getRewardDetails = (level: number) => {
    const details = {
      1: "Ebook: 'Estratégias Avançadas de Marketing Digital'",
      2: "Área exclusiva com cursos, materiais e suporte",
      3: "Grupo VIP com dicas diárias e networking",
    }
    return details[level as keyof typeof details] || ""
  }

  const commonHeader = (
    <div className="flex justify-between items-center mb-2 px-1">
      <Link href="/">
        <Button variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
          <ArrowLeft className="mr-1 h-3 w-3" /> Voltar
        </Button>
      </Link>
      <div className="flex gap-2">
        <Card className="bg-black/40 backdrop-blur-md border-yellow-500/50 p-1 px-2">
          <div className="text-center">
            <p className="text-xs text-white/70">Recorde</p>
            <p className="text-sm font-bold text-yellow-400">R${highScore}</p>
          </div>
        </Card>
        <Card className="bg-black/40 backdrop-blur-md border-green-500/50 p-1 px-2">
          <div className="text-center">
            <p className="text-xs text-white/70">Pontos</p>
            <p className="text-sm font-bold text-green-400">R${score}</p>
          </div>
        </Card>
      </div>
    </div>
  )

  const gameOverScreen = (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-md rounded-lg text-white h-full">
      <Trophy className="h-12 w-12 text-yellow-400 mb-4" />
      <h2 className="text-2xl font-bold mb-2">Fim de Jogo!</h2>
      <p className="text-lg mb-4">Você ganhou:</p>
      <div className="text-4xl font-bold text-green-400 mb-6">R${finalScore || earnings || score}</div>

      {/* Botão de resgate do prêmio */}
      <div className="mb-6 text-center">
        <p className="text-white text-lg mb-4">Resgate o seu prêmio clicando no botão abaixo:</p>
        <Button
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold py-4 px-8 text-lg rounded-full shadow-lg animate-pulse w-full"
          onClick={() => {
            const prizeAmount = finalScore || earnings || score
            alert(`Parabéns! Você ganhou R$${prizeAmount}! Entre em contato para resgatar seu prêmio.`)
          }}
        >
          💰 RESGATAR PRÊMIO R${finalScore || earnings || score} 💰
        </Button>
      </div>

      {/* Mostrar bônus desbloqueados */}
      {score >= 5 && (
        <div className="mb-4 text-center w-full">
          <h3 className="text-lg font-bold text-yellow-400 mb-2">🎁 Bônus Desbloqueados:</h3>
          <div className="space-y-2">
            {score >= 5 && (
              <div className="flex items-center justify-center gap-2 text-sm bg-blue-500/20 p-2 rounded">
                <BookOpen className="h-4 w-4" />
                <span>Ebook Exclusivo</span>
              </div>
            )}
            {score >= 10 && (
              <div className="flex items-center justify-center gap-2 text-sm bg-purple-500/20 p-2 rounded">
                <Users className="h-4 w-4" />
                <span>Área de Membros</span>
              </div>
            )}
            {score >= 15 && (
              <div className="flex items-center justify-center gap-2 text-sm bg-green-500/20 p-2 rounded">
                <MessageCircle className="h-4 w-4" />
                <span>Grupo VIP WhatsApp</span>
              </div>
            )}
          </div>
        </div>
      )}
      <Button
        onClick={startNewGame}
        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 w-full"
      >
        <RefreshCw className="mr-2 h-4 w-4" /> Jogar Novamente
      </Button>
    </div>
  )

  const gameArea = (
    <div id="game-wrapper" className="relative bg-black/40 backdrop-blur-md rounded-lg overflow-hidden mb-2 flex-grow">
      <SnakeGame
        onGameOver={handleGameOver}
        onScoreUpdate={handleScoreUpdate}
        onAchievement={handleAchievement}
        onGameStart={startNewGame}
        isMobile={true}
      />
      {!gameOver && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-16 z-10">
          <button
            className="bg-white/20 backdrop-blur-md w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30 active:bg-white/40 shadow-lg"
            aria-label="Left"
            id="button-left"
          >
            ←
          </button>
          <button
            className="bg-white/20 backdrop-blur-md w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-white/30 active:bg-white/40 shadow-lg"
            aria-label="Right"
            id="button-right"
          >
            →
          </button>
        </div>
      )}
    </div>
  )

  // Calcular progresso até próximo bônus
  const getProgressToNextBonus = () => {
    if (score < 5) return { current: score, target: 5, progress: (score / 5) * 100 }
    if (score < 10) return { current: score - 5, target: 5, progress: ((score - 5) / 5) * 100 }
    if (score < 15) return { current: score - 10, target: 5, progress: ((score - 10) / 5) * 100 }
    return { current: 5, target: 5, progress: 100 }
  }

  const progressData = getProgressToNextBonus()

  const rewardsAndAchievementsSection = (
    <div className="grid grid-cols-1 gap-2">
      <Card className="bg-black/40 backdrop-blur-md border-white/20">
        <div className="p-2">
          <h3 className="text-white font-bold text-sm mb-2 flex items-center">
            <Gift className="mr-1 h-3 w-3 text-purple-400" /> Bônus Exclusivos
          </h3>
          <div className="flex items-center justify-between mb-1">
            <div className="flex-1 bg-gray-600 h-3 rounded-full relative">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressData.progress, 100)}%` }}
              />
            </div>
            <span className="text-white text-xs ml-2">
              {score >= 15 ? "COMPLETO!" : `${progressData.current}/${progressData.target}`}
            </span>
          </div>
          {score < 15 && (
            <div className="text-center mb-2">
              <p className="text-white/70 text-xs">
                {score < 5 && "Próximo: Ebook Exclusivo"}
                {score >= 5 && score < 10 && "Próximo: Área de Membros"}
                {score >= 10 && score < 15 && "Próximo: Grupo VIP WhatsApp"}
              </p>
            </div>
          )}
          <div className="space-y-2 mt-3">
            {[
              {
                points: 5,
                icon: BookOpen,
                title: "Ebook Exclusivo",
                desc: "Marketing Digital Avançado",
                color: "blue",
              },
              {
                points: 10,
                icon: Users,
                title: "Área de Membros",
                desc: "Cursos e materiais exclusivos",
                color: "purple",
              },
              {
                points: 15,
                icon: MessageCircle,
                title: "Grupo VIP",
                desc: "WhatsApp com dicas diárias",
                color: "green",
              },
            ].map((bonus) => {
              const isUnlocked = score >= bonus.points
              const IconComponent = bonus.icon
              return (
                <div
                  key={bonus.points}
                  className={`flex items-center p-2 rounded-lg border-2 transition-all duration-300 ${
                    isUnlocked
                      ? `bg-${bonus.color}-500/20 border-${bonus.color}-500/50`
                      : "bg-gray-700/30 border-gray-600/50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      isUnlocked ? `bg-${bonus.color}-500` : "bg-gray-600"
                    }`}
                  >
                    {isUnlocked ? (
                      <IconComponent className="h-4 w-4 text-white" />
                    ) : (
                      <span className="text-white text-lg">🔒</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-xs ${isUnlocked ? "text-white" : "text-gray-400"}`}>
                      {bonus.points} pontos - {bonus.title}
                    </div>
                    <div className={`text-xs ${isUnlocked ? `text-${bonus.color}-300` : "text-gray-500"}`}>
                      {bonus.desc}
                    </div>
                  </div>
                  {isUnlocked && (
                    <div className="text-green-400 font-bold">
                      <span className="text-lg">✓</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <Card className="bg-black/40 backdrop-blur-md border-white/20">
        <div className="p-2">
          <h3 className="text-white font-bold text-sm mb-2 flex items-center">
            <Medal className="mr-1 h-3 w-3 text-yellow-400" /> Conquistas ({achievements.length}/6)
          </h3>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: "first_point", name: "1º Ponto", icon: "🎯" },
              { id: "snake_10", name: "Cobra 10", icon: "🐍" },
              { id: "combo_5", name: "Combo x5", icon: "🔥" },
              { id: "score_25", name: "25 Pts", icon: "🥉" },
              { id: "score_50", name: "50 Pts", icon: "🥈" },
              { id: "combo_10", name: "Combo Master", icon: "👑" },
            ].map((ach) => {
              const isUnlocked = achievements.includes(ach.name)
              return (
                <div
                  key={ach.id}
                  className={`flex flex-col items-center justify-center p-1 rounded ${isUnlocked ? "bg-yellow-500/20" : "bg-gray-700/30"}`}
                  title={ach.name}
                >
                  <div className="text-lg mb-1">{isUnlocked ? ach.icon : "🔒"}</div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>
    </div>
  )

  const leaderboardSection = (
    <Card className="bg-black/40 backdrop-blur-md border-white/20 mt-2">
      <div className="p-2">
        <h3 className="text-white font-bold text-sm mb-2 flex items-center">
          <Trophy className="mr-1 h-3 w-3 text-yellow-400" /> Ranking
        </h3>
        <div className="grid grid-cols-2 gap-1">
          {leaderboard.slice(0, 4).map((player, index) => (
            <div key={index} className="flex justify-between items-center text-xs p-1 rounded bg-black/20">
              <span className="text-white flex items-center">
                {index === 0 && <span className="mr-1">👑</span>}
                {index + 1}. {player.name.length > 6 ? player.name.substring(0, 6) + "..." : player.name}
              </span>
              <span className="text-yellow-400 font-bold">{player.score}</span>
            </div>
          ))}
          {score > 0 && (
            <div className="flex justify-between items-center text-xs bg-yellow-500/20 p-1 rounded col-span-2">
              <span className="text-yellow-300 font-bold">Você</span>
              <span className="text-yellow-400 font-bold">{score}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )

  const notificationModals = (
    <>
      {showReward && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 max-w-sm">
          <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-purple-400 p-4 text-center animate-bounce shadow-2xl">
            <div className="text-4xl mb-3">🎁</div>
            <h3 className="text-white font-bold text-lg mb-3">BÔNUS DESBLOQUEADO!</h3>
            <p className="text-white text-sm mb-2">{getRewardMessage(rewardLevel)}</p>
            <p className="text-purple-200 text-xs">{getRewardDetails(rewardLevel)}</p>
          </Card>
        </div>
      )}
      {showAchievement && (
        <div className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 max-w-sm">
          <Card className="bg-purple-500 border-purple-400 p-4 text-center animate-bounce">
            <Medal className="h-8 w-8 text-purple-900 mx-auto mb-2" />
            <h3 className="text-white font-bold text-lg mb-2">CONQUISTA!</h3>
            <p className="text-white text-sm">{achievementName}</p>
          </Card>
        </div>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col p-2 h-[100dvh] overflow-hidden">
      <div className="w-full flex flex-col h-full">
        {commonHeader}
        <div className="flex-1 flex flex-col overflow-hidden">
          {gameOver ? gameOverScreen : gameArea}
          {!gameOver && (
            <>
              {rewardsAndAchievementsSection}
              {leaderboardSection}
            </>
          )}
        </div>
        <div className="mt-2 text-center text-white/70 text-xs pb-2">
          <p>Toque nos botões para controlar. Colete as bolinhas!</p>
        </div>
      </div>
      {notificationModals}
    </div>
  )
}
