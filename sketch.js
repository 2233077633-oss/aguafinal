let litrosChamarra  = 10000;
let litrosPlayera   = 2700;
let litrosPantalon  = 7000;
let litrosRopaInt   = 2000;
let litrosZapatos   = 4000;
let litrosGorra = 800;
let litrosAccesorios = 50;
let litrosLentes = 500;
let litrosMochila = 10000;
let litrosCinturon = 2200;

// ---- cuántas veces se presionó cada botón ----
let vecesC = 0;   // chamarra
let vecesP = 0;   // playera
let vecesPa = 0;  // pantalon
let vecesR = 0;   // ropa interior
let vecesZ = 0;   // zapatos
let vecesG = 0;   // gorra
let vecesA = 0;
let vecesL = 0;
let vecesM = 0;
let vecesCi = 0;
// ---- para animar la ola ----
let ola = 0;

let botonReiniciar = { x: 0, y: 0, w: 220, h: 50 };

// ---- glitch ----
let timerGlitch = 0;

// ---- SONIDO ----
let sonidoClick;
let distorsion;
let totalActual = 0; // guardamos el total para poder usarlo en mousePressed

let sonidoAmbiente;
let filtroAmbiente;
let ambienteIniciado = false; // el ambiente solo arranca tras el primer click (política de autoplay)

let sonidoAviso;
let distorsionAviso;
let ultimoIndiceAdvertencia = -1; // para saber cuándo aparece una advertencia NUEVA

let sonidoGlitch;
let distorsionGlitch;

// ---- advertencias por umbral de litros ----
let advertencias = [
  { umbral: 30000, texto: "Estas dejando sin agua a muchas personas de bajos recursos", color: [86,7,12] },
  { umbral: 40000, texto: "¿De verdad necesitas esa playera nueva o solo quieres seguir secando rios?", color: [86, 7, 12] },
  { umbral: 50000, texto: "Bonita blusa, lastima que le costó su vida a un río", color: [86, 7, 12] },
  { umbral: 55000, texto: "Fabricar tu outfit costó más agua de lo que una familia necesita en un mes", color: [86, 7, 12] }
];
let posicionesAdvertencias = [];
let baseAdvertenciasY = 220;
let separacionAdvertencias = 36;

// ---- imágenes ----
let img1, img2, img3, img4, img5, img6, img7, img8, img9, img10;

function preload() {
  img1 = loadImage("/assets/chamarra.png");
  img2 = loadImage("/assets/playera.png");
  img3 = loadImage("/assets/pantalon.png");
  img4 = loadImage("/assets/calcetines.png");
  img5 = loadImage("/assets/zapatos.png");
  img6 =  loadImage("/assets/gorra.png");
  img7 =  loadImage("/assets/accesorios.png");
  img8 =  loadImage("/assets/lentes.png");
  img9 =  loadImage("/assets/mochila.png");
  img10 =  loadImage("/assets/cinturon.png");

  // ---- SONIDO ----
  sonidoClick = loadSound("/assets/click.mp3");
  sonidoAmbiente = loadSound("/assets/ambiente.mp3");
  sonidoAviso = loadSound("/assets/aviso.mp3");
  sonidoGlitch = loadSound("/assets/glitch.mp3");
}

function setup() {
  createCanvas(windowWidth,windowHeight);
  textFont("Georgia");
  asignarPosicionesAdvertencias();

  // ---- preparar efecto de distorsión para el click ----
  distorsion = new p5.Distortion();
  sonidoClick.disconnect();
  sonidoClick.connect(distorsion);

  // ---- preparar filtro para el ambiente (se va "ahogando") ----
  filtroAmbiente = new p5.LowPass();
  sonidoAmbiente.disconnect();
  sonidoAmbiente.connect(filtroAmbiente);
  sonidoAmbiente.setVolume(0);
  sonidoAmbiente.loop();

  // ---- preparar distorsión para el sonido de advertencias ----
  distorsionAviso = new p5.Distortion();
  sonidoAviso.disconnect();
  sonidoAviso.connect(distorsionAviso);

  // ---- preparar distorsión para el sonido de glitch ----
  distorsionGlitch = new p5.Distortion();
  sonidoGlitch.disconnect();
  sonidoGlitch.connect(distorsionGlitch);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  asignarPosicionesAdvertencias();
}

