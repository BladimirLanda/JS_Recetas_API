//BUSCADOR DE RECETAS
//Enlace API: https://www.themealdb.com/

//Selección HTML
const selectCategorias = document.querySelector('#categorias');
const resultadoRecetas = document.querySelector('#resultado');

//--Favoritos
const selectFavoritos = document.querySelector('.favoritos');

//Intancias Bootstrap: new bootstrap.Object(Referencia, Parametros);
const modal = new bootstrap.Modal('#modal', {});
const toast = new bootstrap.Toast('#toast', {});

//Eventos
document.addEventListener('DOMContentLoaded', () => {
    iniciarApp();
});

//--//
cargarEventos();

function cargarEventos() {
    if(selectCategorias) {
        selectCategorias.addEventListener('change', e => seleccionarCategoria(e));
    }
}

//Funciones
function iniciarApp() {
    if(selectCategorias) {
        obtenerCategorias();
    }

    //--Favoritos
    if(selectFavoritos) {
        obtenerFavoritos();
    }
}

//--//
function obtenerCategorias() {
    const url = 'https://www.themealdb.com/api/json/v1/1/categories.php';

    fetch(url)
        .then(respuesta => respuesta.json())
        .then(datos => establecerCategorias(datos.categories))
        .catch(error => console.log(error))
}

//--//
function establecerCategorias(categorias) {
    categorias.forEach(categoria => {
        const { strCategory } = categoria;

        const option = document.createElement('option');
        option.textContent = strCategory;
        option.value = strCategory;
        
        selectCategorias.appendChild(option);
    });
}

//--//
function seleccionarCategoria(e) {
    const categoria = e.target.value;
    const url = `https://www.themealdb.com/api/json/v1/1/filter.php?c=${categoria}`;

    fetch(url)
        .then(respuesta => respuesta.json())
        .then(datos => establecerRecetas(datos.meals))
        .catch(error => console.log(error));
}

//--//
function establecerRecetas(recetas) {
    limpiarHTML(resultadoRecetas);

    const heading = document.createElement('h2');
    heading.classList.add('text-center', 'text-black', 'my-5');
    heading.textContent = recetas.length ? 'Recetas' : 'No Hay Resultados';

    resultadoRecetas.appendChild(heading);

    recetas.forEach(receta => {
        const { idMeal, strMeal, strMealThumb } = receta;

        const recestaContenedor = document.createElement('div');
        recestaContenedor.classList.add('col-md-4', 'mb-3'); //Bootstrap clases

        const recetaCard = document.createElement('div');
        recetaCard.classList.add('card', 'h-100');

        const recetaImg = document.createElement('img');
        recetaImg.classList.add('card-img-top');
        //JavaScript permite utilizar el simbolo (??) para realizar asignaciones en caso de resultados NUll.
        recetaImg.id = idMeal ?? receta.id; //--*Favoritos
        recetaImg.alt = `Imagen ${strMeal ?? receta.titulo}`; 
        recetaImg.src = strMealThumb ?? receta.img;

        const recetaBody = document.createElement('div');
        recetaBody.classList.add('card-body');

        const recetaHeading = document.createElement('h3');
        recetaHeading.classList.add('card-title', 'mb-3');
        recetaHeading.textContent = strMeal ?? receta.titulo;

        const recetaBtn = document.createElement('button');
        recetaBtn.classList.add('btn', 'btn-danger', 'w-100');
        recetaBtn.textContent = 'Ver Receta';
        recetaBtn.onclick = () => seleccionReceta(idMeal ?? receta.id);

        recetaBody.appendChild(recetaHeading);
        recetaBody.appendChild(recetaBtn);

        recetaCard.appendChild(recetaImg);
        recetaCard.appendChild(recetaBody);

        recestaContenedor.appendChild(recetaCard);

        resultadoRecetas.appendChild(recestaContenedor);
    });
}

