const PAGE_SIZE = 10;
let currentPage = 1;
let pokemons = [];
let filters = JSON.parse(localStorage.getItem('filters')) || [];

const checkboxes = document.querySelectorAll('input[type=checkbox]');

const updatePaginationDiv = (currentPage, numPages) => {
  $('#pagination').empty();

  const startPage = Math.max(currentPage - 2, 1);
  const endPage = Math.min(currentPage + 2, numPages);

  $('#pagination').append(`
    <button class="btn btn-secondary page ml-1" id="firstBtn">First</button>
    <button class="btn btn-success page ml-1" id="prevBtn">Previous</button>
  `);

  for (let i = startPage; i <= endPage; i++) {
    $('#pagination').append(`
      <button class="btn btn-primary page ml-1 numberedButtons" value="${i}">${i}</button>
    `);
  }

  $('#pagination').append(`
    <button class="btn btn-success page ml-1" id="nextBtn">Next</button>
    <button class="btn btn-secondary page ml-1" id="lastBtn">Last</button>
  `);
};

const paginate = async (currentPage, PAGE_SIZE, pokemons) => {
  const selected_pokemons = pokemons.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  $('#pokeCards').empty();

  for (const pokemon of selected_pokemons) {
    const res = await axios.get(pokemon.url);

    $('#pokeCards').append(`
      <div class="pokeCard card" pokeName="${res.data.name}">
        <h3>${res.data.name.toUpperCase()}</h3>
        <img src="${res.data.sprites.front_default}" alt="${res.data.name}"/>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
          More
        </button>
      </div>
    `);
  }
};

const filterButtons = async () => {
 

  const type = await axios.get('https://pokeapi.co/api/v2/type');

  for (let i = 0; i < type.data.results.length; i++) {
    $('#filters').append(`
      <input type="checkbox" value="${type.data.results[i].name}" ${filters.includes(type.data.results[i].name) ? 'checked' : ''} onclick="filterByType('${type.data.results[i].name}')">
      <label> ${type.data.results[i].name}</label>
    `);
  }
};

const filterByType = async (type) => {
  
  if (filters.includes(type)) {
    // if the type is already in the filters array, remove it
    filters = filters.filter((filter) => filter !== type);
  } else {
    // if the type is not in the filters array, add it
    filters.push(type);
  }

  localStorage.setItem('filters', JSON.stringify(filters)); // store filters in local storage

  let filteredPokemon = pokemons;

  // Filter by all selected types
  for (const filter of filters) {
    const res = await axios.get(`https://pokeapi.co/api/v2/type/${filter}`);
    const filterPokemon = res.data.pokemon.map((pokemon) => pokemon    .pokemon);
    filteredPokemon = filteredPokemon.filter((pokemon) =>
      filterPokemon.some((filterPokemon) => filterPokemon.name === pokemon.name)
    );
  }

  $('#pokeCards').empty();
  $('#text-header').empty();
  $('#text-header').append(`
    <h2>Showing ${Math.min(PAGE_SIZE, filteredPokemon.length)} out of ${filteredPokemon.length} Pokemon</h2>
  `);
  paginate(currentPage, PAGE_SIZE, filteredPokemon);
  const numPages = Math.ceil(filteredPokemon.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);
};


