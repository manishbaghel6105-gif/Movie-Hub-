/* =========================================================
   MOVIE HUB
   OMDb API
========================================================= */


/* =========================================================
   API
========================================================= */

const OMDB_API_KEY = "84385aad";

const OMDB_URL = "https://www.omdbapi.com/";


/* =========================================================
   STATE
========================================================= */

const state = {

    currentPage: "home",

    searchQuery: "",
    searchPage: 1,

    moviesPage: 1,
    trendingPage: 1,
    popularPage: 1,
    upcomingPage: 1,

    allMovies: [],

    trendingMovies: [],

    popularMovies: [],

    upcomingMovies: [],

    watchlist:
        JSON.parse(
            localStorage.getItem(
                "movieHubWatchlist"
            ) || "[]"
        ),

    currentMovie: null

};


/* =========================================================
   OMDb REQUEST
========================================================= */

async function fetchOMDb(params = {}) {

    const urlParams =
        new URLSearchParams({

            apikey: OMDB_API_KEY,

            ...params

        });


    try {

        const response =
            await fetch(
                `${OMDB_URL}?${urlParams.toString()}`
            );


        if (!response.ok) {

            throw new Error(
                "Request failed"
            );

        }


        return await response.json();

    } catch (error) {

        console.error(
            "OMDb Error:",
            error
        );


        return {

            Response: "False",

            Error:
                "Unable to connect to OMDb API."

        };

    }

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    if (!value) {
        return "";
    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   POSTER
========================================================= */

function getPoster(movie) {

    if (
        movie &&
        movie.Poster &&
        movie.Poster !== "N/A"
    ) {

        return movie.Poster;

    }


    return "";

}


/* =========================================================
   SAVE MOVIE
========================================================= */

function addToAllMovies(movie) {

    if (!movie || !movie.imdbID) {
        return;
    }


    const exists =
        state.allMovies.some(
            item =>
                item.imdbID === movie.imdbID
        );


    if (!exists) {

        state.allMovies.push(movie);

    }

}


/* =========================================================
   GET MOVIE DETAILS
========================================================= */

async function getMovie(imdbID) {

    const existing =
        state.allMovies.find(
            movie =>
                movie.imdbID === imdbID
        );


    if (
        existing &&
        existing.Plot
    ) {

        return existing;

    }


    const data =
        await fetchOMDb({

            i: imdbID,

            plot: "full"

        });


    if (
        data.Response === "True"
    ) {

        addToAllMovies(data);

        return data;

    }


    return null;

}


/* =========================================================
   SEARCH MOVIES
========================================================= */

async function searchMovies(
    query,
    page = 1
) {

    if (
        !query ||
        query.trim().length < 2
    ) {

        return [];

    }


    const data =
        await fetchOMDb({

            s:
                query.trim(),

            type:
                "movie",

            page:
                page

        });


    if (
        data.Response === "True" &&
        Array.isArray(data.Search)
    ) {

        data.Search.forEach(
            addToAllMovies
        );


        return data.Search;

    }


    return [];

}


/* =========================================================
   WATCHLIST CHECK
========================================================= */

function isInWatchlist(imdbID) {

    return state.watchlist.some(
        movie =>
            movie.imdbID === imdbID
    );

}


/* =========================================================
   SAVE WATCHLIST
========================================================= */

function saveWatchlist() {

    localStorage.setItem(

        "movieHubWatchlist",

        JSON.stringify(
            state.watchlist
        )

    );

}


/* =========================================================
   MOVIE CARD
========================================================= */

function createMovieCard(movie) {

    const poster =
        getPoster(movie);


    const rating =
        movie.imdbRating &&
        movie.imdbRating !== "N/A"

            ? movie.imdbRating

            : "N/A";


    const watched =
        isInWatchlist(
            movie.imdbID
        );


    const posterHTML =
        poster

            ? `
                <img
                    src="${poster}"
                    alt="${escapeHTML(movie.Title)}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <div
                    class="no-poster"
                    style="display:none;"
                >
                    <i class="fa-solid fa-film"></i>
                    <span>
                        Poster unavailable
                    </span>
                </div>
              `

            : `
                <div class="no-poster">
                    <i class="fa-solid fa-film"></i>

                    <span>
                        Poster unavailable
                    </span>
                </div>
              `;


    return `

        <article
            class="movie-card"
            data-id="${movie.imdbID}"
        >

            <div class="poster-wrap">

                ${posterHTML}

                <div class="poster-shade"></div>


                <button
                    type="button"
                    class="
                        watch-toggle
                        ${watched ? "active" : ""}
                    "
                    data-watch-id="${movie.imdbID}"
                    title="
                        ${
                            watched
                                ? "Remove from watchlist"
                                : "Add to watchlist"
                        }
                    "
                >

                    <i
                        class="
                            ${
                                watched
                                    ? "fa-solid"
                                    : "fa-regular"
                            }
                            fa-heart
                        "
                    ></i>

                </button>

            </div>


            <div class="movie-info">

                <div
                    class="movie-title"
                    title="${escapeHTML(movie.Title)}"
                >
                    ${escapeHTML(
                        movie.Title ||
                        "Unknown"
                    )}
                </div>


                <div class="movie-subtitle">

                    <span>
                        ${escapeHTML(
                            movie.Year || "----"
                        )}
                    </span>

                    <span>•</span>

                    <span class="movie-rating">

                        <i class="fa-solid fa-star"></i>

                        ${rating}

                    </span>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   RENDER GRID
========================================================= */

function renderGrid(
    container,
    movies
) {

    if (!container) {
        return;
    }


    if (
        !movies ||
        movies.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-icon">

                    <i
                        class="fa-solid fa-film"
                    ></i>

                </div>


                <h3>
                    No movies found
                </h3>


                <p>
                    Try another search or
                    different filters.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        movies
            .map(createMovieCard)
            .join("");


}


/* =========================================================
   CREATE UNIQUE ARRAY
========================================================= */

function uniqueMovies(movies) {

    return movies.filter(
        (movie, index, array) => {

            return (
                array.findIndex(
                    item =>
                        item.imdbID ===
                        movie.imdbID
                ) === index
            );

        }
    );

}


/* =========================================================
   LOAD TRENDING
========================================================= */

async function loadTrending(
    page = 1,
    append = false
) {

    const queries = [

        "avatar",
        "batman",
        "avengers",
        "spider",
        "mission",
        "matrix",
        "dark",
        "star"

    ];


    const query =
        queries[
            (page - 1) %
            queries.length
        ];


    const movies =
        await searchMovies(
            query,
            1
        );


    const oldMovies =
        append
            ? state.trendingMovies
            : [];


    const merged =
        uniqueMovies([
            ...oldMovies,
            ...movies
        ]);


    state.trendingMovies =
        merged.slice(0, 50);


    renderGrid(

        document.getElementById(
            "trendingGrid"
        ),

        state.trendingMovies.slice(
            0,
            8
        )

    );


    if (
        state.currentPage ===
        "trending"
    ) {

        renderGrid(

            document.getElementById(
                "trendingPageGrid"
            ),

            state.trendingMovies

        );

    }

}


/* =========================================================
   LOAD POPULAR
========================================================= */

async function loadPopular(
    page = 1,
    append = false
) {

    const queries = [

        "the",
        "man",
        "war",
        "love",
        "life",
        "world",
        "king",
        "time"

    ];


    const query =
        queries[
            (page - 1) %
            queries.length
        ];


    const movies =
        await searchMovies(
            query,
            1
        );


    const oldMovies =
        append
            ? state.popularMovies
            : [];


    state.popularMovies =
        uniqueMovies([
            ...oldMovies,
            ...movies
        ]).slice(0, 50);


    renderGrid(

        document.getElementById(
            "popularGrid"
        ),

        state.popularMovies.slice(
            0,
            8
        )

    );


    if (
        state.currentPage ===
        "popular"
    ) {

        renderGrid(

            document.getElementById(
                "popularPageGrid"
            ),

            state.popularMovies

        );

    }

}


/* =========================================================
   LOAD UPCOMING
========================================================= */

async function loadUpcoming(
    page = 1,
    append = false
) {

    const currentYear =
        new Date().getFullYear();


    const years = [

        currentYear,

        currentYear + 1,

        currentYear + 2

    ];


    const queries = [

        "new",
        "movie",
        "future",
        "man",
        "love",
        "world"

    ];


    const query =
        queries[
            (page - 1) %
            queries.length
        ];


    const year =
        years[
            (page - 1) %
            years.length
        ];


    const movies =
        await searchMovies(
            `${query} ${year}`,
            1
        );


    const oldMovies =
        append
            ? state.upcomingMovies
            : [];


    state.upcomingMovies =
        uniqueMovies([
            ...oldMovies,
            ...movies
        ]).slice(0, 50);


    renderGrid(

        document.getElementById(
            "upcomingGrid"
        ),

        state.upcomingMovies

    );

}


/* =========================================================
   HERO
========================================================= */

const heroIds = [

    "tt0816692", // Interstellar
    "tt0468569", // Dark Knight
    "tt1375666", // Inception
    "tt4154796", // Avengers Endgame
    "tt0133093"  // Matrix

];


let heroMovies = [];

let heroIndex = 0;


/* LOAD HERO DATA */

async function loadHeroMovies() {

    const results = [];


    for (
        const imdbID of heroIds
    ) {

        const movie =
            await getMovie(imdbID);


        if (movie) {

            results.push(movie);

        }

    }


    heroMovies =
        results;


    createHeroDots();


    showHeroMovie(0);

}


/* CREATE DOTS */

function createHeroDots() {

    const container =
        document.getElementById(
            "heroDots"
        );


    container.innerHTML =
        heroMovies
            .map(
                (_, index) => `

                    <span
                        class="
                            hero-dot
                            ${
                                index === 0
                                    ? "active"
                                    : ""
                            }
                        "
                        data-hero-index="${index}"
                    ></span>

                `
            )
            .join("");

}


/* SHOW HERO */

function showHeroMovie(index) {

    if (
        !heroMovies.length
    ) {

        return;

    }


    heroIndex =
        index;


    const movie =
        heroMovies[index];


    const poster =
        getPoster(movie);


    const bg =
        document.querySelector(
            ".hero-background"
        );


    if (poster) {

        bg.style.backgroundImage =
            `url("${poster}")`;

    }


    document.getElementById(
        "heroTitle"
    ).textContent =
        movie.Title ||
        "Movie";


    document.getElementById(
        "heroYear"
    ).textContent =
        movie.Year ||
        "----";


    document.getElementById(
        "heroGenre"
    ).textContent =
        movie.Genre
            ? movie.Genre.split(",")[0]
            : "Movie";


    document.getElementById(
        "heroRuntime"
    ).textContent =
        movie.Runtime &&
        movie.Runtime !== "N/A"

            ? movie.Runtime

            : "N/A";


    document.getElementById(
        "heroRating"
    ).textContent =
        movie.imdbRating &&
        movie.imdbRating !== "N/A"

            ? `${movie.imdbRating}/10`

            : "N/A";


    document.getElementById(
        "heroPlot"
    ).textContent =
        movie.Plot &&
        movie.Plot !== "N/A"

            ? movie.Plot

            : "Discover an amazing movie and explore its story.";


    updateHeroWatchButton();


    document
        .querySelectorAll(
            ".hero-dot"
        )
        .forEach(dot => {

            dot.classList.toggle(

                "active",

                Number(
                    dot.dataset.heroIndex
                ) === index

            );

        });

}


/* HERO WATCHLIST BUTTON */

function updateHeroWatchButton() {

    const button =
        document.getElementById(
            "heroWatchBtn"
        );


    const movie =
        heroMovies[heroIndex];


    if (!movie) {
        return;
    }


    const exists =
        isInWatchlist(
            movie.imdbID
        );


    button.innerHTML =
        exists

            ? `
                <i class="fa-solid fa-check"></i>
                In Watchlist
              `

            : `
                <i class="fa-solid fa-plus"></i>
                Add to Watchlist
              `;

}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(page) {

    state.currentPage =
        page;


    document
        .querySelectorAll(".page")
        .forEach(section => {

            section.classList.remove(
                "active-page"
            );

        });


    const target =
        document.getElementById(
            `${page}Page`
        );


    if (target) {

        target.classList.add(
            "active-page"
        );

    }


    document
        .querySelectorAll(
            ".nav-link, .mobile-nav a"
        )
        .forEach(link => {

            link.classList.toggle(

                "active",

                link.dataset.page ===
                page

            );

        });


    document
        .getElementById(
            "mobileNav"
        )
        .classList.remove(
            "open"
        );


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });


    /* Page specific */

    if (
        page === "movies"
    ) {

        renderMoviesPage();

    }


    if (
        page === "trending"
    ) {

        renderGrid(

            document.getElementById(
                "trendingPageGrid"
            ),

            state.trendingMovies

        );

    }


    if (
        page === "popular"
    ) {

        renderGrid(

            document.getElementById(
                "popularPageGrid"
            ),

            state.popularMovies

        );

    }


    if (
        page === "upcoming"
    ) {

        renderGrid(

            document.getElementById(
                "upcomingGrid"
            ),

            state.upcomingMovies

        );

    }


    if (
        page === "watchlist"
    ) {

        renderWatchlist();

    }

}


/* =========================================================
   MOVIES FILTER
========================================================= */

function renderMoviesPage() {

    let movies =
        [...state.allMovies];


    const genre =
        document.getElementById(
            "genreFilter"
        ).value;


    const rating =
        document.getElementById(
            "ratingFilter"
        ).value;


    const year =
        document.getElementById(
            "yearFilter"
        ).value;


    const sort =
        document.getElementById(
            "sortFilter"
        ).value;


    /* GENRE */

    if (
        genre !== "all"
    ) {

        movies =
            movies.filter(movie => {

                if (
                    !movie.Genre ||
                    movie.Genre === "N/A"
                ) {

                    return false;

                }


                return movie.Genre
                    .toLowerCase()
                    .includes(
                        genre.toLowerCase()
                    );

            });

    }


    /* RATING */

    if (
        rating !== "all"
    ) {

        const minRating =
            Number(rating);


        movies =
            movies.filter(movie => {

                const movieRating =
                    Number(
                        movie.imdbRating
                    );


                return (
                    !Number.isNaN(
                        movieRating
                    ) &&
                    movieRating >=
                    minRating
                );

            });

    }


    /* YEAR */

    if (
        year !== "all"
    ) {

        movies =
            movies.filter(movie => {

                const movieYear =
                    Number(
                        String(
                            movie.Year || ""
                        ).slice(0,4)
                    );


                if (
                    year === "2010s"
                ) {

                    return (
                        movieYear >= 2010 &&
                        movieYear <= 2019
                    );

                }


                if (
                    year === "2000s"
                ) {

                    return (
                        movieYear >= 2000 &&
                        movieYear <= 2009
                    );

                }


                if (
                    year === "1990s"
                ) {

                    return (
                        movieYear >= 1990 &&
                        movieYear <= 1999
                    );

                }


                return (
                    movieYear ===
                    Number(year)
                );

            });

    }


    /* SORT */

    if (
        sort === "rating"
    ) {

        movies.sort(

            (a, b) =>

                Number(
                    b.imdbRating || 0
                ) -

                Number(
                    a.imdbRating || 0
                )

        );

    }


    else if (
        sort === "year"
    ) {

        movies.sort(

            (a, b) =>

                Number(
                    String(
                        b.Year || ""
                    ).slice(0,4)
                ) -

                Number(
                    String(
                        a.Year || ""
                    ).slice(0,4)
                )

        );

    }


    else if (
        sort === "title"
    ) {

        movies.sort(

            (a,b) =>
                (a.Title || "")
                    .localeCompare(
                        b.Title || ""
                    )

        );

    }


    renderGrid(

        document.getElementById(
            "moviesGrid"
        ),

        movies

    );

}


/* =========================================================
   WATCHLIST
========================================================= */

function toggleWatchlist(movie) {

    if (!movie) {
        return;
    }


    const index =
        state.watchlist.findIndex(
            item =>
                item.imdbID ===
                movie.imdbID
        );


    if (
        index !== -1
    ) {

        state.watchlist.splice(
            index,
            1
        );


        showToast(
            "Removed from watchlist"
        );

    }

    else {

        state.watchlist.push(movie);


        showToast(
            "Added to watchlist"
        );

    }


    saveWatchlist();


    updateAllWatchButtons();


    updateHeroWatchButton();


    if (
        state.currentPage ===
        "watchlist"
    ) {

        renderWatchlist();

    }


    if (
        state.currentMovie &&
        state.currentMovie.imdbID ===
            movie.imdbID
    ) {

        updateModalWatchButton(
            movie
        );

    }

}


/* RENDER WATCHLIST */

function renderWatchlist() {

    renderGrid(

        document.getElementById(
            "watchlistGrid"
        ),

        state.watchlist

    );

}


/* UPDATE HEARTS */

function updateAllWatchButtons() {

    document
        .querySelectorAll(
            ".watch-toggle"
        )
        .forEach(button => {

            const id =
                button.dataset.watchId;


            const active =
                isInWatchlist(id);


            button.classList.toggle(
                "active",
                active
            );


            button.innerHTML =
                active

                    ? `
                        <i class="fa-solid fa-heart"></i>
                      `

                    : `
                        <i class="fa-regular fa-heart"></i>
                      `;

        });

}


/* =========================================================
   MOVIE MODAL
========================================================= */

async function openMovieModal(imdbID) {

    const modal =
        document.getElementById(
            "movieModal"
        );


    modal.classList.add(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "modal-open"
    );


    const movie =
        await getMovie(
            imdbID
        );


    if (!movie) {

        closeMovieModal();


        showToast(
            "Movie details unavailable"
        );


        return;

    }


    state.currentMovie =
        movie;


    fillModal(
        movie
    );

}


/* FILL MODAL */

function fillModal(movie) {

    const poster =
        getPoster(movie);


    document.getElementById(
        "modalPoster"
    ).src =
        poster;


    document.getElementById(
        "modalPoster"
    ).alt =
        movie.Title ||
        "Movie poster";


    document.getElementById(
        "modalTitle"
    ).textContent =
        movie.Title ||
        "Unknown";


    document.getElementById(
        "modalYear"
    ).textContent =
        movie.Year ||
        "----";


    document.getElementById(
        "modalRated"
    ).textContent =
        movie.Rated &&
        movie.Rated !== "N/A"

            ? movie.Rated

            : "N/A";


    document.getElementById(
        "modalRuntime"
    ).textContent =
        movie.Runtime &&
        movie.Runtime !== "N/A"

            ? movie.Runtime

            : "N/A";


    document.getElementById(
        "modalRating"
    ).textContent =
        movie.imdbRating &&
        movie.imdbRating !== "N/A"

            ? movie.imdbRating

            : "N/A";


    document.getElementById(
        "modalPlot"
    ).textContent =
        movie.Plot &&
        movie.Plot !== "N/A"

            ? movie.Plot

            : "No plot available.";


    document.getElementById(
        "modalDirector"
    ).textContent =
        movie.Director &&
        movie.Director !== "N/A"

            ? movie.Director

            : "Unknown";


    document.getElementById(
        "modalCast"
    ).textContent =
        movie.Actors &&
        movie.Actors !== "N/A"

            ? movie.Actors

            : "Unknown";


    document.getElementById(
        "modalGenre"
    ).textContent =
        movie.Genre &&
        movie.Genre !== "N/A"

            ? movie.Genre

            : "Unknown";


    document.getElementById(
        "modalLanguage"
    ).textContent =
        movie.Language &&
        movie.Language !== "N/A"

            ? movie.Language

            : "Unknown";


    updateModalWatchButton(
        movie
    );

}


/* MODAL WATCHLIST */

function updateModalWatchButton(movie) {

    const button =
        document.getElementById(
            "modalWatchlist"
        );


    const exists =
        isInWatchlist(
            movie.imdbID
        );


    button.innerHTML =
        exists

            ? `
                <i class="fa-solid fa-check"></i>
                In Watchlist
              `

            : `
                <i class="fa-solid fa-plus"></i>
                Add to Watchlist
              `;

}


/* CLOSE */

function closeMovieModal() {

    const modal =
        document.getElementById(
            "movieModal"
        );


    modal.classList.remove(
        "open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   TRAILER
========================================================= */

function openTrailer(movie) {

    if (!movie) {
        return;
    }


    const query =
        encodeURIComponent(

            `${movie.Title} ${movie.Year} official trailer`

        );


    window.open(

        `https://www.youtube.com/results?search_query=${query}`,

        "_blank"

    );

}


/* =========================================================
   SEARCH
========================================================= */

let searchTimer = null;


function startSearch(query) {

    clearTimeout(
        searchTimer
    );


    searchTimer =
        setTimeout(
            async () => {

                const value =
                    query.trim();


                if (
                    value.length < 2
                ) {

                    return;

                }


                state.searchQuery =
                    value;


                state.searchPage =
                    1;


                showPage(
                    "search"
                );


                document.getElementById(
                    "searchHeading"
                ).textContent =
                    `Search Results for "${value}"`;


                const grid =
                    document.getElementById(
                        "searchGrid"
                    );


                grid.innerHTML = `

                    <div class="empty-state">

                        <div class="empty-state-icon">

                            <i
                                class="
                                    fa-solid
                                    fa-spinner
                                    fa-spin
                                "
                            ></i>

                        </div>

                        <h3>
                            Searching...
                        </h3>

                        <p>
                            Finding movies for you.
                        </p>

                    </div>

                `;


                const movies =
                    await searchMovies(
                        value,
                        1
                    );


                renderGrid(
                    grid,
                    movies
                );


                document.getElementById(
                    "loadSearchBtn"
                ).disabled = false;


                document.getElementById(
                    "loadSearchBtn"
                ).innerHTML = `

                    <i
                        class="fa-solid fa-plus"
                    ></i>

                    Load More Results

                `;

            },
            350
        );

}


/* =========================================================
   LOAD MORE SEARCH
========================================================= */

async function loadMoreSearch() {

    if (
        !state.searchQuery
    ) {

        return;

    }


    const button =
        document.getElementById(
            "loadSearchBtn"
        );


    button.classList.add(
        "loading"
    );


    state.searchPage++;


    const more =
        await searchMovies(

            state.searchQuery,

            state.searchPage

        );


    const grid =
        document.getElementById(
            "searchGrid"
        );


    const existingCards =
        [
            ...grid.querySelectorAll(
                ".movie-card"
            )
        ];


    const currentMovies =
        existingCards

            .map(
                card =>
                    state.allMovies.find(
                        movie =>
                            movie.imdbID ===
                            card.dataset.id
                    )
            )

            .filter(Boolean);


    const merged =
        uniqueMovies([
            ...currentMovies,
            ...more
        ]);


    renderGrid(
        grid,
        merged
    );


    button.classList.remove(
        "loading"
    );


    if (
        more.length === 0
    ) {

        button.disabled =
            true;


        button.innerHTML = `

            <i
                class="fa-solid fa-check"
            ></i>

            No More Results

        `;

    }

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    document.getElementById(
        "toastMessage"
    ).textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2200
        );

}


