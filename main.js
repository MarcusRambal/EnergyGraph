class NodoEnergia {
  constructor(nombre, produccion, perdida, sostenibilidad) {
    this.nombre = nombre;
    this.produccion = parseFloat(produccion);
    this.perdida = parseFloat(perdida);
    this.sostenibilidad = parseInt(sostenibilidad);
  }
}

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
    if (!this.adyacencia[origen].includes(destino)) {
      this.adyacencia[origen].push(destino);
    }
    if (!this.adyacencia[destino].includes(origen)) {
      this.adyacencia[destino].push(origen);
    }
  }

  cambiarEstrategia(estrategia) {
  const estrategiasValidas = ['produccion', 'sostenibilidad', 'perdida'];
  if (estrategiasValidas.includes(estrategia)) {
    this.estrategia = estrategia;
  } else {
    throw new Error('Estrategia no válida');
  }
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


  mostrarRed() {
    let texto = '';
    for (const nodo in this.adyacencia) {
      texto += `${nodo} => ${this.adyacencia[nodo].join(', ')}\n`;
    }
    return texto;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const archivoNodos = document.getElementById('nodosCSV');
  const archivoMatriz = document.getElementById('matrizCSV');
  const salida = document.getElementById('salida');
  const btn = document.getElementById('btnCargar');
  const selectEstrategia = document.getElementById('estrategia');


  btn.addEventListener('click', () => {
    if (!archivoNodos.files[0] || !archivoMatriz.files[0]) {
      salida.textContent = 'Por favor carga ambos archivos.';
      return;
    }
    const estrategiaElegida = selectEstrategia.value;
    

    const red = new RedEnergia();
    red.cambiarEstrategia(estrategiaElegida);
    Papa.parse(archivoNodos.files[0], {
      header: true,
      complete: function (result1) {
        result1.data.forEach(fila => {
          if (fila.Nombre) {
            red.agregarNodo(new NodoEnergia(
              fila.Nombre,
              fila.Produccion,
              fila.Pérdida || fila.Perdida,
              fila.Sostenibilidad
            ));
          }
        });

        Papa.parse(archivoMatriz.files[0], {
          complete: function (result2) {
            const datos = result2.data;
            const nombres = datos[0].slice(1);

            for (let i = 1; i < datos.length; i++) {
              const fila = datos[i];
              const origen = fila[0];
              for (let j = 1; j < fila.length; j++) {
                if (fila[j] === '1') {
                  const destino = nombres[j - 1];
                  red.agregarConexion(origen, destino);
                }
              }
            }

            let resultado = red.mostrarRed();
            resultado += `\n Estrategia "${estrategiaElegida}":\n`;
            salida.textContent = resultado;
          }
        });
      }
    });
  });
});


