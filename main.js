const fs = require('fs');
const Papa = require('papaparse');

// Clase NodoEnergia
class NodoEnergia {
  constructor(nombre, produccion, perdida, sostenibilidad) {
    this.nombre = nombre;
    this.produccion = parseFloat(produccion);
    this.perdida = parseFloat(perdida);
    this.sostenibilidad = parseInt(sostenibilidad);
  }
}

// Clase RedEnergia
class RedEnergia {
  constructor() {
    this.nodos = {};
    this.adyacencia = {};
    this.estrategia = 'sostenibilidad';
  }

  agregarNodo(nodo) {
    this.nodos[nodo.nombre] = nodo;
    this.adyacencia[nodo.nombre] = [];
  }

  agregarConexion(origen, destino) {
    if (this.adyacencia[origen] && !this.adyacencia[origen].includes(destino)) {
      this.adyacencia[origen].push(destino);
    }
    if (this.adyacencia[destino] && !this.adyacencia[destino].includes(origen)) {
      this.adyacencia[destino].push(origen);
    }
  }

  cambiarEstrategia(nueva) {
    this.estrategia = nueva;
  }

  obtenerValorSegunEstrategia(nodo) {
    const { produccion, perdida, sostenibilidad } = nodo;
    switch (this.estrategia) {
      case 'produccion': return produccion;
      case 'sostenibilidad': return sostenibilidad;
      case 'perdida': return -perdida;
      default: return 0;
    }
  }

  mejorVecino(nodoNombre) {
    const vecinos = this.adyacencia[nodoNombre];
    if (!vecinos || vecinos.length === 0) return null;

    return vecinos.reduce((mejor, actual) => {
      const valorActual = this.obtenerValorSegunEstrategia(this.nodos[actual]);
      const valorMejor = this.obtenerValorSegunEstrategia(this.nodos[mejor]);
      return valorActual > valorMejor ? actual : mejor;
    });
  }

  mostrarRed() {
    for (const nodo in this.adyacencia) {
      console.log(`${nodo} => ${this.adyacencia[nodo].join(', ')}`);
    }
  }
}

// Cargar nodos desde nodos.csv
function cargarNodosDesdeCSV(rutaCSV, red) {
  const contenido = fs.readFileSync(rutaCSV, 'utf8');
  const resultado = Papa.parse(contenido, { header: true, skipEmptyLines: true });
  const filas = resultado.data;

  filas.forEach(fila => {
    const nodo = new NodoEnergia(fila.Nombre, fila.Produccion, fila.Pérdida || fila.Perdida, fila.Sostenibilidad);
    red.agregarNodo(nodo);
  });
}

// Cargar matriz de adyacencia desde matriz.csv
function cargarMatrizAdyacenciaDesdeCSV(rutaCSV, red) {
  const contenido = fs.readFileSync(rutaCSV, 'utf8');
  const resultado = Papa.parse(contenido, { header: false, skipEmptyLines: true });
  const datos = resultado.data;

  const nombresNodos = datos[0].slice(1); // Encabezados de columna

  for (let i = 1; i < datos.length; i++) {
    const fila = datos[i];
    const origen = fila[0];

    for (let j = 1; j < fila.length; j++) {
      if (fila[j] === '1') {
        const destino = nombresNodos[j - 1];
        red.agregarConexion(origen, destino);
      }
    }
  }
}

//Crear instancia de RedEnergia y cargar datos
const red = new RedEnergia();
cargarNodosDesdeCSV('nodos.csv', red);
cargarMatrizAdyacenciaDesdeCSV('matriz.csv', red);

// Probar estrategias
const origen = "PlantaHidraulica1";

["produccion", "perdida", "sostenibilidad"].forEach(estrategia => {
  red.cambiarEstrategia(estrategia);
  const mejor = red.mejorVecino(origen);
  console.log(`Mejor vecino desde "${origen}" con estrategia "${estrategia}" es: ${mejor}`);
});