/* =========================================================
   EVENT LISTENERS
========================================================= */


/* NAVIGATION */

document.addEventListener(
    "click",
    event => {

        const nav =
            event.target.closest(
                "[data-page]"
            );


        if (!nav) {
            return;
        }


        event.preventDefault();


        showPage(
            nav.dataset.page
        );

    }
);


/* MOVIE CARD */

document.addEventListener(
    "click",
    event => {

        const heart =
            event.target.closest(
                ".watch-toggle"
            );


        if (heart) {

            event.stopPropagation();


            const id =
                heart.dataset.watchId;


            const movie =
                state.allMovies.find(
                    item =>
                        item.imdbID === id
                ) ||
                state.watchlist.find(
                    item =>
                        item.imdbID === id
                );


            if (movie) {

                toggleWatchlist(
                    movie
                );

            }


            return;

        }


        const card =
            event.target.closest(
                ".movie-card"
            );


        if (card) {

            openMovieModal(
                card.dataset.id
            );

        }

    }
);


/* SEARCH */

document.getElementById(
    "globalSearch"
).addEventListener(
    "input",
    event => {

        const value =
            event.target.value;


        document.getElementById(
            "clearSearch"
        ).style.display =
            value
                ? "block"
                : "none";


        startSearch(
            value
        );

    }
);


