export class PlayerButtonsHoverIntent {
    constructor({
        sensitivity = 0.01,
        interval = 100,
        executeTaskDelay = 500,
        elem,
        repeatTask,
        executeTask,
        dismissTask
    }) {
        this.sensitivity = sensitivity;
        this.interval = interval;
        this.executeTaskDelay = executeTaskDelay;
        this.elem = elem;
        this.repeatTask = repeatTask;
        this.executeTask = executeTask;
        this.dismissTask = dismissTask;

        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.finishAndClear = this.finishAndClear.bind(this);
        this.calcSpeed = this.calcSpeed.bind(this);
        this.calcFinishingRadius = this.calcFinishingRadius.bind(this);

        elem.addEventListener('mouseenter', this.onMouseEnter);
    }
    
    onMouseEnter(event) {
        if (this.calcTimer) return;

        this.elem.addEventListener('mousemove', this.onMouseMove);
        this.elem.addEventListener('mousedown', this.onMouseDown);
        this.elem.addEventListener('mouseleave', this.finishAndClear);

        this.elemRect = this.elem.getBoundingClientRect();
        this.x1 = event.clientX - this.elemRect.left;
        this.y1 = event.clientY - this.elemRect.top;

        this.calcTimer = setTimeout(this.calcSpeed, this.interval);
    }

    onMouseMove(event) {
        this.x2 = event.clientX - this.elemRect.left;
        this.y2 = event.clientY - this.elemRect.top;

        if (this.executeTaskTimer) {
            clearTimeout(this.executeTaskTimer);
            this.executeTaskTimer = null;

            this.x1 = this.x2;
            this.y1 = this.y2;

            this.calcTimer = setTimeout(this.calcSpeed, this.interval);
        }

        if (!this.calcTimer) {
            if (this.repeatTask) {
                this.dismissTask();
                this.taskDone = false;

                this.x1 = this.x2;
                this.y1 = this.y2;

                this.calcTimer = setTimeout(this.calcSpeed, this.interval);
            } else {
                this.calcFinishingRadius();
            }
        }
    }

    calcSpeed() {
        let distance = Math.sqrt((this.x2 - this.x1) ** 2 + (this.y2 - this.y1) ** 2);
        let speed = distance / this.interval;

        this.x1 = this.x2;
        this.y1 = this.y2;

        if (speed < this.sensitivity) {
            this.calcTimer = null;

            this.executeTaskTimer = setTimeout(() => {
                this.executeTaskTimer = null;

                this.executeTask();
                this.taskDone = true;
            }, this.executeTaskDelay);
        } else {
            this.calcTimer = setTimeout(this.calcSpeed, this.interval);
        }
    }

    calcFinishingRadius() {
        let radius = Math.sqrt((this.x2 - this.x1) ** 2 + (this.y2 - this.y1) ** 2);
        if (radius > 5) this.finishAndClear();
    }

    onMouseDown() {
        if (this.repeatTask) {
            clearTimeout(this.calcTimer);
            this.calcTimer = null;
            clearTimeout(this.executeTaskTimer);

            let actionInterval = (this.taskDone) ? 0 : this.executeTaskDelay;

            this.executeTaskTimer = setTimeout(() => {
                this.executeTaskTimer = null;

                this.executeTask();
                this.taskDone = true;
            }, actionInterval);
        } else {
            this.finishAndClear();
        }
    }

    finishAndClear() {
        clearTimeout(this.calcTimer);
        clearTimeout(this.executeTaskTimer);

        this.dismissTask();

        this.elem.removeEventListener('mousemove', this.onMouseMove);
        this.elem.removeEventListener('mousedown', this.onMouseDown);
        this.elem.removeEventListener('mouseleave', this.finishAndClear);

        delete this.elemRect;
        delete this.calcTimer;
        delete this.executeTaskTimer;
        delete this.taskDone;
        delete this.x1;
        delete this.y1;
        delete this.x2;
        delete this.y2;
    }
}