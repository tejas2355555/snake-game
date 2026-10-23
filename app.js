"use strict";

/* =========================================================
   ELEMENTS
========================================================= */

const canvas =
    document.getElementById("canvas");

const ctx =
    canvas.getContext("2d");

const overlay =
    document.getElementById("overlay");

const title =
    document.getElementById("title");

const message =
    document.getElementById("message");

const scoreEl =
    document.getElementById("score");

const bestEl =
    document.getElementById("best");

const startBtn =
    document.getElementById("startBtn");

const soundBtn =
    document.getElementById("soundBtn");

const pauseBtn =
    document.getElementById("pauseBtn");

const fullscreenBtn =
    document.getElementById("fullscreenBtn");

const finalScore =
    document.getElementById("finalScore");

const comboEl =
    document.getElementById("combo");

const colorSelect =
    document.getElementById("snakeColor");

const eyesSelect =
    document.getElementById("eyes");

const foodSelect =
    document.getElementById("food");

const bgSelect =
    document.getElementById("background");

const modeSelect =
    document.getElementById("mode");

const powerSelect =
    document.getElementById("power");

const sfxRange =
    document.getElementById("sfxVolume");

const musicRange =
    document.getElementById("musicVolume");

const sfxValue =
    document.getElementById("sfxValue");

const musicValue =
    document.getElementById("musicValue");


/* =========================================================
   GAME SETTINGS
========================================================= */

const GRID = 24;

let cell = 20;

let snake = [];

let food = {
    x:5,
    y:5
};

let score = 0;

let best =
    Number(
        localStorage.getItem(
            "snakeUltimateBest"
        )
    ) || 0;

let running = false;

let paused = false;

let lastTime = 0;

let accumulator = 0;

let direction = {
    x:1,
    y:0
};

let nextDirection = {
    x:1,
    y:0
};

let speed = 110;


/* =========================================================
   SETTINGS
========================================================= */

let snakeColor = "green";

let eyeStyle = "normal";

let foodType = "apple";

let background = "dark";

let gameMode = "classic";

let powerEnabled = true;


/* =========================================================
   COMBO
========================================================= */

let combo = 0;

let comboTimer = 0;

let comboLimit = 2200;


/* =========================================================
   TONGUE
========================================================= */

let tongueActive = false;

let tongueTimer = 0;

let tongueNext = 5000;

let tongueProgress = 0;


/* =========================================================
   POWER UP
========================================================= */

let powerUp = null;

let powerTimer = 0;


/* =========================================================
   PARTICLES
========================================================= */

let particles = [];


/* =========================================================
   AUDIO
========================================================= */

let audio = null;

let soundEnabled = true;

let musicTimer = null;

let musicIndex = 0;


/* =========================================================
   SKINS
========================================================= */

const SKINS = {

    green:{
        head:"#3cff7d",
        body:"#139849",
        dark:"#075e2d"
    },

    blue:{
        head:"#42b5ff",
        body:"#146baa",
        dark:"#0b4672"
    },

    red:{
        head:"#ff5369",
        body:"#c52d45",
        dark:"#7d1d2d"
    },

    purple:{
        head:"#d06cff",
        body:"#7138a8",
        dark:"#462367"
    },

    gold:{
        head:"#ffe16a",
        body:"#d49a16",
        dark:"#86620c"
    }

};


/* =========================================================
   RESIZE
========================================================= */

function resize(){

    const rect =
        canvas.getBoundingClientRect();

    const dpr =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );

    canvas.width =
        rect.width * dpr;

    canvas.height =
        rect.height * dpr;

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    cell =
        rect.width / GRID;
}

window.addEventListener(
    "resize",
    resize
);


/* =========================================================
   AUDIO
========================================================= */

function initAudio(){

    if(!audio){

        const AC =
            window.AudioContext ||
            window.webkitAudioContext;

        if(AC){
            audio = new AC();
        }
    }

    if(
        audio &&
        audio.state === "suspended"
    ){
        audio.resume();
    }
}


function tone(
    frequency,
    duration,
    volume = .1,
    type = "square"
){

    if(
        !soundEnabled ||
        !audio
    ){
        return;
    }

    const osc =
        audio.createOscillator();

    const gain =
        audio.createGain();

    const volumeValue =
        volume *
        (Number(sfxRange.value) / 100);

    osc.type = type;

    osc.frequency.value =
        frequency;

    gain.gain.setValueAtTime(
        volumeValue,
        audio.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        .001,
        audio.currentTime + duration
    );

    osc.connect(gain);

    gain.connect(audio.destination);

    osc.start();

    osc.stop(
        audio.currentTime +
        duration
    );
}