/* CLEAR SEARCH */

document.getElementById(
    "clearSearch"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "globalSearch"
        ).value = "";


        document.getElementById(
            "clearSearch"
        ).style.display =
            "none";


        state.searchQuery =
            "";


        showPage(
            "home"
        );

    }
);


/* FILTERS */

document.getElementById(
    "genreFilter"
).addEventListener(
    "change",
    renderMoviesPage
);


document.getElementById(
    "ratingFilter"
).addEventListener(
    "change",
    renderMoviesPage
);


document.getElementById(
    "yearFilter"
).addEventListener(
    "change",
    renderMoviesPage
);


document.getElementById(
    "sortFilter"
).addEventListener(
    "change",
    renderMoviesPage
);


/* HERO DOTS */

document.getElementById(
    "heroDots"
).addEventListener(
    "click",
    event => {

        const dot =
            event.target.closest(
                ".hero-dot"
            );


        if (!dot) {
            return;
        }


        showHeroMovie(
            Number(
                dot.dataset.heroIndex
            )
        );

    }
);


/* HERO TRAILER */

document.getElementById(
    "heroTrailerBtn"
).addEventListener(
    "click",
    () => {

        openTrailer(
            heroMovies[
                heroIndex
            ]
        );

    }
);


/* HERO WATCHLIST */

