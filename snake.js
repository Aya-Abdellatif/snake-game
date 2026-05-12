const chalk = require("chalk");
const readLine = require("node:readline");
const fs = require("node:fs");

const WIDTH = 20;
const HEIGHT = 10;
let SPEED = 200;

let snake = [{ x: 5, y: 5 }];
let direction = { x: 1, y: 0 };
let food = spawnFood();
let score = 0;
let gameOver = false;
let gameLoop;


readLine.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on("keypress", (string, key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
        endGame("You quit the game.");
    }

    if (key.name === "up" && direction.y !== 1) {
        direction = { x: 0, y: -1 };
    }
    if (key.name === "down" && direction.y !== -1) {
        direction = { x: 0, y: 1 };
    }
    if (key.name === "right" && direction.x !== -1) {
        direction = { x: 1, y: 0 };
    }
    if (key.name === "left" && direction.x !== 1) {
        direction = { x: -1, y: 0 };
    }
})


function spawnFood() {
    return {
        x: Math.floor(Math.random() * WIDTH),
        y: Math.floor(Math.random() * HEIGHT)
    };
}

const foodTimer = setInterval(() => {
    if (!gameOver) {
        food = spawnFood();
    }
}, 5000);

const scoreTimer = setInterval(() => {
    if (!gameOver) {
        score += 10;
    }
}, 1000);

function draw() {
    // board
    const board = [];
    for (let row = 0; row < HEIGHT; row++) {
        board[row] = Array(WIDTH).fill(" ");
    }

    // draw food
    board[food.y][food.x] = chalk.red("●");

    // draw snake
    snake.forEach((snakePart, index) => {
        if (snakePart.x >= 0 && snakePart.x < WIDTH && snakePart.y >= 0 && snakePart.y < HEIGHT) {
            board[snakePart.y][snakePart.x] = index === 0 ? chalk.green("O") : chalk.greenBright("o");
        }
    });

    // draw board
    let output = "\x1B[H";
    output += chalk.cyan("┌" + "─".repeat(WIDTH) + "┐") + "\n";
    for (let row = 0; row < HEIGHT; row++) {
        output += chalk.cyan("│") + board[row].join("") + chalk.cyan("│") + "\n";
    }
    output += chalk.cyan("└" + "─".repeat(WIDTH) + "┘") + "\n";
    output += `  ${chalk.yellow("Score:")} ${score}   `;
    output += `${chalk.magenta("Speed:")} ${getSpeedLabel()}   `;
    output += `${chalk.gray("(Arrow keys, Q to quit)")}\n`;
    output += `${chalk.green("Snake length:")} ${snake.length}`;
    output += `  |  ${chalk.red("Food respawns every 5 seconds")}\n`;

    process.stdout.write(output);

}

function getSpeedLabel() {
    if (SPEED >= 200)
        return "Normal";
    if (SPEED >= 150)
        return "Fast";
    if (SPEED >= 100)
        return "Faster";
    return "MAX SPEED";
}

function update() {
    if (gameOver) {
        return;
    }

    const snakeHead = snake[0];
    const newSnakeHead = {
        x: snakeHead.x + direction.x,
        y: snakeHead.y + direction.y
    }

    // if snake hits the wall
    if (newSnakeHead.x < 0 || newSnakeHead.x >= WIDTH || newSnakeHead.y < 0 || newSnakeHead.y >= HEIGHT) {
        endGame("You hit the wall!");
        return;
    }

    // if snake hits itself
    const hitSelf = snake.some((snakePart) => snakePart.x === newSnakeHead.x && snakePart.y === newSnakeHead.y);
    if (hitSelf) {
        endGame("You bit yourself!");
        return;
    }

    snake.unshift(newSnakeHead);

    if (newSnakeHead.x === food.x && newSnakeHead.y === food.y) {
        score += 50;
        food = spawnFood();
        if (SPEED > 80) {
            SPEED -= 20;
            restartGameLoop();
        }
    }
    else {
        snake.pop();
    }

}

function restartGameLoop() {
    clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        update();
        draw();
    }, SPEED);
}

function endGame(msg) {
    if (gameOver)
        return;

    gameOver = true;

    clearInterval(gameLoop);
    clearInterval(foodTimer);
    clearInterval(scoreTimer);

    const timestamp = new Date().toLocaleString();
    const txt = `[${timestamp}] Score: ${score} | Snake Length: ${snake.length} | Reason: ${msg}\n`;
    fs.appendFileSync("scores.txt", txt);

    process.stdout.write("\x1B[H\x1B[J");
    console.log(chalk.red("\n  ╔══════════════════════════╗"));
    console.log(chalk.red(`  ║        GAME OVER!        ║`));
    console.log(chalk.red("  ╚══════════════════════════╝"));
    console.log(`\n  Reason : ${msg}`);
    console.log(`  Score  : ${score}`);
    console.log(`  Length : ${snake.length} segments`);
    console.log(`\n  Score saved to scores.txt`);
    console.log("\n  Run 'node snake.js' to play again.\n");

    process.stdin.setRawMode(false);
    process.exit();
}

process.stdout.write("\x1B[2J");

gameLoop = setInterval(() => {
    update();
    draw();
}, SPEED);