const setup = async () => {
    $('#pokeCards').empty();
    let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
    pokemons = response.data.results;

    paginate(currentPage, PAGE_SIZE, pokemons);
    const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
    updatePaginationDiv(currentPage, numPages);
    filterButtons();

    $('body').on('click', '.pokeCard', async function (e) {
        const pokemonName = $(this).attr('pokeName');

        const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);

        const types = res.data.types.map((type) => type.type.name);
        $('.modal-body').html(`
      <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
          <h3>Abilities</h3>
          <ul>
            ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
          </ul>
        </div>

        <div>
          <h3>Stats</h3>
          <ul>
            ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
          </ul>
        </div>
      </div>
      <h3>Types</h3>
      <ul>
        ${types.map((type) => `<li>${type}</li>`).join('')}
      </ul>
    `);
        $('.modal-title').html(`
      <h2>${res.data.name.toUpperCase()}</h2>
      <h5>${res.data.id}</h5>
    `);
    });

    $('body').on('click', ".numberedButtons", async function (e) {
        currentPage = Number(e.target.value);
        paginate(currentPage, PAGE_SIZE, pokemons);
        updatePaginationDiv(currentPage, numPages);
    });

    $('body').on('click', "#prevBtn", async function (e) {
        if (currentPage > 1) {
            currentPage--;
            paginate(currentPage, PAGE_SIZE, pokemons);
            updatePaginationDiv(currentPage, numPages);
        }
    });

    $('body').on('click', "#nextBtn", async function (e) {
        if (currentPage < numPages) {
            currentPage++;
            paginate(currentPage, PAGE_SIZE, pokemons);
            updatePaginationDiv(currentPage, PAGE_SIZE);
        }
    });

    $('body').on('click', "#firstBtn", async function (e) {
        currentPage = 1;
        paginate(currentPage, PAGE_SIZE, pokemons);
        updatePaginationDiv(currentPage, numPages);
    });

    $('body').on('click', "#lastBtn", async function (e) {
        currentPage = numPages;
        paginate(currentPage, PAGE_SIZE, pokemons);
        updatePaginationDiv(currentPage, numPages);
        savePageState();
    });

    const restoreFilters = () => {
        filters.forEach((filter) => {
            $(`input[value="${filter}"]`).prop('checked', true);
        });
    };

    const restorePageState = () => {
        const storedPage = localStorage.getItem('currentPage');
        currentPage = storedPage ? parseInt(storedPage) : 1;
    };

    const savePageState = () => {
        localStorage.setItem('currentPage', currentPage);
    };

    const setup = async () => {
        restorePageState();

        $('#pokeCards').empty();
        let response = await axios.get('https://pokeapi.co/api/v2/pokemon?offset=0&limit=810');
        pokemons = response.data.results;

        restoreFilters();
        filterButtons();
        filterByType(); // Apply filters on initial setup

        const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
        updatePaginationDiv(currentPage, numPages);

        $('body').on('click', '.pokeCard', async function (e) {
            const pokemonName = $(this).attr('pokeName');

            const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);

            const types = res.data.types.map((type) => type.type.name);
            $('.modal-body').html(`
      <div style="width:200px">
        <img src="${res.data.sprites.other['official-artwork'].front_default}" alt="${res.data.name}"/>
        <div>
          <h3>Abilities</h3>
          <ul>
            ${res.data.abilities.map((ability) => `<li>${ability.ability.name}</li>`).join('')}
          </ul>
        </div>

        <div>
          <h3>Stats</h3>
          <ul>
            ${res.data.stats.map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`).join('')}
          </ul>
        </div>
      </div>
      <h3>Types</h3>
      <ul>
        ${types.map((type) => `<li>${type}</li>`).join('')}
      </ul>
    `);
            $('.modal-title').html(`
      <h2>${res.data.name.toUpperCase()}</h2>
      <h5>${res.data.id}</h5>
    `);
        });

        $('body').on('click', ".numberedButtons", async function (e) {
            currentPage = Number(e.target.value);
            paginate(currentPage, PAGE_SIZE, pokemons);
            updatePaginationDiv(currentPage, numPages);
            savePageState();
        });

        $('body').on('click', "#prevBtn", async function (e) {
            if (currentPage > 1) {
                currentPage--;
                paginate(currentPage, PAGE_SIZE, pokemons);
                updatePaginationDiv(currentPage, numPages);
                savePageState();
            }
        });

        $('body').on('click', "#nextBtn", async function (e) {
            if (currentPage < numPages) {
                currentPage++;
                paginate(currentPage, PAGE_SIZE, pokemons);
                updatePaginationDiv(currentPage, numPages);
                savePageState();
            }
        });

        $('body').on('click', "#firstBtn", async function (e) {
            currentPage = 1;
            paginate(currentPage, PAGE_SIZE, pokemons);
            updatePaginationDiv(currentPage, numPages);
            savePageState();
        });

        $('body').on('click', "#lastBtn", async function (e) {
            currentPage = numPages;
            paginate(currentPage, PAGE_SIZE, pokemons);
            updatePaginationDiv(currentPage, numPages);
            savePageState();
        });

        // Store filter state upon checkbox click
        $('body').on('change', 'input[type=checkbox]', function () {
            const selectedFilters = [];
            $('input[type=checkbox]:checked').each(function () {
                selectedFilters.push($(this).val());
            });
            filters = selectedFilters;
            filterByType();
        });

        // Clear filters button
        $('body').on('click', '#clearFiltersBtn', function () {
            $('input[type=checkbox]').prop('checked', false);
            filters = [];
            filterByType();
        });

        // Clear filters and page state on page reload
        $('body').on('click', '#refreshBtn', function () {
            localStorage.clear();
            window.location.reload();
        });
    };
};
  $(document).ready(setup);