document.getElementById(
    "heroWatchBtn"
).addEventListener(
    "click",
    () => {

        const movie =
            heroMovies[
                heroIndex
            ];


        if (movie) {

            toggleWatchlist(
                movie
            );

        }

    }
);


/* MODAL CLOSE */

document.getElementById(
    "modalClose"
).addEventListener(
    "click",
    closeMovieModal
);


document.getElementById(
    "modalBackdrop"
).addEventListener(
    "click",
    closeMovieModal
);


/* MODAL TRAILER */

document.getElementById(
    "modalTrailer"
).addEventListener(
    "click",
    () => {

        openTrailer(
            state.currentMovie
        );

    }
);


document.getElementById(
    "modalTrailer2"
).addEventListener(
    "click",
    () => {

        openTrailer(
            state.currentMovie
        );

    }
);


/* MODAL WATCHLIST */

document.getElementById(
    "modalWatchlist"
).addEventListener(
    "click",
    () => {

        if (
            state.currentMovie
        ) {

            toggleWatchlist(
                state.currentMovie
            );

        }

    }
);


/* ESC */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            const modal =
                document.getElementById(
                    "movieModal"
                );


            if (
                modal.classList.contains(
                    "open"
                )
            ) {

                closeMovieModal();

            }

        }

    }
);