/* =========================================================
   HISS
========================================================= */

function hiss(){

    if(
        !soundEnabled ||
        !audio
    ){
        return;
    }

    const duration = .42;

    const length =
        Math.floor(
            audio.sampleRate *
            duration
        );

    const buffer =
        audio.createBuffer(
            1,
            length,
            audio.sampleRate
        );

    const data =
        buffer.getChannelData(0);

    for(
        let i = 0;
        i < length;
        i++
    ){
        data[i] =
            Math.random() * 2 - 1;
    }

    const source =
        audio.createBufferSource();

    const filter =
        audio.createBiquadFilter();

    const gain =
        audio.createGain();

    filter.type =
        "highpass";

    filter.frequency.value =
        2600;

    const vol =
        .20 *
        (Number(sfxRange.value) / 100);

    gain.gain.setValueAtTime(
        .001,
        audio.currentTime
    );

    gain.gain.linearRampToValueAtTime(
        vol,
        audio.currentTime + .06
    );

    gain.gain.exponentialRampToValueAtTime(
        .001,
        audio.currentTime + duration
    );

    source.buffer = buffer;

    source.connect(filter);

    filter.connect(gain);

    gain.connect(
        audio.destination
    );

    source.start();
}


/* =========================================================
   BITE SOUND
========================================================= */

function biteSound(){

    tone(
        430,
        .055,
        .24,
        "square"
    );

    setTimeout(
        ()=>{
            tone(
                690,
                .065,
                .22,
                "square"
            );
        },
        45
    );

    if(navigator.vibrate){
        navigator.vibrate(35);
    }
}


/* =========================================================
   POWER SOUND
========================================================= */

function powerSound(){

    tone(
        500,
        .08,
        .18,
        "sine"
    );

    setTimeout(
        ()=>{
            tone(
                750,
                .08,
                .18,
                "sine"
            );
        },
        80
    );

    setTimeout(
        ()=>{
            tone(
                1000,
                .12,
                .16,
                "sine"
            );
        },
        160
    );
}


/* =========================================================
   MUSIC
========================================================= */

function musicTick(){

    if(
        !soundEnabled ||
        !running ||
        paused ||
        !audio
    ){
        return;
    }

    const notes = [
        196,
        247,
        294,
        247,
        220,
        277,
        330,
        277
    ];

    const volume =
        .035 *
        (Number(musicRange.value) / 100);

    const osc =
        audio.createOscillator();

    const gain =
        audio.createGain();

    osc.type = "sine";

    osc.frequency.value =
        notes[musicIndex];

    gain.gain.setValueAtTime(
        volume,
        audio.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
        .001,
        audio.currentTime + .22
    );

    osc.connect(gain);

    gain.connect(
        audio.destination
    );

    osc.start();

    osc.stop(
        audio.currentTime + .23
    );

    musicIndex =
        (musicIndex + 1) %
        notes.length;
}


function startMusic(){

    if(musicTimer){
        return;
    }

    musicTimer =
        setInterval(
            musicTick,
            330
        );
}


function stopMusic(){

    if(musicTimer){

        clearInterval(
            musicTimer
        );

        musicTimer = null;
    }
}


/* =========================================================
   SNAKE
========================================================= */

function createSnake(){

    const c =
        Math.floor(
            GRID / 2
        );

    snake = [

        {x:c,y:c},

        {
            x:c-1,
            y:c
        },

        {
            x:c-2,
            y:c
        }

    ];
}


/* =========================================================
   FOOD
========================================================= */

function spawnFood(){

    do{

        food.x =
            Math.floor(
                Math.random() *
                GRID
            );

        food.y =
            Math.floor(
                Math.random() *
                GRID
            );

    }while(
        snake.some(
            s =>
                s.x === food.x &&
                s.y === food.y
        )
    );
}


/* =========================================================
   POWER UP
========================================================= */

function spawnPower(){

    if(!powerEnabled){
        return;
    }

    const types = [
        "speed",
        "shield",
        "double"
    ];

    powerUp = {

        x:
            Math.floor(
                Math.random() *
                GRID
            ),

        y:
            Math.floor(
                Math.random() *
                GRID
            ),

        type:
            types[
                Math.floor(
                    Math.random() *
                    types.length
                )
            ],

        life:7000
    };

    powerTimer = 0;
}


