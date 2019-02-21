export class Platform {
    constructor(x, y) {
        this.X = ~~x;
        this.Y = y;
        this.firstColor = '#FF8C00';
        // this.secondColor = '#EEEE00';
    }

    draw(ctx) {
        // ctx.fillStyle = this.firstColor;
        ctx.fillRect(this.X,this.Y,100,20);
    }
}
