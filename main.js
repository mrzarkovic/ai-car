"use strict";

const output = document.getElementById("text");
const simulation = new Simulation(100, 5, "beograd", output, 1);
simulation.start();

// const subjectsCount = 100;
// const enemiesCount = 10;
// const seed = "zagreb";
// const lastOvertake = {
//     enemyId: null,
//     time: 0,
// };

// const simulationCanvas = document.getElementById("simulation");
// simulationCanvas.width = 260;

// const networkCanvas = document.getElementById("network");
// networkCanvas.width = 600;

// const simulationCtx = simulationCanvas.getContext("2d");
// const networkCtx = networkCanvas.getContext("2d");

// const road = new Road(simulationCanvas.width / 2, simulationCanvas.width * 0.8);
// const cars = Car.generateCars(subjectsCount, road);
// let bestCar = getBestCar(cars);
// const traffic = Car.generateTraffic(
//     enemiesCount,
//     bestCar.car.y,
//     road,
//     getSeed(seed, enemiesCount)
// );

// loadBestBrain(cars);

// animate(0);

// function animate(time) {
//     simulationCanvas.height = window.innerHeight;
//     networkCanvas.height = window.innerHeight;

//     const healtyCars = cars.filter((c) => !c.damaged);
//     bestCar = getBestCar(healtyCars);

//     penalizeStalling(bestCar, time);

//     simulationCtx.save();

//     moveCamera(bestCar);
//     road.draw(simulationCtx);
//     updateTraffic(bestCar, time);
//     updateCars(bestCar);

//     drawNetwork(bestCar, time);
//     drawTraffic(simulationCtx);
//     drawCars(simulationCtx);
//     bestCar && bestCar.car.draw(simulationCtx, true);
//     cars[0].draw(simulationCtx);

//     simulationCtx.restore();

//     requestAnimationFrame(animate);
// }

// function drawNetwork(bestCar, time) {
//     if (bestCar) {
//         networkCtx.lineDashOffset = -time / 50;
//         Visualizer.drawNetwork(networkCtx, bestCar.car.brain);
//     }
// }

// function moveCamera() {
//     if (bestCar) {
//         simulationCtx.translate(
//             0,
//             -bestCar.car.y + simulationCanvas.height * 0.7
//         );
//     }
// }

// function drawTraffic() {
//     for (let i = 0; i < traffic.length; i++) {
//         traffic[i].draw(simulationCtx);
//     }
// }

// function drawCars() {
//     simulationCtx.globalAlpha = 0.2;
//     for (let i = 1; i < cars.length; i++) {
//         cars[i].draw(simulationCtx);
//     }
//     simulationCtx.globalAlpha = 1;
// }

// function penalizeStalling(bestCar, time) {
//     if (bestCar && time - lastOvertake.time > bestCar.car.speed * 10) {
//         bestCar.car.damaged = true;
//         lastOvertake.time = time;
//         lastOvertake.enemyId = null;
//     }
// }

// function updateTraffic(bestCar, time) {
//     for (let i = 0; i < traffic.length; i++) {
//         traffic[i].update(road.borders, []);
//         if (bestCar && traffic[i].y - traffic[i].height > bestCar.car.y) {
//             if (lastOvertake.enemyId != i) {
//                 lastOvertake.enemyId = i;
//                 lastOvertake.time = time;
//             }
//             if (
//                 isOutOfScreen(
//                     traffic[i].y,
//                     simulationCanvas.height,
//                     bestCar.car.y
//                 )
//             ) {
//                 traffic.splice(i, 1);
//             }
//         }
//     }
// }

// function updateCars(bestCar) {
//     for (let i = 0; i < cars.length; i++) {
//         if (cars[i].damaged) {
//             if (
//                 bestCar &&
//                 isOutOfScreen(cars[i].y, simulationCanvas.height, bestCar.car.y)
//             ) {
//                 cars.splice(i, 1);
//             }
//         } else {
//             cars[i].update(road.borders, traffic);
//         }
//     }
// }

// function getBestCar(cars) {
//     if (!cars || !cars.length) {
//         return bestCar;
//     }

//     const best = {
//         car: cars[0],
//         id: 0,
//     };

//     cars.find((c, i) => {
//         if (c.y == Math.min(...cars.map((c) => c.y))) {
//             if (i > 0) {
//                 c.color = "yellow";
//             }
//             best.car = c;
//             best.id = i;
//         } else {
//             if (i > 0) {
//                 c.color = "blue";
//             }
//         }
//     });

//     return best;
// }

// function loadBestBrain(cars) {
//     if (localStorage.getItem("bestBrain")) {
//         for (let i = 0; i < cars.length; i++) {
//             cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
//             if (i != 0) {
//                 NeuralNetwork.mutate(cars[i].brain, 0.1);
//             } else {
//                 cars[0].color = "orange";
//             }
//         }
//     }
// }