function powerEmoji(type){

    if(type === "speed"){
        return "⚡";
    }

    if(type === "shield"){
        return "🛡️";
    }

    return "⭐";
}


/* =========================================================
   START GAME
========================================================= */

function startGame(){

    initAudio();

    snakeColor =
        colorSelect.value;

    eyeStyle =
        eyesSelect.value;

    foodType =
        foodSelect.value;

    background =
        bgSelect.value;

    gameMode =
        modeSelect.value;

    powerEnabled =
        powerSelect.value === "on";


    createSnake();

    spawnFood();

    powerUp = null;

    powerTimer = 0;

    direction = {
        x:1,
        y:0
    };

    nextDirection = {
        x:1,
        y:0
    };

    score = 0;

    combo = 0;

    comboTimer = 0;


    /*
       ONLY CLASSIC + SPEED
       No Survival Mode
    */

    speed =
        gameMode === "speed"
        ? 75
        : 110;


    particles = [];

    tongueActive = false;

    tongueTimer = 0;

    tongueNext = 5000;

    tongueProgress = 0;


    running = true;

    paused = false;


    scoreEl.textContent = "0";

    bestEl.textContent = best;

    pauseBtn.textContent = "❚❚";

    finalScore.style.display =
        "none";


    title.textContent =
        "🐍 Snake";

    title.className = "";


    message.textContent =
        "Swipe anywhere on the board to move.";


    startBtn.textContent =
        "RESTART";


    overlay.classList.add(
        "hidden"
    );


    startMusic();


    lastTime =
        performance.now();

    requestAnimationFrame(loop);
}


/* =========================================================
   GAME OVER
========================================================= */

function endGame(){

    running = false;

    stopMusic();


    if(score > best){

        best = score;

        localStorage.setItem(
            "snakeUltimateBest",
            best
        );
    }


    bestEl.textContent = best;


    finalScore.textContent =
        score;

    finalScore.style.display =
        "block";


    title.textContent =
        "💥 GAME OVER";

    title.className =
        "gameOver";


    message.textContent =
        "The snake bit its own body!";


    startBtn.textContent =
        "PLAY AGAIN";


    overlay.classList.remove(
        "hidden"
    );


    tone(
        160,
        .18,
        .25
    );

    setTimeout(
        ()=>{
            tone(
                80,
                .28,
                .22
            );
        },
        120
    );


    if(navigator.vibrate){

        navigator.vibrate(
            [60,40,100]
        );
    }
}


/* =========================================================
   DIRECTION
========================================================= */

function changeDirection(x,y){

    if(
        x === -direction.x &&
        y === -direction.y
    ){
        return;
    }

    nextDirection = {
        x,
        y
    };
}


/* =========================================================
   UPDATE
========================================================= */

function update(){

    direction =
        nextDirection;


    const head = {

        x:
            snake[0].x +
            direction.x,

        y:
            snake[0].y +
            direction.y

    };


    /* WRAP */

    if(head.x < 0){
        head.x = GRID - 1;
    }

    if(head.x >= GRID){
        head.x = 0;
    }

    if(head.y < 0){
        head.y = GRID - 1;
    }

    if(head.y >= GRID){
        head.y = 0;
    }


    const eating =
        head.x === food.x &&
        head.y === food.y;


    const powerEating =
        powerUp &&
        head.x === powerUp.x &&
        head.y === powerUp.y;


    const body =
        eating
        ? snake
        : snake.slice(0,-1);


    if(
        body.some(
            s =>
                s.x === head.x &&
                s.y === head.y
        )
    ){

        endGame();

        return;
    }


    snake.unshift(head);


    if(eating){

        score++;

        combo++;

        comboTimer = 0;


        let points = 1;


        if(combo >= 2){
            points = combo;
        }


        score += points - 1;


        scoreEl.textContent =
            score;


        speed =
            Math.max(
                gameMode === "speed"
                ? 42
                : 55,

                speed - 1.5
            );


        biteSound();

        createFoodParticles();

        showCombo();

        spawnFood();


        if(
            powerEnabled &&
            !powerUp &&
            Math.random() < .18
        ){

            spawnPower();
        }

    }else{

        snake.pop();
    }


    if(powerEating){

        activatePower(
            powerUp.type
        );

        powerUp = null;

        powerTimer = 0;
    }
}


