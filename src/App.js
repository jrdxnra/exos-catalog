import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [obstacles, setObstacles] = useState([]);
  const gameRef = useRef(null);
  const dinoRef = useRef(null);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === 'Space' && !isJumping && !gameOver) {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isJumping, gameOver]);

  useEffect(() => {
    if (!gameOver) {
      const gameLoop = setInterval(() => {
        setScore(prev => prev + 1);
        moveObstacles();
        checkCollision();
      }, 100);

      return () => clearInterval(gameLoop);
    }
  }, [gameOver]);

  const jump = () => {
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 500);
  };

  const moveObstacles = () => {
    setObstacles(prev => {
      const newObstacles = prev.map(obs => ({
        ...obs,
        x: obs.x - 10
      })).filter(obs => obs.x > -50);

      if (Math.random() < 0.1) {
        newObstacles.push({ x: 800, y: 0 });
      }

      return newObstacles;
    });
  };

  const checkCollision = () => {
    const dino = dinoRef.current;
    const obstacles = document.querySelectorAll('.obstacle');

    obstacles.forEach(obstacle => {
      const dinoRect = dino.getBoundingClientRect();
      const obstacleRect = obstacle.getBoundingClientRect();

      if (
        dinoRect.right > obstacleRect.left &&
        dinoRect.left < obstacleRect.right &&
        dinoRect.bottom > obstacleRect.top
      ) {
        setGameOver(true);
        if (score > highScore) {
          setHighScore(score);
        }
      }
    });
  };

  const resetGame = () => {
    setScore(0);
    setGameOver(false);
    setObstacles([]);
  };

  return (
    <div className="App">
      <div className="game-container" ref={gameRef} style={{
        backgroundColor: '#f7f7f7',
        width: '800px',
        height: '300px',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '2px solid #535353',
        imageRendering: 'pixelated'
      }}>
        <div className="score" style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          fontFamily: 'Press Start 2P, cursive',
          fontSize: '16px',
          color: '#535353'
        }}>Score: {score}</div>
        <div className="high-score" style={{
          position: 'absolute',
          top: '40px',
          right: '10px',
          fontFamily: 'Press Start 2P, cursive',
          fontSize: '16px',
          color: '#535353'
        }}>High Score: {highScore}</div>
        
        <div 
          className={`dino ${isJumping ? 'jumping' : ''}`} 
          ref={dinoRef}
          style={{
            width: '44px',
            height: '47px',
            width: '50px',
            height: '50px',
            backgroundColor: '#333',
            position: 'absolute',
            bottom: '0',
            left: '50px',
            transition: 'transform 0.5s'
          }}
        />

        {obstacles.map((obstacle, index) => (
          <div
            key={index}
            className="obstacle"
            style={{
              width: '20px',
              height: '40px',
              backgroundColor: '#666',
              position: 'absolute',
              bottom: '0',
              left: `${obstacle.x}px`
            }}
          />
        ))} 

        {gameOver && (
          <div className="game-over">
            <h2>Game Over!</h2>
            <button onClick={resetGame}>Play Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;