function draw() {

  // 1. SUMAR litros según cuántas veces presionaron cada botón
  let total = 0;
  total = total + (vecesC  * litrosChamarra);
  total = total + (vecesP  * litrosPlayera);
  total = total + (vecesPa * litrosPantalon);
  total = total + (vecesR  * litrosRopaInt);
  total = total + (vecesZ  * litrosZapatos);
  total = total + (vecesG  * litrosGorra);
  total = total + (vecesA  * litrosAccesorios);
  total = total + (vecesL  * litrosLentes);
  total = total + (vecesM  * litrosMochila);
  total = total + (vecesCi * litrosCinturon);

  totalActual = total; // para poder usarlo fuera de draw(), en mousePressed

  // 2. CALCULAR qué tan "sucio" está el mundo (0 = limpio, 1 = apocalipsis)
  //    usamos min() para que no pase de 1 aunque sigan haciendo clic
  let suciedad = min(total / 60000, 1);
  let sucio    = min(total / 10000, 1);

  // 3. COLORES que cambian con la suciedad
  //    lerpColor mezcla dos colores según un valor de 0 a 1
  let colorFondo  = lerpColor(color(245,235,210), color(65,42,24),  suciedad);
  let colorAgua   = lerpColor(color(160,205,220), color(125,92,58),  suciedad);
  let colorTexto  = lerpColor(color(0,100,255),    color(255,165,0), suciedad);

  // 4. FONDO
  background(colorFondo);

  // ---- SONIDO AMBIENTE: se va oscureciendo/ahogando con la suciedad ----
  if (ambienteIniciado) {
    let frecuenciaFiltro = map(suciedad, 0, 1, 9000, 250); // se va "ahogando"
    filtroAmbiente.freq(frecuenciaFiltro);
    let volumenAmbiente = map(suciedad, 0, 1, 0.04, 0.35);
    sonidoAmbiente.setVolume(volumenAmbiente, 0.1); // suavizado
  }

  // 5. AGUA que baja (empieza llena arriba y va bajando)
  //    nivel 1 = lleno (superficie arriba), nivel 0 = vacío (superficie abajo)
  let nivel = 1 - suciedad;
  dibujarAgua(nivel, colorAgua);

  // 6. TÍTULO — cambia de tierno a tétrico
  noStroke();
  fill(colorTexto);
  textSize(70);
  textAlign(CENTER);
  text("s/agua", width/2, 70);

  textSize(25);
  text("¿Cuántas prendas traes el día de hoy?", width/2, 130);

  // 7. CONTADOR de litros
  fill(0, 0, 0, 120);
  rect(width/2 - 170, 150, 340, 75, 12);
  fill(colorTexto);
  textSize(42);
  text(total + " litros", width/2, 192);

  mostrarAdvertencias(total);

  // 8. BOTONES
  dibujarBoton(140, 490, img1, "Chamarra",   vecesC,  litrosChamarra, suciedad);
  dibujarBoton(330, 490, img2, "Playera",    vecesP,  litrosPlayera,  suciedad);
  dibujarBoton(520, 490, img3, "Pantalón",   vecesPa, litrosPantalon, suciedad);
  dibujarBoton(710, 490, img4, "Ropa int.",  vecesR,  litrosRopaInt,  suciedad);
  dibujarBoton(900, 490, img5, "Zapatos",    vecesZ,  litrosZapatos,  suciedad);
  dibujarBoton(1090, 490, img6, "Gorra",     vecesG,  litrosGorra,  suciedad);
  dibujarBoton(1280, 490, img7, "Accesorios", vecesA,  litrosAccesorios,  suciedad);
  dibujarBoton(1470, 490, img8, "Lentes",     vecesL,  litrosLentes,  suciedad);
  dibujarBoton(1660, 490, img9, "Mochila",    vecesM,  litrosMochila,  suciedad);
  dibujarBoton(1850, 490, img10, "Cinturón",   vecesCi, litrosCinturon, suciedad);

  botonReiniciar.x = width/2 - botonReiniciar.w/2;
  botonReiniciar.y = height - 85;
  dibujarBotonReinicio(botonReiniciar.x, botonReiniciar.y, botonReiniciar.w, botonReiniciar.h);

  // 9. GLITCH si la suciedad es alta
  if (suciedad > 0.6) {
    aplicarGlitch(suciedad);
    timerGlitch = timerGlitch + 1;
  } else {
    timerGlitch = 0;
  }

  ola = ola + 0.02; // mueve la ola cada frame
}