/* =========================================================
   POWER EFFECT
========================================================= */

function activatePower(type){

    powerSound();


    if(type === "speed"){

        speed =
            Math.max(
                35,
                speed - 25
            );

    }else if(type === "shield"){

        for(
            let i = 0;
            i < 20;
            i++
        ){
            createPowerParticles();
        }

    }else if(type === "double"){

        score += 5;

        scoreEl.textContent =
            score;
    }
}


/* =========================================================
   COMBO
========================================================= */

function showCombo(){

    if(combo < 2){
        return;
    }


    comboEl.textContent =
        `🔥 COMBO x${combo}`;


    comboEl.classList.remove(
        "show"
    );


    void comboEl.offsetWidth;


    comboEl.classList.add(
        "show"
    );
}


/* =========================================================
   TONGUE
========================================================= */

function updateTongue(delta){

    tongueTimer += delta;


    if(
        !tongueActive &&
        tongueTimer >= tongueNext
    ){

        tongueActive = true;

        tongueProgress = 0;

        tongueTimer = 0;


        tongueNext =
            5000 +
            Math.random() * 1300;


        hiss();


        if(navigator.vibrate){
            navigator.vibrate(15);
        }
    }


    if(tongueActive){

        tongueProgress += delta;


        if(tongueProgress >= 700){

            tongueActive = false;
        }
    }
}


/* =========================================================
   LOOP
========================================================= */

function loop(time){

    if(
        !running ||
        paused
    ){
        return;
    }


    const delta =
        time - lastTime;


    lastTime = time;


    accumulator += delta;


    while(
        accumulator >= speed
    ){

        update();

        accumulator -= speed;


        if(!running){
            return;
        }
    }


    updateTongue(delta);

    updateEffects(delta);

    updateParticles();

    draw(time);


    requestAnimationFrame(loop);
}


/* =========================================================
   EFFECTS
========================================================= */

function updateEffects(delta){

    comboTimer += delta;


    if(
        comboTimer >
        comboLimit
    ){
        combo = 0;
    }


    if(powerUp){

        powerTimer += delta;

        powerUp.life -= delta;


        if(powerUp.life <= 0){

            powerUp = null;
        }
    }
}


/* =========================================================
   DRAW
========================================================= */

function draw(time){

    const w =
        canvas.clientWidth;

    const h =
        canvas.clientHeight;


    drawBackground(
        w,
        h,
        time
    );

    drawGrid(
        w,
        h
    );

    drawPower(time);

    drawFood(time);

    drawSnake(time);

    drawParticles();
}


/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground(
    w,
    h,
    time
){

    let c1 = "#101a28";

    let c2 = "#04070d";


    if(background === "blue"){

        c1 = "#10304e";
        c2 = "#040913";
    }


    if(background === "forest"){

        c1 = "#103124";
        c2 = "#030a07";
    }


    if(background === "purple"){

        c1 = "#2c1941";
        c2 = "#08040e";
    }


    if(background === "space"){

        c1 = "#151d40";
        c2 = "#02030a";
    }


    const g =
        ctx.createRadialGradient(
            w/2,
            h*.35,
            10,
            w/2,
            h/2,
            w
        );


    g.addColorStop(
        0,
        c1
    );

    g.addColorStop(
        1,
        c2
    );


    ctx.fillStyle = g;

    ctx.fillRect(
        0,
        0,
        w,
        h
    );


    if(background === "space"){

        ctx.fillStyle =
            "rgba(255,255,255,.5)";


        for(
            let i = 0;
            i < 45;
            i++
        ){

            const x =
                (i * 83) % w;

            const y =
                (i * 137) % h;


            const r =
                1 +
                Math.sin(
                    time*.002+i
                )*.5;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                r,
                0,
                Math.PI*2
            );

            ctx.fill();
        }
    }
}


/* =========================================================
   GRID
========================================================= */

function drawGrid(w,h){

    ctx.strokeStyle =
        "rgba(130,160,190,.09)";

    ctx.lineWidth = 1;

    ctx.beginPath();


    for(
        let i = 1;
        i < GRID;
        i++
    ){

        const p =
            i * cell;


        ctx.moveTo(
            p,
            0
        );

        ctx.lineTo(
            p,
            h
        );


        ctx.moveTo(
            0,
            p
        );

        ctx.lineTo(
            w,
            p
        );
    }


    ctx.stroke();
}


