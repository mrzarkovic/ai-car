"use strict";

class Simulation {
    static simulationCanvas = document.getElementById("simulation");
    static networkCanvas = document.getElementById("network");
    static simulationCtx = Simulation.simulationCanvas.getContext("2d");
    static networkCtx = Simulation.networkCanvas.getContext("2d");

    constructor(
        subjectsCount = 0,
        enemiesCount = 0,
        seedName = "",
        output = null,
        level = 1,
        tryCount = 0,
        brainName = ""
    ) {
        Simulation.simulationCanvas.width = 260;
        Simulation.networkCanvas.width = 400;
        Simulation.networkCanvas.height = 400;

        this.fpsLimit = 60;
        this.fpsInterval = 1000 / this.fpsLimit;
        this.frameStartTime = 0;

        this.brainName = brainName;
        this.level = level;
        this.try = tryCount;
        this.output = output;
        this.seedName = seedName;
        this.seed = Simulation.getSeed(this.seedName, 100);
        this.subjectsCount = subjectsCount;
        this.enemiesCount = enemiesCount;
        this.totalEnemies = 0;

        this.road = null;
        this.cars = [];
        this.healtyCars = [];
        this.bestCar = null;
        this.traffic = [];
        this.startTime = null;
        this.stop = true;
        this.times = [];
        this.fps = 0;
        this.stats = {};
        this.mutation = 0;

        this.parentCar = null;
        this.onEndCallback = null;
        this.animationFrameId = null;
    }

    nextLevel(bestCar) {
        this.save(bestCar);
        this.try = 0;
        this.level += 1;
        this.retry();
    }

    start() {
        this.initialize();
        this.frameStartTime = performance.now();
        this.animate();
    }

    retry() {
        this.try += 1;
        this.destroy();
        this.start();
    }

    restart() {
        this.try = 0;
        this.level = 1;
        this.destroy();
        this.start();
    }

    initialize() {
        this.stop = false;
        this.road = new Road(
            Simulation.simulationCanvas.width / 2,
            Simulation.simulationCanvas.width * 0.8
        );
        this.cars = Car.generateCars(this.subjectsCount, this.road);
        this.healtyCars = this.cars;
        this.bestCar = this.getBestCar();
        this.totalEnemies = this.enemiesCount * this.level;
        this.traffic = Car.generateTraffic(
            this.totalEnemies,
            this.bestCar.y,
            this.road,
            this.seed
        );
        this.mutation = 0.1 / this.level + this.try / 1000;

        this.loadBestBrain();
    }

    destroy() {
        cancelAnimationFrame(this.animationFrameId);
        this.startTime = null;
        this.animationFrameId = null;

        this.road = null;
        this.cars = [];
        this.healtyCars = [];
        this.bestCar = null;
        this.traffic = [];
        this.stop = true;
        this.stats = {};

        this.parentCar = null;
        this.onEndCallback = null;
        Simulation.clearCtx();
    }

    static clearCtx() {
        Simulation.simulationCtx.clearRect(
            0,
            0,
            Simulation.simulationCanvas.width,
            Simulation.simulationCanvas.height
        );
        Simulation.networkCtx.clearRect(
            0,
            0,
            Simulation.networkCanvas.width,
            Simulation.networkCanvas.height
        );
        Simulation.simulationCtx.translate(0, 0);
    }

    onEnd(callback) {
        this.onEndCallback = callback;
    }