function dibujarAgua(nivel, colorAgua) {

  // yAgua = donde está la superficie del agua
  // nivel 1 → superficie arriba (y=0), nivel 0 → superficie abajo (y=height)
  let yAgua = height - (height * nivel);

  // rectángulo del agua: desde la superficie hasta el fondo
  noStroke();
  fill(red(colorAgua), green(colorAgua), blue(colorAgua), 160);
  rect(0, yAgua, width, height - yAgua);

  // ola encima: curva de seno animada
  fill(red(colorAgua), green(colorAgua), blue(colorAgua), 120);
  beginShape();
  vertex(0, height);
  for (let x = 0; x <= width; x = x + 10) {
    let y = yAgua + sin(x * 0.02 + ola) * 10;
    vertex(x, y);
  }
  vertex(width, height);
  endShape(CLOSE);
}

function asignarPosicionesAdvertencias() {
  posicionesAdvertencias = [];
  let ancho = width * 0.7;
  let x = width / 2;
  let y = 230;

  for (let i = 0; i < advertencias.length; i++) {
    posicionesAdvertencias.push({ x, y: y + i * separacionAdvertencias });
  }
}

function mostrarAdvertencias(total) {
  let intensidadGlitch = constrain(total / 50000, 0, 1);
  let indiceActivo = -1;

  for (let i = advertencias.length - 1; i >= 0; i--) {
    if (total >= advertencias[i].umbral) {
      indiceActivo = i;
      break;
    }
  }

  if (indiceActivo < 0) return;

  // ---- sonido: se dispara SOLO la primera vez que aparece esta advertencia ----
  if (indiceActivo !== ultimoIndiceAdvertencia) {
    reproducirSonidoAviso(indiceActivo);
    ultimoIndiceAdvertencia = indiceActivo;
  }

  let aviso = advertencias[indiceActivo];
  let progreso = constrain((total - aviso.umbral) / 20000, 0, 1);
  let alpha = 70 + progreso * 130;
  let tam = 30 + progreso * 8;
  let pos = posicionesAdvertencias[indiceActivo] || { x: width / 2, y: baseAdvertenciasY + indiceActivo * separacionAdvertencias };
  let x = pos.x;
  let y = pos.y + sin(frameCount * 0.015 + indiceActivo) * 1.5;

  // reducir la magnitud del temblor para que las frases no tiemblen tanto
  let shakeScale = 0.45;
  let shakeX = (timerGlitch % 3 === 0 ? random(-4, 4) : random(-1.5, 1.5)) * intensidadGlitch * shakeScale;
  let shakeY = (timerGlitch % 5 === 0 ? random(-3, 3) : random(-1, 1)) * intensidadGlitch * shakeScale;
  let giro = random(-0.02, 0.02) * intensidadGlitch * 0.6;
  let escala = 1 + (random(-0.02, 0.02)) * intensidadGlitch * 0.6;

  push();
  translate(x + shakeX, y + shakeY);
  rotate(giro);
  scale(escala);

  fill(aviso.color[0], aviso.color[1], aviso.color[2], alpha);
  textSize(tam);
  textAlign(CENTER);
  text(aviso.texto, 0, 0);

  if (intensidadGlitch > 0.35 && random() < 0.35) {
    fill(aviso.color[0] + 30, aviso.color[1] + 20, aviso.color[2] + 10, alpha * 0.45);
    textSize(tam * 0.98);
    text(aviso.texto, random(-2, 2), random(-1, 1));
  }
  pop();
}