/* =========================================================
   FOOD
========================================================= */

function drawFood(time){

    const cx =
        food.x * cell +
        cell / 2;

    const cy =
        food.y * cell +
        cell / 2;


    const pulse =
        1 +
        Math.sin(
            time*.007
        )*.09;


    ctx.save();


    ctx.shadowBlur = 20;

    ctx.shadowColor =
        "#ff405d";


    ctx.font =
        `${cell*.68*pulse}px Arial`;


    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    let emoji = "🍎";


    if(foodType === "rabbit"){
        emoji = "🐇";
    }

    if(foodType === "insect"){
        emoji = "🪲";
    }


    ctx.fillText(
        emoji,
        cx,
        cy
    );


    ctx.restore();
}


/* =========================================================
   POWER DRAW
========================================================= */

function drawPower(time){

    if(!powerUp){
        return;
    }


    const cx =
        powerUp.x * cell +
        cell / 2;

    const cy =
        powerUp.y * cell +
        cell / 2;


    const pulse =
        1 +
        Math.sin(
            time*.01
        )*.15;


    ctx.save();


    ctx.font =
        `${cell*.72*pulse}px Arial`;


    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.shadowBlur = 25;

    ctx.shadowColor =
        "#ffe14a";


    ctx.fillText(
        powerEmoji(
            powerUp.type
        ),
        cx,
        cy
    );


    ctx.restore();
}


/* =========================================================
   SNAKE
========================================================= */

function drawSnake(time){

    const base =
        SKINS[snakeColor] ||
        SKINS.green;


    snake.forEach(
        (s,index)=>{

            const scale =
                index === 0
                ? .91
                : .84;


            const size =
                cell * scale;


            const offset =
                (cell-size)/2;


            const x =
                s.x*cell +
                offset;


            const y =
                s.y*cell +
                offset;


            let color;


            if(
                snakeColor ===
                "rainbow"
            ){

                color =
                    `hsl(${
                        (time*.08+
                        index*12)%360
                    },80%,55%)`;

            }else{

                if(index === 0){

                    color =
                        base.head;

                }else{

                    const ratio =
                        index /
                        snake.length;


                    color =
                        ratio > .65
                        ? base.dark
                        : base.body;
                }
            }


            ctx.globalAlpha = .28;

            ctx.fillStyle = "#000";


            roundedRect(
                x,
                y+3,
                size,
                size,
                size*.25
            );


            ctx.fill();


            ctx.globalAlpha = 1;

            ctx.fillStyle = color;


            roundedRect(
                x,
                y,
                size,
                size,
                size*.25
            );


            ctx.fill();


            if(index === 0){

                ctx.globalAlpha = .2;

                ctx.fillStyle = "#fff";


                roundedRect(
                    x+size*.16,
                    y+size*.12,
                    size*.42,
                    size*.18,
                    5
                );


                ctx.fill();


                ctx.globalAlpha = 1;


                drawEyes(
                    s.x,
                    s.y,
                    size
                );


                drawMouthAndTongue(
                    s.x,
                    s.y,
                    size
                );
            }
        }
    );


    ctx.globalAlpha = 1;
}


/* =========================================================
   ROUNDED RECT
========================================================= */

function roundedRect(
    x,
    y,
    w,
    h,
    r
){

    ctx.beginPath();

    ctx.roundRect(
        x,
        y,
        w,
        h,
        r
    );
}


/* =========================================================
   EYES
========================================================= */

