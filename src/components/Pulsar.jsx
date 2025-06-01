import { useEffect, useRef, useState } from "react"

export default function Pulsar({ borderSize=500, particleSize=10, color }) {
    const canvasRef = useRef(null)
    let particleNumber = Math.floor(borderSize / particleSize)
    let maxSpeed = 3;
    let frameTime = 100; //10ms

    let mouseMovementMatrix = createMatrix([0, 0]);
    let mouseDistanceTraveled = 0;
    let prevMousePosition = [0,0];
    const mouseRadiusBoundary = [1,50]; //(radius in px unit)

    let [particleMatrix, setParticleMatrix] = useState(new createMatrix([0, 0]));
    
    function createMatrix(fillValue = [0, 0]) {
        return Array.from({ length: particleNumber }, () => new Array(particleNumber).fill(fillValue));
    }

    function getSize(vector) {
        let velocity = Math.hypot(vector[0], vector[1]);
        let size = (particleSize / 2) * (velocity / (velocity + 10)); // Logarithmic growth based on velocity  
        return Math.max(size,0.3);
    }

    function reduceSpeed(speed) {
        // let reduction = Math.ceil(Math.abs(speed) / 10);
        let reduction = Math.ceil(maxSpeed * Math.abs(speed) / (Math.abs(speed) + 10)); // Logarithmic decay
        // reduction = 1;
        return (speed > 0)? speed - reduction : (speed < 0)? speed + reduction : 0;
    }

    function getTargetPosition(currIndex, velocity, speedDamp = 100) {
        let change = 0;
        if (velocity > 0) {
            change = Math.ceil((maxSpeed) * (velocity / (velocity + speedDamp)));
        } else if (velocity < 0) {
            change = Math.ceil((maxSpeed) * (Math.abs(velocity) / (Math.abs(velocity) + speedDamp))) * -1;
        }
        return currIndex + change;
    }

    function updateMatrix() {
        let newMatrix = new createMatrix([0, 0]);
        
        //Next matrix state calculation

        for (let i = 0; i < particleNumber; i++){
            for (let j = 0; j < particleNumber; j++){
                let vector = particleMatrix[i][j];
                if (vector[0] == 0 && vector[1] == 0) {
                    continue;
                }
                let targetPosX = getTargetPosition(i, vector[0]);
                let speedValueX = reduceSpeed(vector[0]);
                while (targetPosX >= particleNumber || targetPosX < 0) {
                    if (targetPosX >= particleNumber) {
                        targetPosX = particleNumber - (targetPosX - (particleNumber - 1));
                    }
                    else if (targetPosX < 0) {
                        targetPosX *= -1;
                    }
                    speedValueX *= -1;
                }
                let targetPosY = getTargetPosition(j, vector[1]);
                let speedValueY = reduceSpeed(vector[1]);
                while (targetPosY >= particleNumber || targetPosY < 0) {
                    if (targetPosY >= particleNumber) {
                        targetPosY = particleNumber - (targetPosY - (particleNumber - 1));
                    }
                    else if (targetPosY < 0) {
                        targetPosY *= -1;
                    }
                    speedValueY *= -1;
                }

                newMatrix[targetPosX][targetPosY] = [newMatrix[targetPosX][targetPosY][0] + speedValueX, newMatrix[targetPosX][targetPosY][1] + speedValueY];
            }
        }

        // Mouse movement filter

        let radiusLength = 0;
        for (let i = 0; i < particleNumber; i++) {
            for (let j = 0; j < particleNumber; j++) {
                if (mouseMovementMatrix[i][j][0] != 0 || mouseMovementMatrix[i][j][1] != 0) {
                    radiusLength+=1;
                } 
            }
        }

        let mouseSpeed = Math.floor(mouseDistanceTraveled / frameTime);
        let radius = Math.floor(Math.max(mouseRadiusBoundary[0] / particleSize, Math.min(radiusLength, mouseRadiusBoundary[1] / particleSize))); //(in index)
        let mouseMovementMatrixPostRadius = new createMatrix([0, 0]);

        for (let i = 0; i < particleNumber; i++) {
            for (let j = 0; j < particleNumber; j++) {
                if (mouseMovementMatrix[i][j][0] != 0 || mouseMovementMatrix[i][j][1] != 0) {

                    for (let x = i - radius; x <= i+radius; x++){
                        for (let y = j - radius; y <= j+radius; y++){
                            if (x < 0 || x >= particleNumber || y < 0 || y >= particleNumber) {
                                continue;
                            }
                            if (Math.hypot((x - i), (y - j)) > radius) {
                                continue;
                            }
                            mouseMovementMatrixPostRadius[x][y] = [
                            mouseMovementMatrixPostRadius[x][y][0] + mouseMovementMatrix[i][j][0],
                            mouseMovementMatrixPostRadius[x][y][1] + mouseMovementMatrix[i][j][1],
                            ]
                            
                        }
                    }
                } 
            }
        }

        for (let i = 0; i < particleNumber; i++) {
            for (let j = 0; j < particleNumber; j++) {
                newMatrix[i][j] = [
                    newMatrix[i][j][0] + mouseMovementMatrixPostRadius[i][j][0] * mouseSpeed,
                    newMatrix[i][j][1] + mouseMovementMatrixPostRadius[i][j][1] * mouseSpeed
                ];
            }
        }

        setParticleMatrix(newMatrix);
    }

    function drawMatrix(context, matrix, color) {

        context.fillStyle = color;
        context.clearRect(0, 0, context.canvas.width, context.canvas.height);

        for (let i = 0; i < matrix.length; i++){
            for (let j = 0; j < matrix[0].length; j++){
                context.beginPath();
                context.arc(
                    particleSize * i + particleSize / 2,
                    particleSize * j + particleSize / 2,
                    getSize(matrix[i][j]),
                    0,
                    2 * Math.PI
                );
                context.shadowColor = color;
                context.shadowBlur = 10; // integer
                context.fill();
            }
        }
    }

    function getCoordinatedBetweenPoints(x1, y1, x2, y2) {
        let coordinates = [];
        const x3 = Math.floor((x1 + x2) / 2);
        const y3 = Math.floor((y1 + y2) / 2);
        if ((x3 == x1 || x3 == x1) && (y3 == y1 || y3 == y2)) {
            return coordinates;
        }
        else {
            coordinates.push([x3, y3]);
            coordinates = coordinates.concat(getCoordinatedBetweenPoints(x1, y1, x3, y3));
            coordinates = coordinates.concat(getCoordinatedBetweenPoints(x3, y3, x2, y2));
            return coordinates;
        }
    }

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        drawMatrix(context, particleMatrix, 'purple');

        const updateMouseMatrix = (event) => {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const i = Math.floor(x / particleSize);
            const j = Math.floor(y / particleSize);

            const xDirection = x - prevMousePosition[0];
            const yDirection = y - prevMousePosition[1];

            if (prevMousePosition && i >= 0 && i < particleNumber && j>=0 && j < particleNumber) {
                mouseMovementMatrix[i][j] = [(xDirection > 0) ? 1 : (xDirection < 0) ? -1 : 0, (yDirection > 0) ? 1 : (yDirection < 0) ? -1 : 0];
            }

            prevMousePosition = [x, y];

            mouseDistanceTraveled += Math.hypot(xDirection, yDirection);
        };

        canvas.addEventListener('mousemove', updateMouseMatrix);
        const canvasInterval = setInterval(updateMatrix, frameTime);

        return () => {
            canvas.removeEventListener('mousemove', updateMouseMatrix);
            clearInterval(canvasInterval);
        };

    }, [particleMatrix]);

    return <canvas
        ref={canvasRef}
        width={borderSize}
        height={borderSize}
        />
}