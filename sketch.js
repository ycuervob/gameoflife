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
let providedkernel;

let aliveCubes = 0;  // Variable para rastrear la cantidad de cubos vivos

function preload() {
  // preload() runs once
  myFont = loadFont("https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf");
}

function getTableContent() {
  var table = document.getElementById("myTable");
  var rows = table.getElementsByTagName("tr");
  var tableContent = [];

  for (var i = 1; i < rows.length; i++) {
    var cells = rows[i].getElementsByTagName("td");
    var rowData = [];
    var subRowData = [];

    for (var j = 0; j < cells.length; j++) {
      var input = cells[j].getElementsByTagName("input")[0];
      subRowData.push([parseInt(input.value)]);

      if ((j + 1) % 3 === 0 || j === cells.length - 1) {
        rowData.push(subRowData);
        subRowData = [];
      }
    }

    tableContent.push(rowData);
  }
  return tableContent;
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
  providedkernel = getTableContent();
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

  mystatuselemnt.innerHTML = `<p>rameCount: ${frameRate()}</p><p>Cubes: ${aliveCubes}</p><p style="${update ? "color:green" : "color:red"}">Status: ${update ? "Running" : "Stopped"}</p>`;
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

function updatekernel() {
  document.getElementById("message").innerHTML = "Kernel updated";
  document.getElementById("message").toggleAttribute("hidden");
  setTimeout(() => {
    document.getElementById("message").toggleAttribute("hidden");
  }, 2000);
  providedkernel = getTableContent();
}

function resetKernel() {
  providedkernel = [
    [[[1], [1], [1]], [[1], [1], [1]], [[1], [1], [1]]],
    [[[1], [1], [1]], [[1], [0], [1]], [[1], [1], [1]]],
    [[[1], [1], [1]], [[1], [1], [1]], [[1], [1], [1]]]
  ];

}

function convolucionarMatriz(matrizEntrada) {
  aliveCubes = 0;  // Reinicia la variable aliveCubes
  const flattenedArray = matrizEntrada.flat().flat(); // Obtener un arreglo plano
  const typedArray = new Float32Array(flattenedArray); // Especificar el tipo de datos
  const shape = [matrizEntrada.length, matrizEntrada[0].length, matrizEntrada[0][0].length];
  const binaryMatrix = tf.tensor3d(typedArray, shape, 'float32'); // Crear tensor especificando el tipo
  const kernel = tf.tensor4d(providedkernel);
  const N = matrizEntrada.length;
  const expandedBinaryMatrix = binaryMatrix.expandDims(-1);
  const expandedKernel = kernel.expandDims(-1);
  const binaryMatrixFloat = tf.cast(expandedBinaryMatrix, 'float32');
  const kernelFloat = tf.cast(expandedKernel, 'float32');
  const convolved = tf.conv3d(binaryMatrixFloat, kernelFloat, [1, 1, 1], 'same');

  let newmatriz = convolved.arraySync();

  const matrizConvertida = newmatriz.map(row => row.map(column => column.map(
    item => {
      if ((item[0] == 4 || item[0] == 5)) {
        aliveCubes++;
        return 1;
      } else {
        return 0;
      }
    }
  )
  )
  );

  // Copiar la matriz original
  const matrizOpuesta = JSON.parse(JSON.stringify(matrizConvertida));

  // Cambiar las caras opuestas
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      // Cambiar las caras superior e inferior
      const tempSuperior = matrizOpuesta[i][j][0];
      matrizOpuesta[i][j][0] = matrizOpuesta[i][j][N - 1];
      matrizOpuesta[i][j][N - 1] = tempSuperior;

      // Cambiar las caras izquierda y derecha
      const tempIzquierda = matrizOpuesta[i][0][j];
      matrizOpuesta[i][0][j] = matrizOpuesta[i][N - 1][j];
      matrizOpuesta[i][N - 1][j] = tempIzquierda;

      // Cambiar las caras frontal y trasera
      const tempFrontal = matrizOpuesta[0][i][j];
      matrizOpuesta[0][i][j] = matrizOpuesta[N - 1][i][j];
      matrizOpuesta[N - 1][i][j] = tempFrontal;
    }
  }


  binaryMatrix.dispose();
  kernel.dispose();
  expandedBinaryMatrix.dispose();
  expandedKernel.dispose();
  binaryMatrixFloat.dispose();
  kernelFloat.dispose();
  convolved.dispose();


  return matrizOpuesta;
}

function toggleTable() {
  document.getElementById("container").classList.toggle("show");
}

function closeModal() {
  document.getElementById('mymodal').toggleAttribute('hidden')
}

function startStop() {
  update = !update;
  let butn = document.getElementById('star-stop');
  butn.innerHTML = update ? 'Stop' : 'Start';
  butn.classList.toggle('btn-danger');
}

function reset() {
  maxAliveCubes = Math.random() * 1000;
  genMatrix();
}
