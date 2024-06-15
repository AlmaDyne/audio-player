export class HoverIntent {
    constructor({
        sensitivity = 0.01,
        interval = 100,
        executeTaskDelay = 500,
        elem,
        repeatTask = false,
        executeTask,
        dismissTask
    }) {
        this.sensitivity = sensitivity;
        this.interval = interval;
        this.executeTaskDelay = executeTaskDelay;
        this.elem = elem;
        this.repeatTask = repeatTask;
        this.executeTask = this.isReady(executeTask.bind(this));
        this.dismissTask = dismissTask;

        this.onPointerEnter = this.onPointerEnter.bind(this);
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.finishAndClear = this.finishAndClear.bind(this);
        this.calcSpeed = this.calcSpeed.bind(this);
        this.calcFinishingRadius = this.calcFinishingRadius.bind(this);

        elem.addEventListener('pointerenter', this.onPointerEnter);
    }

    isReady(func) {
        return () => {
            if (this.elemRect) func();
        };
    }

    setExecuteTaskStrategy(strategy) {
        this.executeTask = this.isReady(strategy.bind(this));
    }
    
    onPointerEnter(event) {
        if (this.timerCalcSpeed) return;

        this.elem.addEventListener('pointermove', this.onPointerMove);
        this.elem.addEventListener('pointerdown', this.onPointerDown);
        this.elem.addEventListener('pointerup', this.onPointerUp);
        this.elem.addEventListener('pointerleave', this.finishAndClear);
        document.addEventListener('keydown', this.onKeyDown);

        this.elemRect = this.elem.getBoundingClientRect();
        this.x1 = event.clientX - this.elemRect.left;
        this.y1 = event.clientY - this.elemRect.top;

        this.timerCalcSpeed = setTimeout(this.calcSpeed, this.interval);
    }

    onPointerMove(event) {
        if (!event.isTrusted) return;

        if (this.ignoringMoveAfterUp) {
            delete this.ignoringMoveAfterUp;
            return;
        }
        
        this.x2 = event.clientX - this.elemRect.left;
        this.y2 = event.clientY - this.elemRect.top;

        if (this.timerExecuteTask) {
            clearTimeout(this.timerExecuteTask);
            this.timerExecuteTask = null;

            this.x1 = this.x2;
            this.y1 = this.y2;

            this.timerCalcSpeed = setTimeout(this.calcSpeed, this.interval);
        }

        if (!this.timerCalcSpeed) {
            if (this.repeatTask) {
                this.dismissTask();
                this.taskDone = false;

                this.x1 = this.x2;
                this.y1 = this.y2;

                this.timerCalcSpeed = setTimeout(this.calcSpeed, this.interval);
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
            this.timerCalcSpeed = null;

            this.timerExecuteTask = setTimeout(() => {
                this.timerExecuteTask = null;

                this.executeTask();
                this.taskDone = true;
            }, this.executeTaskDelay);
        } else {
            this.timerCalcSpeed = setTimeout(this.calcSpeed, this.interval);
        }
    }

    calcFinishingRadius() {
        let radius = Math.sqrt((this.x2 - this.x1) ** 2 + (this.y2 - this.y1) ** 2);
        if (radius > 5) this.finishAndClear();
    }

    onPointerDown() {
        if (this.repeatTask) {
            clearTimeout(this.timerCalcSpeed);
            this.timerCalcSpeed = null;
            clearTimeout(this.timerExecuteTask);

            let actionInterval = (this.taskDone) ? 0 : this.executeTaskDelay;

            this.timerExecuteTask = setTimeout(() => {
                this.timerExecuteTask = null;

                this.executeTask();
                this.taskDone = true;
            }, actionInterval);
        } else {
            this.finishAndClear();
        }
    }

    onPointerUp() {
        this.ignoringMoveAfterUp = true;
    }

    onKeyDown() {
        if (!this.repeatTask) this.finishAndClear();
    }

    finishAndClear() {
        clearTimeout(this.timerCalcSpeed);
        clearTimeout(this.timerExecuteTask);

        this.dismissTask();

        this.elem.removeEventListener('pointermove', this.onPointerMove);
        this.elem.removeEventListener('pointerdown', this.onPointerDown);
        this.elem.removeEventListener('pointerup', this.onPointerUp);
        this.elem.removeEventListener('pointerleave', this.finishAndClear);
        document.removeEventListener('keydown', this.onKeyDown);

        delete this.elemRect;
        delete this.timerCalcSpeed;
        delete this.timerExecuteTask;
        delete this.taskDone;
        delete this.x1;
        delete this.y1;
        delete this.x2;
        delete this.y2;
    }
}