function dibujarBoton(x, y, img, nombre, veces, litros, suciedad) {
  let tam = 150;

  // color del botón cambia según la suciedad general
  // lerpColor mezcla tonos cálidos y secos → polvo y arcilla
  let colorBtn = lerpColor(color(230,218,190), color(95,62,36), suciedad);

  // borde más grueso si fue presionado al menos una vez
  if (veces > 0) {
    stroke(210, 140, 70);
    strokeWeight(3);
  } else {
    stroke(145, 110, 80);
    strokeWeight(1);
  }

  fill(colorBtn);
  rect(x, y, tam, tam, 14);

  // imagen de la prenda
  noStroke();
  image(img, x + 25, y + 12, 100, 90);

  // nombre de la prenda
  fill(70, 48, 28);
  textSize(14);
  textAlign(CENTER);
  text(nombre, x + tam/2, y + tam + 20);

  // litros de esa prenda
  fill(120, 90, 55);
  textSize(12);
  text(litros + " L c/u", x + tam/2, y + tam + 36);

  // contador de cuántas veces se presionó (x1, x2, x3...)
  if (veces > 0) {
    fill(175, 95, 45);
    textSize(16);
    text("x" + veces, x + tam/2, y + tam + 55);
  }
}
function dibujarBotonReinicio(x, y, w, h) {
  noStroke();
  fill(0, 127, 255);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(30);
  textFont("Georgia");
  text("reintentar", x + w/2, y + h/2);
}

function reiniciarProgreso() {
  vecesC = 0;
  vecesP = 0;
  vecesPa = 0;
  vecesR = 0;
  vecesZ = 0;
  vecesG = 0;
  vecesA = 0;
  vecesL = 0;
  vecesM = 0;
  vecesCi = 0;
  ola = 0;
  timerGlitch = 0;
  ultimoIndiceAdvertencia = -1;
  asignarPosicionesAdvertencias();

  // ---- SONIDO: detener y resetear todo al reintentar ----
  sonidoClick.stop();
  sonidoAviso.stop();
  sonidoGlitch.stop();

  // el ambiente no lo detenemos (sigue en loop), pero lo regresamos a su estado limpio
  sonidoAmbiente.setVolume(0, 0.2); // baja suave, en 0.2 segundos
  filtroAmbiente.freq(9000);        // regresa a sonar "abierto"/limpio
}

// ---- SONIDO: reproduce el click degradándose según la suciedad ----
function reproducirSonidoSucio(suciedad) {
  // entre más sucio, más grave y lento suena (más tétrico)
  let velocidad = map(suciedad, 0, 1, 1, 0.35);
  sonidoClick.rate(velocidad);

  // entre más sucio, más distorsión (sonido "roto")
  let cantidadDistorsion = map(suciedad, 0, 1, 0, 0.8);
  distorsion.set(cantidadDistorsion, "2x");

  // también baja el volumen a veces para que suene más "sucio"/inestable
  sonidoClick.setVolume(map(suciedad, 0, 1, 0.9, 0.5));

  sonidoClick.play();
}

// ---- SONIDO: se dispara al aparecer cada advertencia, cada vez más tétrico ----
function reproducirSonidoAviso(indice) {
  // indice va de 0 (primera advertencia, menos grave) a advertencias.length-1 (la peor)
  let progresoGeneral = indice / (advertencias.length - 1); // 0 a 1

  // entre más avanzada la advertencia, más grave y lento suena
  let velocidad = map(progresoGeneral, 0, 1, 0.9, 0.4);
  sonidoAviso.rate(velocidad);

  // entre más avanzada, más distorsión (suena más "roto")
  let cantidadDistorsion = map(progresoGeneral, 0, 1, 0.1, 0.9);
  distorsionAviso.set(cantidadDistorsion, "2x");

  sonidoAviso.setVolume(map(progresoGeneral, 0, 1, 0.5, 0.85));
  sonidoAviso.play();
}

