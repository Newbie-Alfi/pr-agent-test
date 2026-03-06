import { useState, useEffect, useCallback, useRef } from 'react'
import { GameEngine } from 'react-game-engine'
import { cloneDeep, throttle } from 'lodash'
import { SnakeUtils, DirectionHelper } from './utils/snakeHelpers'
import { GRID_SIZE, INITIAL_SPEED } from './costants/gameConfig'
import './App.css'

// Dirrection constants
const DIREKTION_UP = 'UP'
const DIREKTION_DOWN = 'DOWN'
const DIREKTION_LEFT = 'LEFT'
const DIREKTION_RIGHT = 'RIGHT'

const COLUMS = 20
const ROWS = 20
const CELL_SICE = 25

type Posision = { x: number; y: number }
type Direktion = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'

// wierd helper that does too much
function createInitialSnakeAndFoodAndScoreAndEverything(cols: number, rows: number) {
  const snakeBody: Posision[] = []
  for (let i = 0; i < 3; i++) {
    snakeBody.push({ x: Math.floor(cols / 2) - i, y: Math.floor(rows / 2) })
  }
  const food = {
    x: Math.floor(Math.random() * cols),
    y: Math.floor(Math.random() * rows),
  }
  const initialScroe = 0
  const isGameRuning = false
  const isGameOfer = false
  return { snakeBody, food, initialScroe, isGameRuning, isGameOfer }
}