    animate() {
        const time = performance.now();
        const elapsed = time - this.frameStartTime;

        if (!this.startTime) {
            this.startTime = time;
        }
        const animationTime = time - this.startTime;
        if (this.stop) {
            return;
        }

        this.healtyCars = this.cars.filter((c) => !c.damaged);

        this.bestCar = this.getBestCar();

        this.updateTraffic(animationTime);
        this.updateCars(animationTime);

        const enemiesLeft =
            this.totalEnemies - this.stats[this.bestCar.id].overtook.length;

        if (elapsed > this.fpsInterval) {
            this.frameStartTime = time - (elapsed % this.fpsInterval);

            while (this.times.length > 0 && this.times[0] <= time - 1000) {
                this.times.shift();
            }

            this.times.push(time);
            this.fps = this.times.length;

            Simulation.simulationCanvas.height = window.innerHeight;

            Simulation.simulationCtx.save();

            this.moveCamera();
            this.road.draw(Simulation.simulationCtx);

            this.drawNetwork(animationTime);
            this.drawTraffic();
            this.drawCars();
            this.drawBestCar();
            this.drawParentCar();

            Simulation.simulationCtx.restore();
        }

        const animationSeconds = Math.round(time / 1000);
        const hours = Math.floor(animationSeconds / 3600);
        const totalSeconds = animationSeconds % 3600;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        this.output.innerHTML = `
                <div>
                    Generation: ${this.level - 1} 
                </div>
                <div>
                    Iteration: ${this.try} 
                </div>
                <div>
                    Mutation: ${(this.mutation * 100).toFixed(2)}% 
                </div>
                <div>
                    Speed: ${Math.round(
                        Math.abs(this.bestCar.speed) * 100
                    )} km/h
                </div>
                <div>
                    Population: ${this.healtyCars.length}/${this.subjectsCount}
                </div>
                <div>
                    Enemies: ${enemiesLeft}/${this.totalEnemies}
                </div>
                <div>FPS: ${this.fps}</div>
                <div>Time: ${("0" + hours).slice(-2)}:${("0" + minutes).slice(
            -2
        )}:${("0" + seconds).slice(-2)}</div>
            `;

        if (!this.healtyCars.length) {
            this.output.innerHTML += "<h1>GAME OVER!</h1>";
            setTimeout(this.retry.bind(this), 500);
        } else if (enemiesLeft == 0) {
            this.output.innerHTML += `
                <h1>LEVEL COMPLETE!</h1>
                <div>Survival rate</div>
                <div>${Math.round(
                    (this.healtyCars.length / this.subjectsCount) * 100
                )}%</div>
            `;
            setTimeout(
                function () {
                    this.nextLevel(this.bestCar);
                }.bind(this),
                1500
            );
        } else {
            this.animationFrameId = requestAnimationFrame(
                this.animate.bind(this)
            );
        }
    }

    save(bestCar) {
        this.brainName = `bestBrain-${bestCar.id}-${this.seedName}-${this.level}`;
        localStorage.setItem(
            this.brainName,
            JSON.stringify({ brain: bestCar.brain, id: bestCar.id })
        );
        console.log("saved", this.brainName);
    }

    drawParentCar() {
        this.parentCar.draw(
            Simulation.simulationCtx,
            this.parentCar.id == this.bestCar.id
        );
    }

    drawBestCar() {
        if (this.bestCar && this.bestCar.id != this.parentCar.id) {
            this.bestCar.color = "#F7E014";
            this.bestCar.draw(Simulation.simulationCtx, true);
        }
    }

    drawCars() {
        Simulation.simulationCtx.globalAlpha = 0.2;
        const regularCars = this.cars.filter(
            (c) => [this.bestCar.id, this.parentCar.id].indexOf(c.id) == -1
        );
        let carsDrawn = 0;
        for (let i = 0; i < regularCars.length; i++) {
            if (carsDrawn < 100 && this.carOnScreen(regularCars[i])) {
                carsDrawn++;
                regularCars[i].color = "#4514F7";
                regularCars[i].draw(Simulation.simulationCtx);
            }
        }
        Simulation.simulationCtx.globalAlpha = 1;
    }

    drawTraffic() {
        for (let i = 0; i < this.traffic.length; i++) {
            this.traffic[i].draw(Simulation.simulationCtx);
        }
    }

