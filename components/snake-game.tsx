"use client"
import type React from "react"
import { useEffect, useRef, useState, useCallback } from "react"

interface SnakeGameProps {
  onGameOver: (score: number) => void
  onScoreUpdate: (score: number) => void
  onAchievement: (achievement: string) => void
  isMobile: boolean
  onGameStart?: () => void
}

interface Position {
  x: number
  y: number
}

interface Food {
  position: Position
  color: string
  value: number
  type: "normal" | "golden" | "rainbow" | "mega"
  glowIntensity?: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface ScorePopup {
  x: number
  y: number
  value: number
  life: number
  color: string
}

interface Obstacle {
  x: number
  y: number
  width: number
  height: number
}

type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

const SnakeGame: React.FC<SnakeGameProps> = ({ onGameOver, onScoreUpdate, onAchievement, isMobile, onGameStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [countdown, setCountdown] = useState(3)
  const [showCountdown, setShowCountdown] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 })

  // Game state refs
  const snakeRef = useRef<Position[]>([])
  const foodsRef = useRef<Food[]>([])
  const obstaclesRef = useRef<Obstacle[]>([])
  const particlesRef = useRef<Particle[]>([])
  const scorePopupsRef = useRef<ScorePopup[]>([])
  const directionRef = useRef<Direction>("RIGHT")
  const nextDirectionRef = useRef<Direction>("RIGHT")
  const gameOverRef = useRef(false)
  const gameLoopRef = useRef<number | null>(null)
  const achievementsRef = useRef<Set<string>>(new Set())
  const gameStartedRef = useRef(false)
  const comboRef = useRef(0)
  const lastEatTimeRef = useRef(0)
  const scoreRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Game constants
  const CELL_SIZE = 14 // Smaller cell size for mobile
  const GRID_WIDTH = Math.floor(canvasSize.width / CELL_SIZE)
  const GRID_HEIGHT = Math.floor(canvasSize.height / CELL_SIZE)
  const GAME_SPEED = 130 // Slightly slower for mobile

  // Enhanced food system - SIMPLIFICADO para 1 ponto por comida
  const FOOD_TYPES = {
    normal: { colors: ["#4ADE80", "#F87171", "#FACC15", "#C084FC", "#60A5FA"], value: 1, chance: 0.7 },
    golden: { colors: ["#FFD700", "#FFA500"], value: 1, chance: 0.2 },
    rainbow: { colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"], value: 1, chance: 0.08 },
    mega: { colors: ["#FF1744", "#E91E63"], value: 1, chance: 0.02 },
  }

  // Set canvas size based on screen
  useEffect(() => {
    const updateCanvasSize = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.offsetWidth - 16
      const containerHeight = containerRef.current.offsetHeight - 16

      // Make sure we have a reasonable aspect ratio for the game
      const newWidth = containerWidth
      const newHeight = Math.min(containerHeight, window.innerHeight * 0.5)

      // Ensure the grid has whole cells
      const finalWidth = Math.max(280, Math.floor(newWidth / CELL_SIZE) * CELL_SIZE)
      const finalHeight = Math.max(200, Math.floor(newHeight / CELL_SIZE) * CELL_SIZE)

      setCanvasSize({
        width: finalWidth,
        height: finalHeight,
      })
    }

    updateCanvasSize()

    // Update on resize and orientation change
    window.addEventListener("resize", updateCanvasSize)
    window.addEventListener("orientationchange", updateCanvasSize)

    return () => {
      window.removeEventListener("resize", updateCanvasSize)
      window.removeEventListener("orientationchange", updateCanvasSize)
    }
  }, [CELL_SIZE])

