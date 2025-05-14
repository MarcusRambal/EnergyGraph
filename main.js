let red = null; 

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

  encontrarCaminoOptimo(origen, destino) {
  const visitados = new Set();
  const distancias = {};
  const anteriores = {};
  const cola = new Set(Object.keys(this.nodos));

  for (let nodo of cola) {
    distancias[nodo] = -Infinity;
  }
  distancias[origen] = this.obtenerValorSegunEstrategia(this.nodos[origen]);

  while (cola.size > 0) {
    // Seleccionar nodo con mayor valor (porque maximizamos)
    let actual = null;
    let mejorValor = -Infinity;

    for (let nodo of cola) {
      if (distancias[nodo] > mejorValor) {
        mejorValor = distancias[nodo];
        actual = nodo;
      }
    }

    if (actual === null || actual === destino) break;
    cola.delete(actual);
    visitados.add(actual);

    for (let vecino of this.adyacencia[actual]) {
      if (visitados.has(vecino)) continue;

      const valorVecino = this.obtenerValorSegunEstrategia(this.nodos[vecino]);
      const nuevoValor = distancias[actual] + valorVecino;

      if (nuevoValor > distancias[vecino]) {
        distancias[vecino] = nuevoValor;
        anteriores[vecino] = actual;
      }
    }
  }

  // Reconstruir camino
  const camino = [];
  let nodo = destino;
  while (nodo !== undefined) {
    camino.unshift(nodo);
    nodo = anteriores[nodo];
  }

  if (camino[0] !== origen) {
    return { camino: [], valorTotal: 0 };
  }

  return { camino, valorTotal: distancias[destino] };
}

}


document.addEventListener('DOMContentLoaded', () => {
  const archivoNodos = document.getElementById('nodosCSV');
  const archivoMatriz = document.getElementById('matrizCSV');
  const salida = document.getElementById('salida');
  const btn = document.getElementById('btnCargar');
  const btnCamino = document.getElementById('btnCamino');
  const selectEstrategia = document.getElementById('estrategia');
  const selectOrigen = document.getElementById('origen');
  const selectDestino = document.getElementById('destino');
  const grafoDiv = document.getElementById('grafo');

  btn.addEventListener('click', () => {
    if (!archivoNodos.files[0] || !archivoMatriz.files[0]) {
      salida.textContent = 'Por favor carga ambos archivos.';
      return;
    }

    const estrategiaElegida = selectEstrategia.value;
    red = new RedEnergia();
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

            // Mostrar red textual
            let resultado = red.mostrarRed();
            resultado += `\nEstrategia "${estrategiaElegida}":\n`;
            salida.textContent = resultado;

            // Llenar selects de nodos
            selectOrigen.innerHTML = '';
            selectDestino.innerHTML = '';
            for (let nombre in red.nodos) {
              const option1 = document.createElement('option');
              const option2 = document.createElement('option');
              option1.value = option2.value = nombre;
              option1.textContent = option2.textContent = nombre;
              selectOrigen.appendChild(option1);
              selectDestino.appendChild(option2);
            }

            const nodes = Object.values(red.nodos).map(n => ({
            id: n.nombre,
            label: `${n.nombre}\n(${red.obtenerValorSegunEstrategia(n)})`
            }));

            const edges = [];
            for (let origen in red.adyacencia) {
              for (let destino of red.adyacencia[origen]) {
                if (origen < destino) {
                  edges.push({ from: origen, to: destino });
                }
              }
            }
            const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
            const options = { nodes: { shape: 'dot', size: 15 }, physics: true };
            new vis.Network(grafoDiv, data, options);
          }
        });
      }
    });
  });

  btnCamino.addEventListener('click', () => {
    if (!red) {
      salida.textContent = 'Primero carga la red.';
      return;
    }
    const origen = selectOrigen.value;
    const destino = selectDestino.value;
    red.cambiarEstrategia(selectEstrategia.value);

    const resultado = red.encontrarCaminoOptimo(origen, destino);
    if (resultado.camino.length === 0) {
      salida.textContent += `\nNo hay camino disponible de ${origen} a ${destino}`;
    } else {
      salida.textContent += `\nCamino óptimo de "${origen}" a "${destino}": ${resultado.camino.join(' -> ')}`;
      salida.textContent += `\nValor total según estrategia "${selectEstrategia.value}": ${resultado.valorTotal.toFixed(2)}\n`;
    }
  });
});