/* MOBILE MENU */

document.getElementById(
    "mobileMenuBtn"
).addEventListener(
    "click",
    () => {

        document.getElementById(
            "mobileNav"
        ).classList.toggle(
            "open"
        );

    }
);


/* THEME */

document.getElementById(
    "themeBtn"
).addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light-theme"
        );


        const icon =
            document.getElementById(
                "themeBtn"
            ).querySelector(
                "i"
            );


        if (
            document.body.classList.contains(
                "light-theme"
            )
        ) {

            icon.className =
                "fa-solid fa-sun";

        }

        else {

            icon.className =
                "fa-solid fa-moon";

        }

    }
);


/* CLEAR WATCHLIST */

document.getElementById(
    "clearWatchlist"
).addEventListener(
    "click",
    () => {

        if (
            state.watchlist.length === 0
        ) {

            showToast(
                "Watchlist is already empty"
            );

            return;

        }


        const confirmed =
            confirm(
                "Remove all movies from your watchlist?"
            );


        if (!confirmed) {
            return;
        }


        state.watchlist =
            [];


        saveWatchlist();


        renderWatchlist();


        updateAllWatchButtons();


        updateHeroWatchButton();


        if (
            state.currentMovie
        ) {

            updateModalWatchButton(
                state.currentMovie
            );

        }


        showToast(
            "Watchlist cleared"
        );

    }
);