function mousePressed() {
  // el ambiente arranca en la primera interacción del usuario (autoplay policy)
  if (!ambienteIniciado) {
    userStartAudio(); // desbloquea el audio en el navegador
    ambienteIniciado = true;
  }

  if (mouseX >= botonReiniciar.x && mouseX <= botonReiniciar.x + botonReiniciar.w &&
      mouseY >= botonReiniciar.y && mouseY <= botonReiniciar.y + botonReiniciar.h) {
    reiniciarProgreso();
    return;
  }

  let sePresiono = false;

  // cada botón tiene su zona: x, y, hasta x+150, y+150
  if (mouseX >= 140  && mouseX <= 290  && mouseY >= 490 && mouseY <= 640) { vecesC  = vecesC  + 1; sePresiono = true; }
  if (mouseX >= 330  && mouseX <= 480  && mouseY >= 490 && mouseY <= 640) { vecesP  = vecesP  + 1; sePresiono = true; }
  if (mouseX >= 520  && mouseX <= 670  && mouseY >= 490 && mouseY <= 640) { vecesPa = vecesPa + 1; sePresiono = true; }
  if (mouseX >= 710  && mouseX <= 860  && mouseY >= 490 && mouseY <= 640) { vecesR  = vecesR  + 1; sePresiono = true; }
  if (mouseX >= 900  && mouseX <= 1050 && mouseY >= 490 && mouseY <= 640) { vecesZ  = vecesZ  + 1; sePresiono = true; }
  if (mouseX >= 1090 && mouseX <= 1240 && mouseY >= 490 && mouseY <= 640) { vecesG  = vecesG  + 1; sePresiono = true; }
  if (mouseX >= 1280 && mouseX <= 1430 && mouseY >= 490 && mouseY <= 640) { vecesA  = vecesA  + 1; sePresiono = true; }
  if (mouseX >= 1470 && mouseX <= 1620 && mouseY >= 490 && mouseY <= 640) { vecesL  = vecesL  + 1; sePresiono = true; }
  if (mouseX >= 1660 && mouseX <= 1810 && mouseY >= 490 && mouseY <= 640) { vecesM  = vecesM  + 1; sePresiono = true; }
  if (mouseX >= 1850 && mouseX <= 2000 && mouseY >= 490 && mouseY <= 640) { vecesCi = vecesCi + 1; sePresiono = true; }

  if (sePresiono) {
    let suciedadActual = min(totalActual / 60000, 1);
    reproducirSonidoSucio(suciedadActual);
  }
}

function aplicarGlitch(suciedad) {

  // más suciedad = más glitch
  // floor(map(suciedad, 0.6, 1, 2, 12)) calcula cuántas franjas hacer
  let numFranjas = floor(map(suciedad, 0.6, 1, 2, 12));

  // franjas desplazadas (slice glitch)
  for (let i = 0; i < numFranjas; i++) {
    let fy = random(height);
    let fh = random(4, 25);
    let dx = random(-30, 30);
    copy(0, fy, width, fh, dx, fy, width, fh);
  }

  // líneas de color cada ciertos frames
  if (timerGlitch % 5 === 0) {
    for (let i = 0; i < 4; i++) {
      fill(random(180, 240), random(120, 170), random(70, 120), 180);
      noStroke();
      rect(0, random(height), width, random(1, 5));
    }
  }

  // ---- SONIDO: se dispara de vez en cuando mientras el glitch está activo ----
  // entre más suciedad, más seguido suena (cada menos frames)
  let frecuenciaSonido = floor(map(suciedad, 0.6, 1, 40, 10));
  if (timerGlitch % frecuenciaSonido === 0) {
    let velocidad = map(suciedad, 0.6, 1, 0.8, 0.3);
    sonidoGlitch.rate(velocidad);

    let cantidadDistorsion = map(suciedad, 0.6, 1, 0.2, 0.9);
    distorsionGlitch.set(cantidadDistorsion, "2x");

    sonidoGlitch.setVolume(map(suciedad, 0.6, 1, 0.3, 0.7));
    sonidoGlitch.play();
  }

  // texto que parpadea cuando es muy intenso
  if (suciedad > 0.85 && timerGlitch % 8 < 4) {
    fill(87,7,12);
    textSize(random(40, 70));
    textAlign(CENTER);
    text("El AGUA SE ESTA ACABANDO", width/2 + random(-10,10), random(300, 600));
  }

  
}