function drawEyes(
    gx,
    gy,
    size
){

    const blink =
        Math.sin(
            performance.now()*.003
        ) > .985;


    if(blink){
        return;
    }


    const cx =
        gx*cell +
        cell/2;


    const cy =
        gy*cell +
        cell/2;


    let r =
        size*.075;


    if(
        eyeStyle === "big"
    ){

        r =
            size*.105;
    }


    const fx =
        direction.x *
        size*.18;


    const fy =
        direction.y *
        size*.18;


    const sx =
        direction.y *
        size*.15;


    const sy =
        -direction.x *
        size*.15;


    const e1 = {

        x:
            cx+fx+sx,

        y:
            cy+fy+sy
    };


    const e2 = {

        x:
            cx+fx-sx,

        y:
            cy+fy-sy
    };


    ctx.fillStyle =
        "#fff";


    ctx.beginPath();


    ctx.arc(
        e1.x,
        e1.y,
        r*1.65,
        0,
        Math.PI*2
    );


    ctx.arc(
        e2.x,
        e2.y,
        r*1.65,
        0,
        Math.PI*2
    );


    ctx.fill();


    if(
        eyeStyle === "sleepy"
    ){

        ctx.strokeStyle =
            "#111827";

        ctx.lineWidth = 2;


        ctx.beginPath();


        ctx.moveTo(
            e1.x-r,
            e1.y
        );

        ctx.lineTo(
            e1.x+r,
            e1.y
        );


        ctx.moveTo(
            e2.x-r,
            e2.y
        );

        ctx.lineTo(
            e2.x+r,
            e2.y
        );


        ctx.stroke();


        return;
    }


    ctx.fillStyle =
        eyeStyle === "neon"
        ? "cyan"
        : "#071019";


    ctx.beginPath();


    ctx.arc(
        e1.x,
        e1.y,
        r,
        0,
        Math.PI*2
    );


    ctx.arc(
        e2.x,
        e2.y,
        r,
        0,
        Math.PI*2
    );


    ctx.fill();
}


/* =========================================================
   MOUTH + TONGUE
========================================================= */

function drawMouthAndTongue(
    gx,
    gy,
    size
){

    const cx =
        gx*cell +
        cell/2;


    const cy =
        gy*cell +
        cell/2;


    const frontX =
        direction.x *
        size*.38;


    const frontY =
        direction.y *
        size*.38;


    const mx =
        cx+frontX;


    const my =
        cy+frontY;


    ctx.strokeStyle =
        "#300812";


    ctx.lineWidth =
        Math.max(
            2,
            size*.055
        );


    ctx.lineCap =
        "round";


    ctx.beginPath();


    ctx.moveTo(
        mx-direction.y*size*.10,
        my+direction.x*size*.10
    );


    ctx.quadraticCurveTo(
        mx+direction.x*size*.10,
        my+direction.y*size*.10,
        mx+direction.y*size*.10,
        my-direction.x*size*.10
    );


    ctx.stroke();


    if(!tongueActive){
        return;
    }


    let progress =
        tongueProgress /
        700;


    if(progress < .5){

        progress =
            progress/.5;

    }else{

        progress =
            (1-progress)/.5;
    }


    progress =
        Math.max(
            0,
            Math.min(
                1,
                progress
            )
        );


    const length =
        size*.62*
        progress;


    const ex =
        mx+
        direction.x*
        length;


    const ey =
        my+
        direction.y*
        length;


    const fork =
        size*.13;


    ctx.strokeStyle =
        "#ff426d";


    ctx.lineWidth =
        Math.max(
            2,
            size*.045
        );


    ctx.beginPath();


    ctx.moveTo(
        mx,
        my
    );


    ctx.lineTo(
        ex,
        ey
    );


    ctx.stroke();


    if(progress > .65){

        ctx.beginPath();


        ctx.moveTo(
            ex,
            ey
        );


        ctx.lineTo(
            ex -
            direction.x*fork +
            direction.y*fork,

            ey -
            direction.y*fork -
            direction.x*fork
        );


        ctx.moveTo(
            ex,
            ey
        );


        ctx.lineTo(
            ex -
            direction.x*fork -
            direction.y*fork,

            ey -
            direction.y*fork +
            direction.x*fork
        );


        ctx.stroke();
    }
}


/* =========================================================
   PARTICLES
========================================================= */

function createFoodParticles(){

    const cx =
        food.x*cell +
        cell/2;


    const cy =
        food.y*cell +
        cell/2;


    for(
        let i=0;
        i<20;
        i++
    ){

        particles.push({

            x:cx,

            y:cy,

            vx:
                (Math.random()-.5)*
                cell*.25,

            vy:
                (Math.random()-.5)*
                cell*.25,

            life:1,

            size:
                Math.random()*3+1,

            type:"food"
        });
    }
}


function createPowerParticles(){

    const x =
        snake[0].x*cell +
        cell/2;


    const y =
        snake[0].y*cell +
        cell/2;


    particles.push({

        x,

        y,

        vx:
            (Math.random()-.5)*
            cell*.25,

        vy:
            (Math.random()-.5)*
            cell*.25,

        life:1,

        size:
            Math.random()*4+1,

        type:"power"
    });
}