/* LOAD MORE SEARCH */

document.getElementById(
    "loadSearchBtn"
).addEventListener(
    "click",
    loadMoreSearch
);


/* =========================================================
   LOAD MORE MOVIES
========================================================= */

document.getElementById(
    "loadMoviesBtn"
).addEventListener(
    "click",
    async function () {

        this.classList.add(
            "loading"
        );


        state.moviesPage++;


        const queries = [

            "batman",
            "spider",
            "avengers",
            "matrix",
            "star",
            "war",
            "love",
            "dark",
            "mission",
            "fast",
            "superman",
            "alien"

        ];


        const query =
            queries[
                (
                    state.moviesPage - 1
                ) %
                queries.length
            ];


        await searchMovies(
            query,
            1
        );


        renderMoviesPage();


        this.classList.remove(
            "loading"
        );

    }
);


/* =========================================================
   LOAD MORE TRENDING
========================================================= */

document.getElementById(
    "loadTrendingBtn"
).addEventListener(
    "click",
    async function () {

        this.classList.add(
            "loading"
        );


        state.trendingPage++;


        await loadTrending(

            state.trendingPage,

            true

        );


        this.classList.remove(
            "loading"
        );

    }
);


/* =========================================================
   LOAD MORE POPULAR
========================================================= */