  // Enhanced audio with better feedback
  const playSound = useCallback((type: "eat" | "combo" | "special" | "gameOver") => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return

      const audioContext = new AudioContext()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      let freq = 400,
        dur = 0.15,
        vol = 0.3,
        waveType: OscillatorType = "sine"

      switch (type) {
        case "eat":
          freq = 500 + comboRef.current * 50
          dur = 0.1
          vol = 0.4
          waveType = "square"
          break
        case "combo":
          freq = 800
          dur = 0.2
          vol = 0.6
          waveType = "triangle"
          break
        case "special":
          freq = 1000
          dur = 0.3
          vol = 0.8
          waveType = "sawtooth"
          break
        case "gameOver":
          freq = 150
          dur = 0.8
          vol = 0.5
          waveType = "sawtooth"
          break
      }

      oscillator.type = waveType
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)

      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(vol, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + dur)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + dur)

      // Enhanced vibration patterns
      if (navigator.vibrate) {
        switch (type) {
          case "eat":
            navigator.vibrate(30)
            break
          case "combo":
            navigator.vibrate([50, 30, 50])
            break
          case "special":
            navigator.vibrate([100, 50, 100, 50, 100])
            break
          case "gameOver":
            navigator.vibrate(400)
            break
        }
      }
    } catch (error) {
      console.log("Audio play failed:", error)
    }
  }, [])

  // Generate enhanced food with types
  const generateRandomFood = useCallback((): Food => {
    let x,
      y,
      attempts = 0,
      validPosition = false

    while (!validPosition && attempts < 100) {
      x = Math.floor(Math.random() * GRID_WIDTH)
      y = Math.floor(Math.random() * GRID_HEIGHT)
      validPosition =
        !snakeRef.current.some((segment) => segment.x === x && segment.y === y) &&
        !foodsRef.current.some((food) => food.position.x === x && food.position.y === y) &&
        !obstaclesRef.current.some((obs) => x >= obs.x && x < obs.x + obs.width && y >= obs.y && y < obs.y + obs.height)
      attempts++
    }

    if (!validPosition) {
      x = Math.floor(GRID_WIDTH / 2)
      y = Math.floor(GRID_HEIGHT / 2)
    }

    // Determine food type based on probability
    const rand = Math.random()
    let type: "normal" | "golden" | "rainbow" | "mega" = "normal"

    if (rand < FOOD_TYPES.mega.chance) type = "mega"
    else if (rand < FOOD_TYPES.mega.chance + FOOD_TYPES.rainbow.chance) type = "rainbow"
    else if (rand < FOOD_TYPES.mega.chance + FOOD_TYPES.rainbow.chance + FOOD_TYPES.golden.chance) type = "golden"

    const foodType = FOOD_TYPES[type]
    const color = foodType.colors[Math.floor(Math.random() * foodType.colors.length)]

    return {
      position: { x, y },
      color,
      value: foodType.value,
      type,
      glowIntensity: type === "normal" ? 0 : Math.random() * 0.5 + 0.5,
    }
  }, [GRID_WIDTH, GRID_HEIGHT])

  // Generate fewer, more strategic obstacles
  const generateObstacles = useCallback(() => {
    const newObstacles: Obstacle[] = []
    // Fewer obstacles on mobile for easier gameplay
    const numObstacles = Math.max(1, Math.floor((GRID_WIDTH * GRID_HEIGHT) / 200))

    for (let i = 0; i < numObstacles; i++) {
      let x,
        y,
        width,
        height,
        attempts = 0,
        validPosition = false

      while (!validPosition && attempts < 50) {
        x = Math.floor(Math.random() * (GRID_WIDTH - 3)) + 1
        y = Math.floor(Math.random() * (GRID_HEIGHT - 3)) + 1
        width = Math.floor(Math.random() * 2) + 1 // Smaller obstacles
        height = Math.floor(Math.random() * 2) + 1

        // Avoid center area
        const centerX = GRID_WIDTH / 2
        const centerY = GRID_HEIGHT / 2
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)

        validPosition = distanceFromCenter > 5
        attempts++
      }

      if (validPosition) {
        newObstacles.push({ x, y, width, height })
      }
    }

    obstaclesRef.current = newObstacles
  }, [GRID_WIDTH, GRID_HEIGHT])

  // Create particles for visual effects
  const createParticles = useCallback(
    (x: number, y: number, color: string, count = 8) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const speed = Math.random() * 3 + 2
        particlesRef.current.push({
          x: x * CELL_SIZE + CELL_SIZE / 2,
          y: y * CELL_SIZE + CELL_SIZE / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 30,
          maxLife: 30,
          color,
          size: Math.random() * 3 + 2,
        })
      }
    },
    [CELL_SIZE],
  )

  // Create score popup
  const createScorePopup = useCallback(
    (x: number, y: number, color: string) => {
      scorePopupsRef.current.push({
        x: x * CELL_SIZE + CELL_SIZE / 2,
        y: y * CELL_SIZE + CELL_SIZE / 2,
        value: 1, // Sempre 1 ponto
        life: 60,
        color,
      })
    },
    [CELL_SIZE],
  )

  // Initialize game with enhanced setup
  const initializeGame = useCallback(() => {
    if (onGameStart) onGameStart()

    const startX = Math.floor(GRID_WIDTH / 2)
    const startY = Math.floor(GRID_HEIGHT / 2)

    snakeRef.current = [{ x: startX, y: startY }]
    foodsRef.current = [generateRandomFood(), generateRandomFood()]
    generateObstacles()
    particlesRef.current = []
    scorePopupsRef.current = []

    setScore(0)
    scoreRef.current = 0
    setCombo(0)
    comboRef.current = 0
    lastEatTimeRef.current = 0
    gameOverRef.current = false
    gameStartedRef.current = true
    setGameStarted(true)

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = null
    }

    let lastTime = 0
    const gameLoop = (timestamp: number) => {
      if (gameOverRef.current || !gameStartedRef.current) {
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = null
        return
      }

      const deltaTime = timestamp - lastTime
      if (deltaTime >= GAME_SPEED) {
        update()
        lastTime = timestamp
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [GRID_WIDTH, GRID_HEIGHT, GAME_SPEED, generateRandomFood, generateObstacles, onGameStart])

  const startGame = useCallback(() => {
    if (gameStarted || showCountdown) return
    setShowCountdown(true)
    let count = 3
    setCountdown(count)

    const countdownInterval = setInterval(() => {
      count--
      setCountdown(count)
      if (count <= 0) {
        clearInterval(countdownInterval)
        setShowCountdown(false)
        initializeGame()
      }
    }, 1000)
  }, [gameStarted, showCountdown, initializeGame])

  const checkAchievements = useCallback(
    (currentScore: number, snakeLength: number, currentCombo: number) => {
      const achievementsList = [
        { id: "first_point", name: "Primeiro Ponto", condition: currentScore >= 1 },
        { id: "snake_10", name: "Cobra Crescente", condition: snakeLength >= 10 },
        { id: "combo_5", name: "Combo x5", condition: currentCombo >= 5 },
        { id: "score_25", name: "25 Pontos", condition: currentScore >= 25 },
        { id: "score_50", name: "50 Pontos", condition: currentScore >= 50 },
        { id: "combo_10", name: "Combo Master", condition: currentCombo >= 10 },
      ]

      achievementsList.forEach((ach) => {
        if (ach.condition && !achievementsRef.current.has(ach.id)) {
          achievementsRef.current.add(ach.id)
          onAchievement(ach.name)
          playSound("special")
        }
      })
    },
    [onAchievement, playSound],
  )

  const endGame = useCallback(() => {
    if (gameOverRef.current) return
    gameOverRef.current = true
    gameStartedRef.current = false
    setGameStarted(false)
    playSound("gameOver")

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = null
    }

    console.log("EndGame - Current score:", score, "ScoreRef:", scoreRef.current)
    onGameOver(scoreRef.current)
  }, [onGameOver, playSound, score])

  useEffect(() => {
    scoreRef.current = score
    console.log("Score updated:", score)
  }, [score])

  const update = useCallback(() => {
    if (gameOverRef.current || !gameStartedRef.current) return

    directionRef.current = nextDirectionRef.current
    const snake = [...snakeRef.current]
    const head = snake[0]
    const newHead = { x: head.x, y: head.y }

    switch (directionRef.current) {
      case "UP":
        newHead.y -= 1
        break
      case "DOWN":
        newHead.y += 1
        break
      case "LEFT":
        newHead.x -= 1
        break
      case "RIGHT":
        newHead.x += 1
        break
    }

    snake.unshift(newHead)

    let foodEaten = false
    const currentTime = Date.now()

    // Check food collision
    for (let i = 0; i < foodsRef.current.length; i++) {
      const food = foodsRef.current[i]
      if (newHead.x === food.position.x && newHead.y === food.position.y) {
        // Sistema simplificado: sempre 1 ponto por comida
        const currentScore = scoreRef.current
        const newScore = currentScore + 1
        console.log(`Food eaten! Current: ${currentScore}, New: ${newScore}`)
        setScore(newScore)
        onScoreUpdate(newScore)

        // Update combo system (apenas para efeitos visuais)
        if (currentTime - lastEatTimeRef.current < 3000) {
          comboRef.current += 1
          setCombo(comboRef.current)
        } else {
          comboRef.current = 1
          setCombo(1)
        }
        lastEatTimeRef.current = currentTime

        // Visual and audio feedback
        createParticles(food.position.x, food.position.y, food.color, food.type === "normal" ? 6 : 12)
        createScorePopup(food.position.x, food.position.y, food.color)

        if (comboRef.current > 1) {
          playSound("combo")
        } else if (food.type !== "normal") {
          playSound("special")
        } else {
          playSound("eat")
        }

        checkAchievements(newScore, snake.length + 1, comboRef.current)

        // Remove eaten food and add new one
        foodsRef.current.splice(i, 1)
        foodsRef.current.push(generateRandomFood())
        foodEaten = true
        break
      }
    }

    if (!foodEaten) {
      snake.pop()
      // Reset combo if no food eaten for too long
      if (currentTime - lastEatTimeRef.current > 5000 && comboRef.current > 0) {
        comboRef.current = 0
        setCombo(0)
      }
    }

    // Collision detection
    if (newHead.x < 0 || newHead.x >= GRID_WIDTH || newHead.y < 0 || newHead.y >= GRID_HEIGHT) {
      endGame()
      return
    }

    for (let i = 1; i < snake.length; i++) {
      if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
        endGame()
        return
      }
    }

    for (const obs of obstaclesRef.current) {
      if (newHead.x >= obs.x && newHead.x < obs.x + obs.width && newHead.y >= obs.y && newHead.y < obs.y + obs.height) {
        endGame()
        return
      }
    }

    snakeRef.current = snake
    draw()
  }, [
    score,
    GRID_WIDTH,
    GRID_HEIGHT,
    generateRandomFood,
    checkAchievements,
    onScoreUpdate,
    endGame,
    createParticles,
    createScorePopup,
    playSound,
  ])

  // Enhanced draw function with visual effects
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "#1e3a8a")
    gradient.addColorStop(0.5, "#3b82f6")
    gradient.addColorStop(1, "#1e40af")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.lineWidth = 0.5
    for (let x = 0; x <= GRID_WIDTH; x++) {
      ctx.beginPath()
      ctx.moveTo(x * CELL_SIZE, 0)
      ctx.lineTo(x * CELL_SIZE, canvas.height)
      ctx.stroke()
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * CELL_SIZE)
      ctx.lineTo(canvas.width, y * CELL_SIZE)
      ctx.stroke()
    }

    // Draw obstacles with gradient
    obstaclesRef.current.forEach((obs) => {
      const obsGradient = ctx.createLinearGradient(
        obs.x * CELL_SIZE,
        obs.y * CELL_SIZE,
        (obs.x + obs.width) * CELL_SIZE,
        (obs.y + obs.height) * CELL_SIZE,
      )
      obsGradient.addColorStop(0, "#4B5563")
      obsGradient.addColorStop(1, "#1F2937")
      ctx.fillStyle = obsGradient
      ctx.fillRect(obs.x * CELL_SIZE, obs.y * CELL_SIZE, obs.width * CELL_SIZE, obs.height * CELL_SIZE)

      // Add border
      ctx.strokeStyle = "#6B7280"
      ctx.lineWidth = 2
      ctx.strokeRect(obs.x * CELL_SIZE, obs.y * CELL_SIZE, obs.width * CELL_SIZE, obs.height * CELL_SIZE)
    })

    // Draw enhanced snake with gradient and glow
    snakeRef.current.forEach((segment, index) => {
      const isHead = index === 0
      const size = CELL_SIZE - 2
      const x = segment.x * CELL_SIZE + 1
      const y = segment.y * CELL_SIZE + 1

      if (isHead) {
        // Head with special glow
        ctx.shadowColor = "#00FF00"
        ctx.shadowBlur = 10
        const headGradient = ctx.createRadialGradient(
          x + size / 2,
          y + size / 2,
          0,
          x + size / 2,
          y + size / 2,
          size / 2,
        )
        headGradient.addColorStop(0, "#22C55E")
        headGradient.addColorStop(1, "#15803D")
        ctx.fillStyle = headGradient
      } else {
        // Body with fade effect
        ctx.shadowBlur = 5
        const alpha = Math.max(0.3, 1 - (index / snakeRef.current.length) * 0.7)
        const bodyGradient = ctx.createRadialGradient(
          x + size / 2,
          y + size / 2,
          0,
          x + size / 2,
          y + size / 2,
          size / 2,
        )
        bodyGradient.addColorStop(0, `rgba(34, 197, 94, ${alpha})`)
        bodyGradient.addColorStop(1, `rgba(21, 128, 61, ${alpha})`)
        ctx.fillStyle = bodyGradient
      }

      ctx.fillRect(x, y, size, size)
      ctx.shadowBlur = 0
    })

    // Draw enhanced food with glow effects
    foodsRef.current.forEach((food) => {
      const x = food.position.x * CELL_SIZE + 1
      const y = food.position.y * CELL_SIZE + 1
      const size = CELL_SIZE - 2

      // Add glow for special food
      if (food.type !== "normal") {
        ctx.shadowColor = food.color
        ctx.shadowBlur = 15 + Math.sin(Date.now() * 0.01) * 5
      }

      // Create food gradient
      const foodGradient = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size / 2)

      if (food.type === "rainbow") {
        const colors = FOOD_TYPES.rainbow.colors
        const colorIndex = Math.floor(Date.now() * 0.005) % colors.length
        foodGradient.addColorStop(0, colors[colorIndex])
        foodGradient.addColorStop(1, colors[(colorIndex + 1) % colors.length])
      } else {
        foodGradient.addColorStop(0, food.color)
        foodGradient.addColorStop(1, food.color + "80")
      }

      ctx.fillStyle = foodGradient
      ctx.fillRect(x, y, size, size)

      // Add sparkle effect for special food
      if (food.type !== "normal") {
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        const sparkleSize = 2
        ctx.fillRect(x + size * 0.2, y + size * 0.2, sparkleSize, sparkleSize)
        ctx.fillRect(x + size * 0.7, y + size * 0.7, sparkleSize, sparkleSize)
      }

      ctx.shadowBlur = 0
    })

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((particle) => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.life--
      particle.vx *= 0.98
      particle.vy *= 0.98

      if (particle.life > 0) {
        const alpha = particle.life / particle.maxLife
        ctx.fillStyle =
          particle.color +
          Math.floor(alpha * 255)
            .toString(16)
            .padStart(2, "0")
        ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size)
        return true
      }
      return false
    })

    // Update and draw score popups
    scorePopupsRef.current = scorePopupsRef.current.filter((popup) => {
      popup.y -= 1
      popup.life--

      if (popup.life > 0) {
        const alpha = popup.life / 60
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.font = "bold 16px Arial"
        ctx.textAlign = "center"
        ctx.fillText(`+1`, popup.x, popup.y) // Sempre mostra +1

        if (comboRef.current > 1) {
          ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`
          ctx.font = "bold 12px Arial"
          ctx.fillText(`COMBO x${comboRef.current}`, popup.x, popup.y + 15)
        }
        return true
      }
      return false
    })

    // Draw combo indicator
    if (comboRef.current > 1) {
      ctx.fillStyle = "#FFD700"
      ctx.font = "bold 20px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`COMBO x${comboRef.current}`, 10, 30)

      // Combo bar
      const comboBarWidth = 100
      const comboBarHeight = 8
      const comboProgress = Math.min(comboRef.current / 10, 1)

      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.fillRect(10, 35, comboBarWidth, comboBarHeight)

      const comboGradient = ctx.createLinearGradient(10, 35, 10 + comboBarWidth, 35)
      comboGradient.addColorStop(0, "#FFD700")
      comboGradient.addColorStop(1, "#FF6B35")
      ctx.fillStyle = comboGradient
      ctx.fillRect(10, 35, comboBarWidth * comboProgress, comboBarHeight)
    }
  }, [CELL_SIZE, GRID_WIDTH, GRID_HEIGHT])

  // Enhanced keyboard controls
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!gameStarted && !showCountdown) {
        startGame()
        return
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (directionRef.current !== "DOWN") nextDirectionRef.current = "UP"
          break
        case "ArrowDown":
        case "s":
        case "S":
          if (directionRef.current !== "UP") nextDirectionRef.current = "DOWN"
          break
        case "ArrowLeft":
        case "a":
        case "A":
          if (directionRef.current !== "RIGHT") nextDirectionRef.current = "LEFT"
          break
        case "ArrowRight":
        case "d":
        case "D":
          if (directionRef.current !== "LEFT") nextDirectionRef.current = "RIGHT"
          break
      }
    },
    [gameStarted, showCountdown, startGame],
  )

  // Enhanced mobile controls
  useEffect(() => {
    const leftButton = document.getElementById("button-left")
    const rightButton = document.getElementById("button-right")

    const handleMobileControl = (turnDirection: "LEFT" | "RIGHT") => {
      if (!gameStarted && !showCountdown) {
        startGame()
        return
      }

      const currentDir = directionRef.current
      if (turnDirection === "LEFT") {
        switch (currentDir) {
          case "UP":
            nextDirectionRef.current = "LEFT"
            break
          case "LEFT":
            nextDirectionRef.current = "DOWN"
            break
          case "DOWN":
            nextDirectionRef.current = "RIGHT"
            break
          case "RIGHT":
            nextDirectionRef.current = "UP"
            break
        }
      } else {
        switch (currentDir) {
          case "UP":
            nextDirectionRef.current = "RIGHT"
            break
          case "RIGHT":
            nextDirectionRef.current = "DOWN"
            break
          case "DOWN":
            nextDirectionRef.current = "LEFT"
            break
          case "LEFT":
            nextDirectionRef.current = "UP"
            break
        }
      }
    }

    const handleLeft = () => handleMobileControl("LEFT")
    const handleRight = () => handleMobileControl("RIGHT")

    if (leftButton) {
      leftButton.addEventListener("touchstart", handleLeft)
      leftButton.addEventListener("mousedown", handleLeft)
    }
    if (rightButton) {
      rightButton.addEventListener("touchstart", handleRight)
      rightButton.addEventListener("mousedown", handleRight)
    }

    return () => {
      if (leftButton) {
        leftButton.removeEventListener("touchstart", handleLeft)
        leftButton.removeEventListener("mousedown", handleLeft)
      }
      if (rightButton) {
        rightButton.removeEventListener("touchstart", handleRight)
        rightButton.removeEventListener("mousedown", handleRight)
      }
    }
  }, [gameStarted, showCountdown, startGame])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  // Initial draw
  useEffect(() => {
    if (!gameStarted && !showCountdown && canvasRef.current && canvasSize.width > 0) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, canvasSize.width, canvasSize.height)
        gradient.addColorStop(0, "#1e3a8a")
        gradient.addColorStop(1, "#1e40af")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

        // Draw "Click to Start" message
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"
        ctx.font = "bold 24px Arial"
        ctx.textAlign = "center"
        ctx.fillText("🐍 Toque para Jogar! 🐍", canvasSize.width / 2, canvasSize.height / 2)
      }
    }
  }, [canvasSize, gameStarted, showCountdown])

  return (
    <div id="game-container" ref={containerRef} className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="border-2 border-yellow-400 rounded-xl shadow-2xl bg-gradient-to-br from-blue-900 to-blue-700 max-w-full max-h-full"
        onClick={() => {
          if (!gameStarted && !showCountdown) startGame()
        }}
        style={{ touchAction: "none", objectFit: "contain" }}
      />

      {showCountdown && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-6xl font-bold animate-pulse">
          <div className="bg-black/50 rounded-full w-20 h-20 flex items-center justify-center">{countdown}</div>
        </div>
      )}
    </div>
  )
}

export default SnakeGame