function updateParticles(){

    for(
        let i=particles.length-1;
        i>=0;
        i--
    ){

        const p =
            particles[i];


        p.x += p.vx;

        p.y += p.vy;


        p.vx *= .98;

        p.vy *= .98;


        p.life -= .045;


        if(p.life <= 0){

            particles.splice(
                i,
                1
            );
        }
    }
}


function drawParticles(){

    particles.forEach(
        p=>{

            ctx.globalAlpha =
                p.life;


            ctx.fillStyle =
                p.type === "power"
                ? "gold"
                : "#ff5470";


            ctx.beginPath();


            ctx.arc(
                p.x,
                p.y,
                p.size,
                0,
                Math.PI*2
            );


            ctx.fill();
        }
    );


    ctx.globalAlpha = 1;
}


/* =========================================================
   PAUSE
========================================================= */

function togglePause(){

    if(!running){
        return;
    }


    paused = !paused;


    pauseBtn.textContent =
        paused
        ? "▶"
        : "❚❚";


    if(!paused){

        lastTime =
            performance.now();


        requestAnimationFrame(
            loop
        );
    }
}


pauseBtn.addEventListener(
    "click",
    ()=>{
        initAudio();
        togglePause();
    }
);


/* =========================================================
   FULLSCREEN
========================================================= */

fullscreenBtn.addEventListener(
    "click",
    async()=>{

        try{

            if(
                !document.fullscreenElement
            ){

                await
                document.documentElement
                .requestFullscreen();

            }else{

                await
                document.exitFullscreen();
            }

        }catch(e){}
    }
);


/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener(
    "keydown",
    e=>{

        const key =
            e.key.toLowerCase();


        if([
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            "w",
            "a",
            "s",
            "d",
            " "
        ].includes(key)){

            e.preventDefault();
        }


        if(
            key === "arrowup" ||
            key === "w"
        ){

            changeDirection(
                0,
                -1
            );

        }else if(
            key === "arrowdown" ||
            key === "s"
        ){

            changeDirection(
                0,
                1
            );

        }else if(
            key === "arrowleft" ||
            key === "a"
        ){

            changeDirection(
                -1,
                0
            );

        }else if(
            key === "arrowright" ||
            key === "d"
        ){

            changeDirection(
                1,
                0
            );

        }else if(
            key === " "
        ){

            togglePause();

        }else if(
            key === "enter" &&
            !running
        ){

            startGame();
        }
    }
);


/* =========================================================
   MOBILE SWIPE
========================================================= */

let touchStartX = 0;

let touchStartY = 0;


canvas.addEventListener(
    "touchstart",
    e=>{

        const t =
            e.changedTouches[0];


        touchStartX =
            t.clientX;


        touchStartY =
            t.clientY;

    },
    {
        passive:true
    }
);


canvas.addEventListener(
    "touchend",
    e=>{

        const t =
            e.changedTouches[0];


        const dx =
            t.clientX -
            touchStartX;


        const dy =
            t.clientY -
            touchStartY;


        if(
            Math.abs(dx)<18 &&
            Math.abs(dy)<18
        ){
            return;
        }


        if(
            Math.abs(dx) >
            Math.abs(dy)
        ){

            if(dx>0){

                changeDirection(
                    1,
                    0
                );

            }else{

                changeDirection(
                    -1,
                    0
                );
            }

        }else{

            if(dy>0){

                changeDirection(
                    0,
                    1
                );

            }else{

                changeDirection(
                    0,
                    -1
                );
            }
        }

    },
    {
        passive:true
    }
);


/* =========================================================
   SOUND
========================================================= */

soundBtn.addEventListener(
    "click",
    ()=>{

        soundEnabled =
            !soundEnabled;


        if(soundEnabled){

            initAudio();

            soundBtn.textContent =
                "🔊 Sound On";

            startMusic();

            tone(
                600,
                .08,
                .2
            );

        }else{

            soundBtn.textContent =
                "🔇 Sound Off";

            stopMusic();
        }
    }
);


/* =========================================================
   VOLUME
========================================================= */

sfxRange.addEventListener(
    "input",
    ()=>{

        sfxValue.textContent =
            sfxRange.value +
            "%";
    }
);


musicRange.addEventListener(
    "input",
    ()=>{

        musicValue.textContent =
            musicRange.value +
            "%";
    }
);


/* =========================================================
   START
========================================================= */

startBtn.addEventListener(
    "click",
    startGame
);


/* =========================================================
   INITIALIZE
========================================================= */

resize();

createSnake();

spawnFood();

bestEl.textContent =
    best;

draw(0);