document.getElementById(
    "loadPopularBtn"
).addEventListener(
    "click",
    async function () {

        this.classList.add(
            "loading"
        );


        state.popularPage++;


        await loadPopular(

            state.popularPage,

            true

        );


        this.classList.remove(
            "loading"
        );

    }
);


/* =========================================================
   LOAD MORE UPCOMING
========================================================= */

document.getElementById(
    "loadUpcomingBtn"
).addEventListener(
    "click",
    async function () {

        this.classList.add(
            "loading"
        );


        state.upcomingPage++;


        await loadUpcoming(

            state.upcomingPage,

            true

        );


        this.classList.remove(
            "loading"
        );

    }
);


/* =========================================================
   SEARCH TAB
========================================================= */

document.querySelectorAll(
    ".search-tab"
).forEach(tab => {

    tab.addEventListener(
        "click",
        () => {

            document
                .querySelectorAll(
                    ".search-tab"
                )
                .forEach(item => {

                    item.classList.remove(
                        "active"
                    );

                });


            tab.classList.add(
                "active"
            );

        }
    );

});


/* =========================================================
   INITIAL DATA
========================================================= */

async function initializeApp() {

    /* Starter movie searches */

    const starterQueries = [

        "batman",
        "spider",
        "avengers",
        "inception",
        "matrix",
        "interstellar"

    ];


    for (
        const query of starterQueries
    ) {

        await searchMovies(
            query,
            1
        );

    }


    /* Home */

    await Promise.all([

        loadTrending(
            1,
            false
        ),

        loadPopular(
            1,
            false
        ),

        loadUpcoming(
            1,
            false
        )

    ]);


    /* Hero */

    await loadHeroMovies();


    /* Movies */

    renderMoviesPage();


    /* Watchlist */

    renderWatchlist();

}


/* =========================================================
   AUTO HERO SLIDER
========================================================= */

setInterval(
    () => {

        if (
            state.currentPage ===
            "home" &&
            heroMovies.length > 1
        ) {

            let nextIndex =
                heroIndex + 1;


            if (
                nextIndex >=
                heroMovies.length
            ) {

                nextIndex = 0;

            }


            showHeroMovie(
                nextIndex
            );

        }

    },
    7000
);


/* =========================================================
   START
========================================================= */

initializeApp();