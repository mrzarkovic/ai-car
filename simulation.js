"use strict";

class Simulation {
    static simulationCanvas = document.getElementById("simulation");
    static networkCanvas = document.getElementById("network");
    static simulationCtx = Simulation.simulationCanvas.getContext("2d");
    static networkCtx = Simulation.networkCanvas.getContext("2d");

    constructor(
        subjectsCount = 0,
        enemiesCount = 0,
        seed = "",
        output = null,
        level = 1
    ) {
        Simulation.simulationCanvas.width = 260;
        Simulation.networkCanvas.width = 600;

        this.level = level;
        this.try = 0;
        this.output = output;
        this.seed = Simulation.getSeed(seed, 100);
        this.subjectsCount = subjectsCount;
        this.enemiesCount = enemiesCount;
        this.totalEnemies = 0;
        this.enemiesOvertook = [];
        this.lastOvertake = 0;
        this.road = null;
        this.cars = [];
        this.healtyCars = [];
        this.bestCar = null;
        this.traffic = [];
        this.startTime = null;
        this.stop = true;

        this.parentCar = null;
        this.onEndCallback = null;
        this.animationFrameId = null;
    }

    nextLevel() {
        this.save();
        this.level += 1;
        this.restart();
    }

    start() {
        this.initialize();
        this.animate();
    }

    retry() {
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
        this.try += 1;
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

        this.loadBestBrain();
    }

    destroy() {
        cancelAnimationFrame(this.animationFrameId);
        this.startTime = null;
        this.animationFrameId = null;
        this.enemiesOvertook = [];
        this.lastOvertake = 0;
        this.road = null;
        this.cars = [];
        this.healtyCars = [];
        this.bestCar = null;
        this.traffic = [];
        this.stop = true;

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

    animate(time = 0) {
        if (!this.startTime) {
            this.startTime = time;
        }
        const animationTime = time - this.startTime;
        if (this.stop) {
            return;
        }
        Simulation.simulationCanvas.height = window.innerHeight;
        Simulation.networkCanvas.height = window.innerHeight;

        this.healtyCars = this.cars.filter((c) => !c.damaged);
        const enemiesLeft = this.totalEnemies - this.enemiesOvertook.length;
        this.output.innerHTML = `
            <div>
                Generation:<br />${this.level - 1} 
            </div>
            <div>
                Iteration:<br />${this.try} 
            </div>
            <br />
            <div>
                Speed:<br />${Math.round(
                    Math.abs(this.bestCar.speed) / 10
                )} km/h
            </div>
            <br />
            <div>
                Population:<br />${this.healtyCars.length}/${this.subjectsCount}
            </div>
            <br />
            <div>
                Enemies:<br />${enemiesLeft}/${this.totalEnemies}
            </div>
        `;
        this.bestCar = this.getBestCar();

        if (animationTime / 1000 > 5) {
            this.penalizeStalling(animationTime);
        }

        Simulation.simulationCtx.save();

        this.moveCamera();
        this.road.draw(Simulation.simulationCtx);
        this.updateTraffic(animationTime);
        this.updateCars();

        this.drawNetwork(animationTime);
        this.drawTraffic();
        this.drawCars();
        this.drawBestCar();
        this.drawParentCar();

        Simulation.simulationCtx.restore();
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
                    this.nextLevel();
                }.bind(this),
                500
            );
        } else {
            this.animationFrameId = requestAnimationFrame(
                this.animate.bind(this)
            );
        }
    }

    save() {
        localStorage.setItem("bestBrain", JSON.stringify(this.bestCar.brain));
    }

    static printLine(text = "") {
        this.output.innerHTML = `<div>${text}</div>`;
    }
    static printBreak() {
        this.output.innerHTML = `<br />`;
    }

    drawParentCar() {
        this.parentCar.draw(
            Simulation.simulationCtx,
            this.parentCar.id == this.bestCar.id
        );
    }

    drawBestCar() {
        if (this.bestCar && this.bestCar.id != this.parentCar.id) {
            // this.bestCar.color = "#F7E014";
            this.bestCar.draw(Simulation.simulationCtx, true);
        }
    }

    drawCars() {
        Simulation.simulationCtx.globalAlpha = 0.2;
        const regularCars = this.cars.filter(
            (c) => [this.bestCar.id, this.parentCar.id].indexOf(c.id) == -1
        );
        for (let i = 0; i < regularCars.length; i++) {
            regularCars[i].color = "#4514F7";
            regularCars[i].draw(Simulation.simulationCtx);
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

    updateCars() {
        for (let i = 0; i < this.cars.length; i++) {
            if (this.cars[i].damaged) {
                if (
                    this.bestCar &&
                    isOutOfScreen(
                        this.cars[i].y - this.cars[i].height * 0.75,
                        Simulation.simulationCanvas.height,
                        this.bestCar.y
                    )
                ) {
                    this.cars.splice(i, 1);
                }
            } else {
                this.cars[i].update(this.road.borders, this.traffic);
            }
        }
    }

    updateTraffic(time) {
        for (let i = 0; i < this.traffic.length; i++) {
            this.traffic[i].update(this.road.borders, []);
            const enemyTop = this.traffic[i].y - this.traffic[i].height * 0.75;
            const bestCarBottom = this.bestCar.y + this.bestCar.height * 0.3;

            if (this.bestCar && enemyTop > bestCarBottom) {
                if (this.enemiesOvertook.indexOf(this.traffic[i].id) == -1) {
                    this.enemiesOvertook.push(this.traffic[i].id);
                    this.lastOvertake = time;
                }
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

    penalizeStalling(time) {
        if (
            this.traffic.length &&
            this.bestCar &&
            time - this.lastOvertake >
                lerp(
                    10,
                    5000,
                    this.bestCar.speed
                        ? this.bestCar.maxSpeed / this.bestCar.speed
                        : 0
                )
        ) {
            this.bestCar.damaged = true;
            this.lastOvertake = time;
        }
    }

    loadBestBrain() {
        this.parentCar = this.cars[0];
        this.parentCar.color = "#1498F7";

        if (localStorage.getItem("bestBrain")) {
            for (let i = 0; i < this.cars.length; i++) {
                this.cars[i].brain = JSON.parse(
                    localStorage.getItem("bestBrain")
                );
                if (i != 0) {
                    NeuralNetwork.mutate(this.cars[i].brain, 0.1);
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
}
