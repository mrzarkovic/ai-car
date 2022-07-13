class Car {
    constructor(x, y, width, height, maxSpeed = 100, controlType, color) {
        this.id = Math.floor(Math.random() * Date.now());

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.speed = 0;
        this.acceleration = 0.03;
        this.maxSpeed = maxSpeed / 100;
        this.friction = 0.01;
        this.angle = 0;
        this.polygon = null;
        this.damaged = false;
        this.color = color;

        if (controlType != "DUMMY") {
            this.sensor = new Sensor(this);
        }
        if (controlType == "AI") {
            this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
        }

        this.controls = new Controls(controlType);
    }

    update(roadBorders, traffic) {
        if (!this.damaged) {
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
        }
        if (this.sensor) {
            this.sensor.update(roadBorders, traffic);

            if (this.brain) {
                const offsets = this.sensor.readings.map((s) =>
                    s == null ? 0 : 1 - s.offset
                );
                const outputs = NeuralNetwork.feedForward(offsets, this.brain);
                this.controls.forward = outputs[0];
                this.controls.reverse = outputs[1];
                this.controls.left = outputs[2];
                this.controls.right = outputs[3];
            }
        }
    }

    #assessDamage(roadBorders, traffic) {
        for (let i = 0; i < roadBorders.length; i++) {
            if (polysIntersect(this.polygon, roadBorders[i])) {
                return true;
            }
        }

        for (let i = 0; i < traffic.length; i++) {
            if (polysIntersect(this.polygon, traffic[i].polygon)) {
                return true;
            }
        }

        return false;
    }

    #createPolygon() {
        const centerOffset = 0.5;
        const points = [];
        const topRad =
            Math.hypot(this.width, this.height + this.height * centerOffset) /
            2;
        const bottomRad =
            Math.hypot(this.width, this.height - this.height * centerOffset) /
            2;
        const topAlpha = Math.atan2(
            this.width,
            this.height + this.height * centerOffset
        );
        const bottomAlpha = Math.atan2(
            this.width,
            this.height - this.height * centerOffset
        );

        // top right corner
        points.push({
            x: this.x - Math.sin(this.angle - topAlpha) * topRad,
            y: this.y - Math.cos(this.angle - topAlpha) * topRad,
        });
        // top left corner
        points.push({
            x: this.x - Math.sin(this.angle + topAlpha) * topRad,
            y: this.y - Math.cos(this.angle + topAlpha) * topRad,
        });
        // bottom left corner
        points.push({
            x:
                this.x -
                Math.sin(Math.PI + this.angle - bottomAlpha) * bottomRad,
            y:
                this.y -
                Math.cos(Math.PI + this.angle - bottomAlpha) * bottomRad,
        });
        // bottom right corner
        points.push({
            x:
                this.x -
                Math.sin(Math.PI + this.angle + bottomAlpha) * bottomRad,
            y:
                this.y -
                Math.cos(Math.PI + this.angle + bottomAlpha) * bottomRad,
        });

        return points;
    }

    #move() {
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }

        if (this.controls.reverse) {
            const breaks = this.speed > 0 ? 1 : 0;
            this.speed -= this.acceleration + 5 * this.acceleration * breaks;
        }

        if (this.speed > 0) {
            this.speed -= this.friction;
        }

        if (this.speed < 0) {
            this.speed += this.friction;
        }

        this.speed = Math.min(this.speed, this.maxSpeed);
        this.speed = Math.max(this.speed, -this.maxSpeed / 4);

        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        if (this.speed != 0) {
            const speedPercent = Math.abs(this.speed / this.maxSpeed);
            const flip = this.speed > 0 ? 1 : -1;

            let turnSpeed = 0.02;
            if (speedPercent < 0.4) {
                turnSpeed = speedPercent * turnSpeed;
            } else {
                turnSpeed = Math.max((1 - speedPercent) * turnSpeed, 0.005);
            }

            if (this.controls.left) {
                this.angle += turnSpeed * flip;
            }

            if (this.controls.right) {
                this.angle -= turnSpeed * flip;
            }
        }

        this.x -= Math.sin(this.angle) * this.speed;

        this.y -= Math.cos(this.angle) * this.speed;
    }

    draw(ctx, drawSensor = false) {
        if (this.damaged) {
            ctx.fillStyle = "gray";
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
        for (let i = 1; i < this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        ctx.fill();
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }

    static generateCars(count, road) {
        const cars = [];

        for (let i = 0; i < count; i++) {
            const car = new Car(
                road.getLaneCenter(1),
                0,
                30,
                50,
                130,
                "AI",
                "blue"
            );

            cars.push(car);
        }

        return cars;
    }

    static generateTraffic(count, startY, road, seed) {
        const traffic = [];

        for (let i = 1; i <= count; i++) {
            traffic.push(
                new Car(
                    road.getLaneCenter(Number(seed[i]) % 3),
                    startY - 200 * i * lerp(0.65, 0.7, Number(seed[i]) / 10),
                    30,
                    50,
                    80,
                    "DUMMY",
                    "#F76345"
                )
            );
        }

        return traffic;
    }
}