//--//
function seleccionReceta(id) {
    const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`;

    fetch(url)
        .then(respuesta => respuesta.json())
        .then(datos => establecerInformacion(datos.meals[0]))
        .catch(error => console.log(error));
        
}

//--//
function establecerInformacion(receta) {
    const modalTitle = document.querySelector('.modal .modal-title');
    const modalBody = document.querySelector('.modal .modal-body');
    const modalFooter = document.querySelector('.modal .modal-footer');

    const {idMeal, strMeal, strInstructions, strMealThumb, strYoutube} = receta;
    limpiarHTML(modalFooter); //////////////////

    modalTitle.textContent = strMeal;
    modalBody.innerHTML = `
        <img class="img-fluid" src="${strMealThumb}" alt="Imagen ${strMeal}">
        <h3 class="my-3">Instructions</h3>
        <a href="${strYoutube}" target="_blank">Ver Vídeo</a>
        <p>${strInstructions}</p>
        <h4 class="my-3">Ingredients</h4>
    `;

    const listIngredientes = document.createElement('ul');
    listIngredientes.classList.add('list-group');

    for(let i = 1; i <= 20; i++) {
        if(receta[`strIngredient${i}`]) {
            const ingrediente = receta[`strIngredient${i}`];
            const cantidad = receta[`strMeasure${i}`];

            const ingredienteItem = document.createElement('li');
            ingredienteItem.classList.add('list-group-item');
            ingredienteItem.textContent = `${ingrediente} ~ Measure: ${cantidad}`;

            listIngredientes.appendChild(ingredienteItem);
        }
    }

    modalBody.appendChild(listIngredientes);

    const btnFavorito = document.createElement('button');
    btnFavorito.classList.add('cambio-text', 'btn', 'btn-danger', 'col');
    btnFavorito.textContent = validacionLS(idMeal) ? "Eliminar Favorito" : "Guardar favorito";
    btnFavorito.onclick = () => agregarFavorito( {id: idMeal, titulo: strMeal, img: strMealThumb} );

    const btnCerrar = document.createElement('button');
    btnCerrar.classList.add('btn', 'btn-secondary', 'col');
    btnCerrar.textContent = "Cerrar";
    btnCerrar.onclick = () => modal.hide(); //Método de plegado

    modalFooter.appendChild(btnFavorito);
    modalFooter.appendChild(btnCerrar);

    modal.show(); //Método de despliegue del modal
}

//--//
function agregarFavorito(recetaGuardada) {
    const {id, titulo} = recetaGuardada;

    if(validacionLS(id)) { 
        eliminarFavorito(id);

        document.querySelector('.cambio-text').textContent = "Guardar Favorito";

        mostrarToast(`Eliminado correctamente: ${titulo.slice(0, 15)}...`);
        return;
    }

    const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
    localStorage.setItem('favoritos', JSON.stringify( [...favoritos, recetaGuardada] ));

    document.querySelector('.cambio-text').textContent = "Eliminar Favorito";

    mostrarToast(`Agregado correctamente: ${titulo.slice(0, 15)}...`);
}

//--//
function eliminarFavorito(id) {
    const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];

    const resultado = favoritos.filter(favorito => favorito.id !== id);
    localStorage.setItem('favoritos', JSON.stringify( [...resultado] ));

    if(selectFavoritos) {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];
        establecerRecetas(favoritos);
    }
}

//--//
function validacionLS(id) {
    const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];

    const resultado = favoritos.some(favorito => favorito.id === id);
    return resultado;
}

//--//
function mostrarToast(mensaje) {
    const toastBody = document.querySelector('.toast-body');
    toastBody.textContent = mensaje;

    toast.show();
}

//--//
//--Favoritos
function obtenerFavoritos() {
    const favoritos = JSON.parse(localStorage.getItem('favoritos')) ?? [];

    if(favoritos.length) {
        establecerRecetas(favoritos);
        return;
    }

    const sinFavoritos = document.createElement('p');
    sinFavoritos.classList.add('fs-4', 'text-center', 'font-bold', 'mt-5');
    sinFavoritos.textContent = 'Agrega tu primer favorito...';
    selectFavoritos.appendChild(sinFavoritos);
}

//--//
function limpiarHTML(element) {
    while(element.firstChild) {
        element.removeChild(element.firstChild);
    }
}