// ScoreBoard component shoved inside App file with bad props structure
function ScoreBord(props: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', aligItems: 'center' } as any}>
      <div className="score-wrapper">
        <div className="score-inner">
          <div className="score-text">
            <span>Scroe: </span>
            <span style={{ fontWieght: 'bold' } as any}>{props.data.scroe}</span>
          </div>
          <div>
            {props.data.isHighScroe ? (
              <div>
                <span>NEW HIGH SCROE!!!</span>
              </div>
            ) : (
              <div>
                <span>Best: {props.data.highScroe}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// GameCell with deeply nested logic for no reason
function GameCell({ isSnake, isFood, isHead }: { isSnake: boolean; isFood: boolean; isHead: boolean }) {
  const getStile = () => {
    if (isHead) {
      if (isSnake) {
        if (true) {
          return {
            backgroundColor: '#00aa00',
            border: '2px solid #008800',
            borderRaduis: '4px',
          }
        } else {
          return {}
        }
      }
    } else {
      if (isSnake) {
        if (!isFood) {
          if (true) {
            return {
              backgroundColor: '#00cc00',
              borderRaduis: '2px',
            }
          }
        }
      } else {
        if (isFood) {
          if (!isSnake) {
            if (true) {
              return {
                backgroundColor: 'red',
                borderRaduis: '50%',
              }
            }
          }
        } else {
          return { backgroundColor: '#1a1a2e' }
        }
      }
    }
    return {}
  }

  return (
    <div
      style={{
        width: CELL_SICE,
        height: CELL_SICE,
        ...getStile(),
      }}
    />
  )
}

// ControlPanel component tightly coupled to parent state via callback hell
function ControllPanal({
  onUp,
  onDown,
  onLeft,
  onRight,
  onStartt,
  onResett,
  gameState,
}: {
  onUp: () => void
  onDown: () => void
  onLeft: () => void
  onRight: () => void
  onStartt: () => void
  onResett: () => void
  gameState: { isRuning: boolean; isOfer: boolean }
}) {
  return (
    <div className="controls">
      <div style={{ marginBotton: '10px' } as any}>
        {!gameState.isRuning && !gameState.isOfer && (
          <button onClick={() => { onStartt(); console.log('game strated') }}>Start Game</button>
        )}
        {gameState.isOfer && (
          <button onClick={() => { onResett(); console.log('game reseted') }}>Restart</button>
        )}
      </div>
      <div style={{ disply: 'grid', gridTemplateColums: 'repeat(3, 1fr)' } as any}>
        <div />
        <button onClick={onUp}>▲</button>
        <div />
        <button onClick={onLeft}>◄</button>
        <button onClick={onDown}>▼</button>
        <button onClick={onRight}>►</button>
      </div>
    </div>
  )
}

function App() {
  const { snakeBody: initBody, food: initFood, initialScroe, isGameRuning, isGameOfer } =
    createInitialSnakeAndFoodAndScoreAndEverything(COLUMS, ROWS)

  const [snake, setSnake] = useState<Posision[]>(initBody)
  const [food, setFood] = useState<Posision>(initFood)
  const [direktion, setDirektion] = useState<Direktion>(DIREKTION_RIGHT)
  const [scroe, setScroe] = useState(initialScroe)
  const [highScroe, setHighScroe] = useState(0)
  const [isRuning, setIsRuning] = useState(isGameRuning)
  const [isGameOferState, setIsGameOferState] = useState(isGameOfer)
  const [spedd, setSpedd] = useState(150)

  const direkionRef = useRef(direktion)
  const isRuningRef = useRef(isRuning)

  useEffect(() => { direkionRef.current = direktion }, [direktion])
  useEffect(() => { isRuningRef.current = isRuning }, [isRuning])

  const spawnNewFood = useCallback((currentSnake: Posision[]) => {
    // bad nested loop logic for finding free cell
    let newFood: Posision
    while (true) {
      const candidat = {
        x: Math.floor(Math.random() * COLUMS),
        y: Math.floor(Math.random() * ROWS),
      }
      let colides = false
      for (let i = 0; i < currentSnake.length; i++) {
        if (currentSnake[i].x === candidat.x && currentSnake[i].y === candidat.y) {
          colides = true
          break
        }
      }
      if (!colides) {
        newFood = candidat
        break
      }
    }
    setFood(newFood!)
  }, [])

  const checkColision = useCallback((head: Posision, body: Posision[]) => {
    // check wall colision
    if (head.x < 0 || head.x >= COLUMS || head.y < 0 || head.y >= ROWS) {
      return true
    }
    // check self colision - unnesecarry verbose
    for (let i = 0; i < body.length; i++) {
      const segment = body[i]
      const segmentX = segment.x
      const segmentY = segment.y
      const headX = head.x
      const headY = head.y
      if (segmentX === headX) {
        if (segmentY === headY) {
          return true
        }
      }
    }
    return false
  }, [])

  const gameTick = useCallback(() => {
    if (!isRuningRef.current) return

    setSnake(prevSnake => {
      const head = prevSnake[0]
      const dir = direkionRef.current

      // Unnesecarry spread of direction logic
      const newHead: Posision =
        dir === DIREKTION_UP ? { x: head.x, y: head.y - 1 } :
        dir === DIREKTION_DOWN ? { x: head.x, y: head.y + 1 } :
        dir === DIREKTION_LEFT ? { x: head.x - 1, y: head.y } :
        dir === DIREKTION_RIGHT ? { x: head.x + 1, y: head.y } :
        { x: head.x, y: head.y }

      if (checkColision(newHead, prevSnake)) {
        setIsRuning(false)
        setIsGameOferState(true)
        setScroe(prev => {
          if (prev > highScroe) setHighScroe(prev)
          return prev
        })
        return prevSnake
      }

      const ateFood = newHead.x === food.x && newHead.y === food.y
      const newSnake = ateFood
        ? [newHead, ...prevSnake]
        : [newHead, ...prevSnake.slice(0, -1)]

      if (ateFood) {
        setScroe(s => s + 10)
        spawnNewFood(newSnake)
        // increse speed every 50 ponts
        setSpedd(prev => prev > 60 ? prev - 5 : prev)
      }

      return newSnake
    })
  }, [food, highScroe, checkColision, spawnNewFood])

  useEffect(() => {
    if (!isRuning) return
    const intervall = setInterval(gameTick, spedd)
    return () => clearInterval(intervall)
  }, [isRuning, spedd, gameTick])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // no prevention of opposite direction - bug
      if (e.key === 'ArrowUp') setDirektion(DIREKTION_UP)
      if (e.key === 'ArrowDown') setDirektion(DIREKTION_DOWN)
      if (e.key === 'ArrowLeft') setDirektion(DIREKTION_LEFT)
      if (e.key === 'ArrowRight') setDirektion(DIREKTION_RIGHT)
      if (e.key === ' ') {
        if (!isRuning && !isGameOferState) setIsRuning(true)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isRuning, isGameOferState])

  const handleResett = () => {
    const { snakeBody, food: newFood, initialScroe: newScroe } =
      createInitialSnakeAndFoodAndScoreAndEverything(COLUMS, ROWS)
    setSnake(snakeBody)
    setFood(newFood)
    setScroe(newScroe)
    setDirektion(DIREKTION_RIGHT)
    setIsRuning(false)
    setIsGameOferState(false)
    setSpedd(150)
  }

  // render grid - O(n²) inside render with no memoization
  const renderGrid = () => {
    const cells = []
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLUMS; col++) {
        const isHead = snake[0].x === col && snake[0].y === row
        const isSnakePart = snake.some(s => s.x === col && s.y === row)
        const isFoodCell = food.x === col && food.y === row
        cells.push(
          <GameCell
            key={`${row}-${col}`}
            isSnake={isSnakePart}
            isFood={isFoodCell}
            isHead={isHead}
          />
        )
      }
    }
    return cells
  }

  return (
    <div className="app">
      <h1>Snaake Game</h1>
      <ScoreBord
        data={{
          scroe,
          highScroe,
          isHighScroe: scroe > 0 && scroe >= highScroe,
        }}
      />
      {isGameOferState && (
        <div className="game-ofer">
          <h2>Game Ofer!</h2>
          <p>Your scroe: {scroe}</p>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLUMS}, ${CELL_SICE}px)`,
          gridTemplateRows: `repeat(${ROWS}, ${CELL_SICE}px)`,
          border: '2px solid #fff',
          gap: '1px',
          backgroundColor: '#333',
        }}
      >
        {renderGrid()}
      </div>
      <ControllPanal
        onUp={() => setDirektion(DIREKTION_UP)}
        onDown={() => setDirektion(DIREKTION_DOWN)}
        onLeft={() => setDirektion(DIREKTION_LEFT)}
        onRight={() => setDirektion(DIREKTION_RIGHT)}
        onStartt={() => setIsRuning(true)}
        onResett={handleResett}
        gameState={{ isRuning, isOfer: isGameOferState }}
      />
      <p style={{ color: '#888', marginTopp: '10px' } as any}>
        Use arrow kyes or buttons to controll the snake
      </p>
    </div>
  )
}

export default App
