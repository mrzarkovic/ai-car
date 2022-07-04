class Sensor {
    constructor(car) {
        this.car = car;
        this.rayCount = 5;
        this.rayLength = 150;
        this.raySpread = Math.PI * 0.5;
        this.sensorPositionTop = 0.3;

        this.rays = [];
        this.readings = [];
    }

    update(roadBorders, traffic) {
        this.#castRays();

        this.readings = [];

        for (let i = 0; i < this.rays.length; i++) {
            this.readings.push(
                this.#getReading(this.rays[i], roadBorders, traffic)
            );
        }
    }

    #getReading(ray, roadBorders, traffic) {
        let touches = [];

        for (let i = 0; i < roadBorders.length; i++) {
            const touch = getIntersection(
                ray[0],
                ray[1],
                roadBorders[i][0],
                roadBorders[i][1]
            );
            if (touch) {
                touches.push(touch);
            }
        }

        for (let i = 0; i < traffic.length; i++) {
            const poly = traffic[i].polygon;
            for (let j = 0; j < poly.length; j++) {
                const touch = getIntersection(
                    ray[0],
                    ray[1],
                    poly[j],
                    poly[(j + 1) % poly.length]
                );
                if (touch) {
                    touches.push(touch);
                }
            }
        }

        if (touches.length == 0) {
            return null;
        }

        const offsets = touches.map((touch) => touch.offset);
        const minOffset = Math.min(...offsets);

        return touches.find((touch) => touch.offset == minOffset);
    }

    #castRays() {
        this.rays = [];

        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle =
                lerp(
                    this.raySpread / 2,
                    -this.raySpread / 2,
                    this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
                ) + this.car.angle;

            const start = {
                x:
                    this.car.x -
                    Math.sin(this.car.angle) *
                        lerp(
                            this.car.height * -0.25,
                            this.car.height * 0.75,
                            1 - this.sensorPositionTop
                        ),
                y:
                    this.car.y -
                    Math.cos(this.car.angle) *
                        lerp(
                            this.car.height * -0.25,
                            this.car.height * 0.75,
                            1 - this.sensorPositionTop
                        ),
            };
            const end = {
                x: start.x - Math.sin(rayAngle) * this.rayLength,
                y: start.y - Math.cos(rayAngle) * this.rayLength,
            };

            this.rays.push([start, end]);
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.rayCount; i++) {
            let end = this.rays[i][1];
            let color = "limegreen";
            if (this.readings[i]) {
                end = this.readings[i];
                if (this.readings[i].offset < 0.2) {
                    color = "red";
                } else if (this.readings[i].offset < 0.5) {
                    color = "yellow";
                }
            }
            ctx.setLineDash([0, 0]);
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            ctx.setLineDash([5, 3]);
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "gray";
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(this.rays[i][1].x, this.rays[i][1].y);
            ctx.stroke();
        }
    }
}