    drawNetwork(time) {
        if (this.bestCar) {
            Simulation.networkCtx.lineDashOffset = -time / 50;
            Visualizer.drawNetwork(Simulation.networkCtx, this.bestCar.brain);
        }
    }

    updateCars(animationTime) {
        for (let i = 0; i < this.cars.length; i++) {
            const car = this.cars[i];
            if (car.damaged) {
                if (this.bestCar && car.y < this.bottomOfScreen()) {
                    this.cars.splice(i, 1);
                }
            } else {
                this.updateOvertakes(car, animationTime);
                car.update(this.road.borders, this.traffic);
            }
        }
    }

    updateOvertakes(car, animationTime) {
        if (!this.stats[car.id]) {
            this.stats[car.id] = { overtook: [], lastOvertake: animationTime };
        }

        if (
            animationTime / 1000 > 5 &&
            animationTime - this.stats[car.id].lastOvertake >
                lerp(10, 5000, car.speed / car.maxSpeed)
        ) {
            car.damaged = true;
        } else {
            const carBottom = car.y + car.height * 0.3;
            for (let i = 0; i < this.traffic.length; i++) {
                const enemy = this.traffic[i];
                const enemyTop = enemy.y - enemy.height;
                if (
                    carBottom < enemyTop &&
                    this.stats[car.id].overtook.indexOf(enemy.id) == -1
                ) {
                    this.stats[car.id].overtook.push(enemy.id);
                    this.stats[car.id].lastOvertake = animationTime;
                }
            }
        }
    }

    updateTraffic(time) {
        for (let i = 0; i < this.traffic.length; i++) {
            this.traffic[i].update(this.road.borders, []);
            const enemyTop = this.traffic[i].y - this.traffic[i].height * 0.75;
            const bestCarBottom = this.bestCar.y + this.bestCar.height * 0.3;

            if (this.bestCar && enemyTop > bestCarBottom) {
                if (
                    isOutOfScreen(
                        this.traffic[i].y - this.traffic[i].height * 0.75,
                        Simulation.simulationCanvas.height,
                        this.bestCar.y
                    )
                ) {
                    this.traffic.splice(i, 1);
                }
            }
        }
    }

    moveCamera() {
        if (this.bestCar) {
            Simulation.simulationCtx.translate(
                0,
                -this.bestCar.y + Simulation.simulationCanvas.height * 0.7
            );
        }
    }

    loadBestBrain() {
        this.parentCar = this.cars[0];
        this.parentCar.color = "#1498F7";
        const oldBestCarStats = localStorage.getItem(this.brainName);

        if (this.brainName && oldBestCarStats) {
            console.log("loaded", this.brainName);

            for (let i = 0; i < this.cars.length; i++) {
                this.cars[i].brain = JSON.parse(oldBestCarStats).brain;
                if (i != 0) {
                    NeuralNetwork.mutate(this.cars[i].brain, this.mutation);
                } else {
                    this.cars[i].id = JSON.parse(oldBestCarStats).id;
                }
            }
        }
    }

    getBestCar() {
        if (this.bestCar && !this.healtyCars.length) {
            return this.bestCar;
        }

        return this.healtyCars.find(
            (c) => c.y == Math.min(...this.healtyCars.map((c) => c.y))
        );
    }

    static getSeed(phrase = "", size = 0) {
        const fullPharse = new Array(Math.ceil(size / 3) + 1)
            .join(phrase)
            .slice(0, size);
        let seed = "";
        for (let i = 0; i < fullPharse.length; i++) {
            seed += fullPharse.charCodeAt(i) % 10;
        }

        return seed;
    }

    carOnScreen(car) {
        return car.y < this.topOfScreen() && car.y > this.bottomOfScreen();
    }

    topOfScreen() {
        return this.bestCar.y + Simulation.simulationCanvas.height * 0.7;
    }

    bottomOfScreen() {
        return this.bestCar.y - Simulation.simulationCanvas.height * 0.3;
    }
}
