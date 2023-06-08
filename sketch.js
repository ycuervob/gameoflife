let easycam;
let matrixSize = 50;
let cubeSize = 10;
let update = false;
let matrix = [];
let maxAliveCubes = 1000;  // Establece el límite máximo de cubos vivos
let myshader;
let angle, concentration;
let position;
let state;
let brush;
let record;
let myFont;
let points = [];
let mystatuselemnt;


let aliveCubes = 0;  // Variable para rastrear la cantidad de cubos vivos

function preload() {
  // preload() runs once
  myFont = loadFont("https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf");
}


function binaryNoise(probability) {
  return Math.random() < probability ? 1 : 0;
}

function genMatrix() {
  aliveCubes = 0;  // Reinicia la variable aliveCubes
  for (let x = 0; x < matrixSize; x++) {
    matrix[x] = [];
    for (let y = 0; y < matrixSize; y++) {
      matrix[x][y] = [];
      for (let z = 0; z < matrixSize; z++) {
        matrix[x][y][z] = binaryNoise(0.01); // Cambia la probabilidad aquí (0.01 = 1%)
        if (matrix[x][y][z] === 1) {
          aliveCubes++;
        }
      }
    }
  }
}

function updateMatrix() {
  //console.log(matrix);
  matrix = convolucionarMatriz(matrix);
  //console.log(matrix);
}

function paintMatrix() {
  for (let x = 0; x < matrixSize; x++) {
    for (let y = 0; y < matrixSize; y++) {
      for (let z = 0; z < matrixSize; z++) {
        if (matrix[x][y][z] === 1) {
          let posX = (x - matrixSize / 2) * cubeSize;
          let posY = (y - matrixSize / 2) * cubeSize;
          let posZ = (z - matrixSize / 2) * cubeSize;

          push();
          translate(posX, posY, posZ);
          box(cubeSize);
          fill(0, 255, 255);
          pop();
        }
      }
    }
  }
}

function setup() {
  createCanvas(window.innerWidth, window.innerHeight, WEBGL);
  textFont(myFont, 20);
  mystatuselemnt = document.getElementById("mystatus");
  easycam = createEasyCam({ distance: 1 });
  genMatrix();
}

function draw() {
  background(0);
  ambientLight(150);

  // compute current camera position in world space:
  const position = treeLocation([0, 0, 0], { from: Tree.EYE, to: Tree.WORLD });

  //directionalLight(255, 255, 255, 0, 1, 1); // Establecer la dirección de la luz hacia arriba

  if (update) {
    updateMatrix();
  }

  paintMatrix();
  
  mystatuselemnt.innerHTML = `<p>rameCount: ${frameRate()}</p><p>Cubes: ${aliveCubes}</p>`;
  //text("Frame rate: "+frameRate(), 0, -300);
}

function keyPressed() {
  if (keyCode === 32) {
    maxAliveCubes = Math.random() * 1000;
    genMatrix();
  } else if (keyCode === 67) {
    update = !update;
  }
}

function convolucionarMatriz(matrizEntrada) {
  aliveCubes = 0;  // Reinicia la variable aliveCubes
  const flattenedArray = matrizEntrada.flat().flat(); // Obtener un arreglo plano
  const typedArray = new Float32Array(flattenedArray); // Especificar el tipo de datos
  const shape = [matrizEntrada.length, matrizEntrada[0].length, matrizEntrada[0][0].length];
  const binaryMatrix = tf.tensor3d(typedArray, shape, 'float32'); // Crear tensor especificando el tipo

  const kernel = tf.tensor4d([
    [[[1], [1], [1]], [[1], [1], [1]], [[1], [1], [1]]],
    [[[1], [1], [1]], [[1], [0], [1]], [[1], [1], [1]]],
    [[[1], [1], [1]], [[1], [1], [1]], [[1], [1], [1]]]
  ]);

  const expandedBinaryMatrix = binaryMatrix.expandDims(-1);
  const expandedKernel = kernel.expandDims(-1);
  const binaryMatrixFloat = tf.cast(expandedBinaryMatrix, 'float32');
  const kernelFloat = tf.cast(expandedKernel, 'float32');

  const convolved = tf.conv3d(binaryMatrixFloat, kernelFloat, [1, 1, 1], 'same');

  let newmatriz = convolved.arraySync();

  const matrizConvertida = newmatriz.map(row =>
    row.map(column =>
      column.map(item =>{
        if (item[0] == 4 || item[0] == 5) {
          aliveCubes++;
          return 1;
        }else{
          return 0;
        }
      }
      )
    )
  );

  tf.disposeVariables();

  return matrizConvertida;
}
