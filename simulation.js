"use strict";

class Simulation {
    static simulationCanvas = document.getElementById("simulation");
    static networkCanvas = document.getElementById("network");
    static simulationCtx = Simulation.simulationCanvas.getContext("2d");
    static networkCtx = Simulation.networkCanvas.getContext("2d");

    constructor(subjectsCount = 0, enemiesCount = 0, seed = "") {
        Simulation.simulationCanvas.width = 260;
        Simulation.networkCanvas.width = 600;

        this.subjectsCount = subjectsCount;
        this.enemiesCount = enemiesCount;
        this.lastOvertake = {
            carId: null,
            time: 0,
        };
        this.road = new Road(
            Simulation.simulationCanvas.width / 2,
            Simulation.simulationCanvas.width * 0.8
        );
        this.cars = Car.generateCars(subjectsCount, this.road);
        this.healtyCars = this.cars;
        this.bestCar = this.getBestCar();
        this.traffic = Car.generateTraffic(
            enemiesCount,
            this.bestCar.y,
            this.road,
            Simulation.getSeed(seed, enemiesCount)
        );
        this.parentCar = null;

        this.loadBestBrain();
    }

    animate(time = 0) {
        Simulation.simulationCanvas.height = window.innerHeight;
        Simulation.networkCanvas.height = window.innerHeight;

        this.healtyCars = this.cars.filter((c) => !c.damaged);
        this.bestCar = this.getBestCar();

        if (time / 1000 > 5) {
            this.penalizeStalling(time);
        }

        Simulation.simulationCtx.save();

        this.moveCamera();
        this.road.draw(Simulation.simulationCtx);
        this.updateTraffic(time);
        this.updateCars();

        this.drawNetwork(time);
        this.drawTraffic();
        this.drawCars();
        this.drawBestCar();
        this.drawParentCar();

        Simulation.simulationCtx.restore();

        requestAnimationFrame(this.animate.bind(this));
    }

    drawParentCar() {
        this.parentCar.draw(
            Simulation.simulationCtx,
            this.parentCar.id == this.bestCar.id
        );
    }

    drawBestCar() {
        if (this.bestCar && this.bestCar.id != this.parentCar.id) {
            this.bestCar.color = "yellow";
            this.bestCar.draw(Simulation.simulationCtx, true);
        }
    }

    drawCars() {
        Simulation.simulationCtx.globalAlpha = 0.2;
        // const regularCars = this.cars.filter(
        //     (c) => [this.bestCar.id, this.parentCar.id].indexOf(c.id) == -1
        // );
        for (let i = 0; i < this.cars.length; i++) {
            this.cars[i].color = "blue";
            this.cars[i].draw(Simulation.simulationCtx);
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
                        this.cars[i].y,
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
            if (
                this.bestCar &&
                this.traffic[i].y - this.traffic[i].height > this.bestCar.y
            ) {
                if (this.lastOvertake.carId != i) {
                    this.lastOvertake.carId = i;
                    this.lastOvertake.time = time;
                }
                if (
                    isOutOfScreen(
                        this.traffic[i].y,
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
            this.bestCar &&
            time - this.lastOvertake.time > this.bestCar.speed * 10
        ) {
            this.bestCar.damaged = true;
            this.lastOvertake.time = time;
            this.lastOvertake.carId = null;
        }
    }

    loadBestBrain() {
        this.parentCar = this.cars[0];
        this.parentCar.color = "orange";

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
        const fullPharse = new Array(size + 1).join(phrase);
        let seed = "";
        for (let i = 0; i < fullPharse.length; i++) {
            seed += fullPharse.charCodeAt(i) % 10;
        }

        return seed;
    }
}
