import * as pdfjsLib from
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";


// =========================
// Elements
// =========================

const addBookBtn =
    document.getElementById("addBookBtn");

const addFirstBookBtn =
    document.getElementById("addFirstBookBtn");

const addBookModal =
    document.getElementById("addBookModal");

const closeModal =
    document.getElementById("closeModal");

const bookForm =
    document.getElementById("bookForm");

const bookTitle =
    document.getElementById("bookTitle");

const bookAuthor =
    document.getElementById("bookAuthor");

const bookFile =
    document.getElementById("bookFile");

const bookCover =
    document.getElementById("bookCover");

const booksGrid =
    document.getElementById("booksGrid");

const emptyLibrary =
    document.getElementById("emptyLibrary");

const themeBtn =
    document.getElementById("themeBtn");

const readerNotesBtn =
    document.getElementById("readerNotesBtn");

const notesContainer =
    document.getElementById("notesContainer");

const reader =
    document.getElementById("reader");

const pdfContainer =
    document.getElementById("pdfContainer");

const readerBookTitle =
    document.getElementById("readerBookTitle");

const readerBookAuthor =
    document.getElementById("readerBookAuthor");

const readerProgressText =
    document.getElementById("readerProgressText");

const backToLibrary =
    document.getElementById("backToLibrary");

const progressSlider =
    document.getElementById("progressSlider");

const decreaseProgress =
    document.getElementById("decreaseProgress");

const increaseProgress =
    document.getElementById("increaseProgress");

const continueBtn =
    document.getElementById("continueBtn");

const currentBookTitle =
    document.getElementById("currentBookTitle");

const currentChapter =
    document.getElementById("currentChapter");

const progressBar =
    document.getElementById("progressBar");

const progressText =
    document.getElementById("progressText");

const currentBookCover =
    document.getElementById("currentBookCover");
const bookSearch =
    document.getElementById("bookSearch");

const filterButtons =
    document.querySelectorAll(".filter-btn");

let currentFilter = "all";

// =========================
// State
// =========================

let db = null;

let currentBookId = null;

let currentPDF = null;

let currentPage = 1;

let totalPages = 0;

let currentFileURL = null;

let progressSaveTimer = null;

let notesPanel = null;


// =========================
// IndexedDB
// =========================

const request =
    indexedDB.open(
        "MyLibraryDB",
        1
    );


request.onupgradeneeded =
    function (event) {

        db =
            event.target.result;

        if (
            !db.objectStoreNames.contains(
                "books"
            )
        ) {

            db.createObjectStore(
                "books",
                {
                    keyPath: "id"
                }
            );

        }

    };


request.onsuccess =
    async function (event) {

        db =
            event.target.result;

        await fixOldBooks();

        renderBooks();

        updateContinueReading();

        renderAllNotes();

    };


request.onerror =
    function () {

        console.error(
            "Database error:",
            request.error
        );

    };


// =========================
// Fix Old Books
// =========================

async function fixOldBooks() {

    if (!db) return;

    const books =
        await getAllBooks();

    for (const book of books) {

        let changed = false;

        if (!Array.isArray(book.notes)) {

            book.notes = [];

            changed = true;

        }

        if (!book.currentPage) {

            book.currentPage = 1;

            changed = true;

        }

        if (typeof book.progress !== "number") {

            book.progress = 0;

            changed = true;

        }

        if (changed) {

            await updateBook(book);

        }

    }

}


// =========================
// Modal
// =========================

function openModal() {

    addBookModal.classList.add(
        "active"
    );

}


function closeBookModal() {

    addBookModal.classList.remove(
        "active"
    );

}


addBookBtn.addEventListener(
    "click",
    openModal
);

addFirstBookBtn.addEventListener(
    "click",
    openModal
);

closeModal.addEventListener(
    "click",
    closeBookModal
);


addBookModal.addEventListener(
    "click",
    function (event) {

        if (
            event.target ===
            addBookModal
        ) {

            closeBookModal();

        }

    }
);


// =========================
// Add Book
// =========================

bookForm.addEventListener(
    "submit",
    function (event) {

        event.preventDefault();

        const title =
            bookTitle.value.trim();

        const author =
            bookAuthor.value.trim();

        const file =
            bookFile.files[0];

        const cover =
            bookCover.files[0] || null;


        if (
            !title ||
            !author ||
            !file
        ) {

            return;

        }


        if (
            file.type !==
            "application/pdf"
        ) {

            alert(
                "Please choose a PDF file."
            );

            return;

        }


        const newBook = {

            id: Date.now(),

            title: title,

            author: author,

            file: file,

            cover: cover,

            progress: 0,

            currentPage: 1,

            status: "want",

            currentChapter: 1,

            notes: []

        };


        const transaction =
            db.transaction(
                ["books"],
                "readwrite"
            );


        const store =
            transaction.objectStore(
                "books"
            );


        store.add(newBook);


        transaction.oncomplete =
            function () {

                bookForm.reset();

                closeBookModal();

                renderBooks();

                updateContinueReading();

                renderAllNotes();

            };

    }
);


// =========================
// Get All Books
// =========================

function getAllBooks() {

    return new Promise(
        function (resolve, reject) {

            const transaction =
                db.transaction(
                    ["books"],
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    "books"
                );

            const request =
                store.getAll();


            request.onsuccess =
                function () {

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// =========================
// Get One Book
// =========================

function getBook(id) {

    return new Promise(
        function (resolve, reject) {

            const transaction =
                db.transaction(
                    ["books"],
                    "readonly"
                );

            const store =
                transaction.objectStore(
                    "books"
                );

            const request =
                store.get(id);


            request.onsuccess =
                function () {

                    resolve(
                        request.result
                    );

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// =========================
// Update Book
// =========================

function updateBook(book) {

    return new Promise(
        function (resolve, reject) {

            const transaction =
                db.transaction(
                    ["books"],
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    "books"
                );

            const request =
                store.put(book);


            request.onsuccess =
                function () {

                    resolve();

                };


            request.onerror =
                function () {

                    reject(
                        request.error
                    );

                };

        }
    );

}


// =========================
// Render Books
// =========================

async function renderBooks() {

    if (!db) return;

    const books = await getAllBooks();

    displayBooks(books);

}


// =========================
// Display Books
// =========================

function displayBooks(books) {

    booksGrid.innerHTML = "";

    if (!books.length) {

        emptyLibrary.style.display = "block";

        return;

    }

    emptyLibrary.style.display = "none";


    books.forEach(function (book) {

        const bookCard =
            document.createElement("div");

        bookCard.classList.add("book-card");


        const coverURL =
            book.cover
                ? URL.createObjectURL(book.cover)
                : null;


        bookCard.innerHTML = `

            <div class="book-card-cover">

                ${
                    coverURL
                        ? `
                            <img
                                src="${coverURL}"
                                alt="Book cover"
                            >
                        `
                        : ""
                }

            </div>


            <div class="book-card-info">

                <h3>
                    ${escapeHTML(book.title)}
                </h3>

                <p>
                    ${escapeHTML(book.author)}
                </p>


                <div class="book-card-progress">

                    <div class="progress-container">

                        <div
                            class="progress-bar"
                            style="width: ${book.progress || 0}%"
                        ></div>

                    </div>

                    <p>
                        ${book.progress || 0}% completed
                    </p>

                </div>


                <div class="book-actions">

                    <button
                        class="continue-btn open-book"
                        data-id="${book.id}"
                    >
                        Open Book
                    </button>

                    <button
                        class="delete-btn delete-book"
                        data-id="${book.id}"
                    >
                        Delete
                    </button>

                </div>

            </div>

        `;


        booksGrid.appendChild(bookCard);

    });

}


// =========================
// Search & Filters
// =========================

function filterAndSearchBooks() {

    const searchText =
        bookSearch.value
            .trim()
            .toLowerCase();

    getAllBooks().then(
        function (books) {

            const filteredBooks =
                books.filter(
                    function (book) {

                        // Search
                        const matchesSearch =
                            book.title
                                .toLowerCase()
                                .includes(searchText) ||
                            book.author
                                .toLowerCase()
                                .includes(searchText);


                        // Filter
                        let matchesFilter = true;


                        if (currentFilter === "reading") {

                            matchesFilter =
                                (book.progress || 0) > 0 &&
                                (book.progress || 0) < 100;

                        }


                        if (currentFilter === "finished") {

                            matchesFilter =
                                (book.progress || 0) >= 100;

                        }


                        if (currentFilter === "want") {

                            matchesFilter =
                                (book.progress || 0) === 0;

                        }


                        return (
                            matchesSearch &&
                            matchesFilter
                        );

                    }
                );


            displayBooks(
                filteredBooks
            );

        }
    );

}

// =========================
// Book Buttons
// =========================

booksGrid.addEventListener(
    "click",
    async function (event) {

        const openButton =
            event.target.closest(
                ".open-book"
            );


        const deleteButton =
            event.target.closest(
                ".delete-book"
            );


        if (openButton) {

            const id =
                Number(
                    openButton.dataset.id
                );

            await openBook(id);

        }


        if (deleteButton) {

            const id =
                Number(
                    deleteButton.dataset.id
                );


            const confirmed =
                confirm(
                    "Are you sure you want to delete this book?"
                );


            if (!confirmed) return;


            await deleteBook(id);

        }

    }
);


// =========================
// Delete Book
// =========================

function deleteBook(id) {

    return new Promise(
        function (resolve, reject) {

            const transaction =
                db.transaction(
                    ["books"],
                    "readwrite"
                );

            const store =
                transaction.objectStore(
                    "books"
                );

            const request =
                store.delete(id);


            request.onsuccess =
                async function () {

                    if (
                        currentBookId === id
                    ) {

                        closeReader();

                    }


                    await renderBooks();

                    await updateContinueReading();

                    await renderAllNotes();

                    resolve();

                };


            request.onerror =
                function () {

                    console.error(
                        "Failed to delete book."
                    );

                    reject(
                        request.error
                    );

                };

        }
    );

}


// =========================
// Open Book
// =========================

async function openBook(id) {

    const book =
        await getBook(id);


    if (!book) return;


    currentBookId =
        book.id;


    readerBookTitle.textContent =
        book.title;

    readerBookAuthor.textContent =
        book.author;


    document.querySelector("main")
        .style.display = "none";


    const footer =
        document.querySelector(
            ".footer"
        );


    if (footer) {

        footer.style.display =
            "none";

    }


    reader.style.display =
        "flex";


    if (currentFileURL) {

        URL.revokeObjectURL(
            currentFileURL
        );

    }


    currentFileURL =
        URL.createObjectURL(
            book.file
        );


    try {

        currentPDF =
            await pdfjsLib
                .getDocument(
                    currentFileURL
                )
                .promise;


        totalPages =
            currentPDF.numPages;


        currentPage =
            book.currentPage || 1;


        currentPage =
            Math.max(
                1,
                Math.min(
                    currentPage,
                    totalPages
                )
            );


        await renderAllPages(
            currentPage
        );


    } catch (error) {

        console.error(
            "PDF loading error:",
            error
        );


        alert(
            "Couldn't open this PDF."
        );

    }

}


// =========================
// Render PDF Pages
// =========================

async function renderAllPages(savedPage = 1) {

    if (!currentPDF) return;

    pdfContainer.innerHTML = "";

    for (
        let pageNumber = 1;
        pageNumber <= totalPages;
        pageNumber++
    ) {

        const page =
            await currentPDF.getPage(pageNumber);

        const viewport =
            page.getViewport({
                scale: 1.5
            });

        const canvas =
            document.createElement("canvas");

        canvas.classList.add("pdf-page");

        canvas.dataset.page =
            pageNumber;

        canvas.width =
            viewport.width;

        canvas.height =
            viewport.height;

        const context =
            canvas.getContext("2d");

        pdfContainer.appendChild(canvas);

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
    }


    // خلي الصفحة المحفوظة هي الصفحة الحالية
    currentPage =
        Math.max(
            1,
            Math.min(
                savedPage,
                totalPages
            )
        );


    const savedCanvas =
        pdfContainer.querySelector(
            `.pdf-page[data-page="${currentPage}"]`
        );


    if (savedCanvas) {

        savedCanvas.scrollIntoView({
            behavior: "auto",
            block: "start"
        });

    }


    // مهم جدًا:
    // هنا لا نستخدم getVisiblePage()
    // لأننا لسه فتحنا الكتاب
    updateReaderProgressFromPage(
        currentPage,
        false
    );
}


function updateReaderProgressFromPage(
    page,
    shouldSave = false
) {

    currentPage =
        Math.max(
            1,
            Math.min(
                Number(page),
                totalPages
            )
        );


    const progress =
        calculateProgress(currentPage);


    progressSlider.value =
        progress;


    readerProgressText.textContent =
        `${progress}%`;


    if (shouldSave) {

        saveBookProgress(
            currentPage,
            progress
        );

    }
}
// =========================
// Calculate Progress
// =========================

function calculateProgress(page) {

    if (totalPages <= 1) {

        return 100;

    }


    return Math.round(
        (
            (page - 1) /
            (totalPages - 1)
        ) * 100
    );

}


// =========================
// Find Visible Page
// =========================

function getVisiblePage() {

    const pages =
        document.querySelectorAll(".pdf-page");

    if (!pages.length) {
        return 1;
    }

    const containerRect =
        pdfContainer.getBoundingClientRect();

    const containerCenter =
        containerRect.top +
        (containerRect.height / 2);

    let closestPage = 1;
    let closestDistance = Infinity;

    pages.forEach(function (page) {

        const rect =
            page.getBoundingClientRect();

        const pageCenter =
            rect.top +
            (rect.height / 2);

        const distance =
            Math.abs(
                pageCenter -
                containerCenter
            );

        if (distance < closestDistance) {

            closestDistance = distance;

            closestPage =
                Number(page.dataset.page);

        }

    });

    return closestPage;
}

// =========================
// Update Reader Progress
// =========================

function updateReaderProgress(
    shouldSave = true
) {

    if (
        !totalPages ||
        !currentBookId
    ) {

        return;

    }


    currentPage =
        getVisiblePage();


    const progress =
        calculateProgress(
            currentPage
        );


    progressSlider.value =
        progress;


    readerProgressText.textContent =
        `${progress}%`;


    if (shouldSave) {

        saveBookProgress(
            currentPage,
            progress
        );

    }

}


// =========================
// PDF Scroll
// =========================

pdfContainer.addEventListener(
    "scroll",
    function () {

        clearTimeout(
            progressSaveTimer
        );


        progressSaveTimer =
            setTimeout(
                function () {

                    updateReaderProgress(
                        true
                    );

                },
                250
            );

    }
);


// =========================
// Save Progress
// =========================

function saveBookProgress(
    pageNumber,
    progress,
    callback
) {

    if (!currentBookId) {

        if (callback) callback();

        return;

    }


    getBook(
        currentBookId
    ).then(
        function (book) {

            if (!book) {

                if (callback) callback();

                return;

            }


            book.currentPage =
                pageNumber;

            book.progress =
                progress;


            updateBook(book)
                .then(
                    function () {

                        if (callback) {

                            callback();

                        }

                    }
                );

        }
    );

}


// =========================
// Close Reader
// =========================

function closeReader() {

    closeNotesPanel();


    reader.style.display =
        "none";


    document.querySelector("main")
        .style.display = "block";


    const footer =
        document.querySelector(
            ".footer"
        );


    if (footer) {

        footer.style.display =
            "block";

    }


    pdfContainer.innerHTML =
        "";


    currentPDF = null;

    currentBookId = null;

    currentPage = 1;

    totalPages = 0;


    if (currentFileURL) {

        URL.revokeObjectURL(
            currentFileURL
        );

        currentFileURL = null;

    }

}


// =========================
// Back To Library
// =========================

backToLibrary.addEventListener(
    "click",
    function () {

        clearTimeout(
            progressSaveTimer
        );


        if (
            currentBookId &&
            totalPages
        ) {

            const latestProgress =
                calculateProgress(
                    currentPage
                );


            saveBookProgress(
                currentPage,
                latestProgress,
                async function () {

                    closeReader();

                    await renderBooks();

                    await updateContinueReading();

                    await renderAllNotes();

                }
            );


        } else {

            closeReader();

            renderBooks();

            updateContinueReading();

            renderAllNotes();

        }

    }
);


// =========================
// Continue Reading
// =========================

async function updateContinueReading() {

    if (!db) return;


    const books =
        await getAllBooks();


    if (!books.length) {

        currentBookTitle.textContent =
            "Your Book Title";

        currentChapter.textContent =
            "Chapter 1";

        progressBar.style.width =
            "0%";

        progressText.textContent =
            "0% completed";

        continueBtn.disabled =
            true;

        if (currentBookCover) {

            currentBookCover.src =
                "images/book-placeholder.png";

        }

        return;

    }


    continueBtn.disabled =
        false;


    const readingBooks =
        books.filter(
            function (book) {

                return (
                    (book.progress || 0) > 0 &&
                    (book.progress || 0) < 100
                );

            }
        );


    let book;


    if (readingBooks.length) {

        book =
            readingBooks.reduce(
                function (best, current) {

                    return (
                        (current.progress || 0) >
                        (best.progress || 0)
                    )
                        ? current
                        : best;

                }
            );

    } else {

        book =
            books[0];

    }


    currentBookTitle.textContent =
        book.title;


    currentChapter.textContent =
        `Page ${book.currentPage || 1}`;


    progressBar.style.width =
        `${book.progress || 0}%`;


    progressText.textContent =
        `${book.progress || 0}% completed`;


    if (currentBookCover) {

        if (book.cover) {

            if (
                currentBookCover.dataset.url
            ) {

                URL.revokeObjectURL(
                    currentBookCover.dataset.url
                );

            }


            const coverURL =
                URL.createObjectURL(
                    book.cover
                );


            currentBookCover.src =
                coverURL;


            currentBookCover.dataset.url =
                coverURL;

        } else {

            currentBookCover.src =
                "images/book-placeholder.png";

        }

    }


    continueBtn.onclick =
        function () {

            openBook(
                book.id
            );

        };

}


// =========================
// Manual Progress
// =========================

function updateProgress(value) {

    value =
        Number(value);


    value =
        Math.max(
            0,
            Math.min(
                100,
                value
            )
        );


    progressSlider.value =
        value;


    readerProgressText.textContent =
        `${value}%`;


    if (!totalPages) return;


    let targetPage;


    if (totalPages <= 1) {

        targetPage = 1;

    } else {

        targetPage =
            1 +
            Math.round(
                (
                    value / 100
                ) *
                (totalPages - 1)
            );

    }


    currentPage =
        targetPage;


    const targetCanvas =
        pdfContainer.querySelector(
            `.pdf-page[data-page="${targetPage}"]`
        );


    if (targetCanvas) {

        targetCanvas.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }


    saveBookProgress(
        targetPage,
        value
    );

}


// =========================
// Slider
// =========================

progressSlider.addEventListener(
    "input",
    function () {

        updateProgress(
            this.value
        );

    }
);


// =========================
// Increase
// =========================

increaseProgress.addEventListener(
    "click",
    function () {

        let value =
            Number(
                progressSlider.value
            );


        value =
            Math.min(
                value + 5,
                100
            );


        updateProgress(value);

    }
);


// =========================
// Decrease
// =========================

decreaseProgress.addEventListener(
    "click",
    function () {

        let value =
            Number(
                progressSlider.value
            );


        value =
            Math.max(
                value - 5,
                0
            );


        updateProgress(value);

    }
);


// ==================================================
// NOTES SYSTEM
// ==================================================


// =========================
// Create Notes Panel
// =========================

function createNotesPanel() {

    if (notesPanel) return;


    notesPanel =
        document.createElement("div");


    notesPanel.className =
        "notes-panel";


    notesPanel.innerHTML = `

        <div class="notes-panel-header">

            <h3>📝 Book Notes</h3>

            <button
                class="close-notes"
                id="closeNotes"
            >
                ×
            </button>

        </div>


        <textarea
            id="readerNoteInput"
            class="reader-note-input"
            placeholder="Write your note here..."
        ></textarea>


        <button
            id="saveReaderNote"
            class="save-note-btn"
        >
            Save Note
        </button>


        <div
            id="readerNotesList"
            class="reader-notes-list"
        ></div>

    `;


    reader.appendChild(
        notesPanel
    );


    document
        .getElementById("closeNotes")
        .addEventListener(
            "click",
            closeNotesPanel
        );


    document
        .getElementById("saveReaderNote")
        .addEventListener(
            "click",
            saveReaderNote
        );

}


// =========================
// Open Notes Panel
// =========================

async function openNotesPanel() {

    if (!currentBookId) return;


    createNotesPanel();


    notesPanel.classList.add(
        "active"
    );


    await loadReaderNotes();

}


// =========================
// Close Notes Panel
// =========================

function closeNotesPanel() {

    if (!notesPanel) return;


    notesPanel.classList.remove(
        "active"
    );

}


// =========================
// Notes Button
// =========================

readerNotesBtn.addEventListener(
    "click",
    function () {

        openNotesPanel();

    }
);


// =========================
// Load Reader Notes
// =========================

async function loadReaderNotes() {

    if (!currentBookId) return;


    const book =
        await getBook(
            currentBookId
        );


    if (!book) return;


    const notes =
        book.notes || [];


    const notesList =
        document.getElementById(
            "readerNotesList"
        );


    if (!notesList) return;


    if (!notes.length) {

        notesList.innerHTML = `

            <p class="no-saved-notes">
                No notes yet.
            </p>

        `;

        return;

    }


    notesList.innerHTML =
        notes
            .map(
                function (note) {

                    return `

                        <div
                            class="saved-note"
                        >

                            <p>
                                ${escapeHTML(
                                    note.text
                                )}
                            </p>

                            <small>
                                Page ${note.page}
                            </small>

                            <button
                                class="delete-note"
                                data-note-id="${note.id}"
                            >
                                Delete
                            </button>

                        </div>

                    `;

                }
            )
            .join("");


    notesList
        .querySelectorAll(".delete-note")
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        deleteReaderNote(
                            Number(
                                button.dataset.noteId
                            )
                        );

                    }
                );

            }
        );

}


// =========================
// Save Reader Note
// =========================

async function saveReaderNote() {

    if (!currentBookId) return;


    const input =
        document.getElementById(
            "readerNoteInput"
        );


    if (!input) return;


    const text =
        input.value.trim();


    if (!text) {

        alert(
            "Please write a note first."
        );

        return;

    }


    const book =
        await getBook(
            currentBookId
        );


    if (!book) return;


    if (!Array.isArray(book.notes)) {

        book.notes = [];

    }


    book.notes.push({

        id: Date.now(),

        text: text,

        page: currentPage || 1

    });


    await updateBook(
        book
    );


    input.value = "";


    await loadReaderNotes();

    await renderAllNotes();

}


// =========================
// Delete Reader Note
// =========================

async function deleteReaderNote(
    noteId
) {

    if (!currentBookId) return;


    const book =
        await getBook(
            currentBookId
        );


    if (!book) return;


    book.notes =
        (book.notes || [])
            .filter(
                function (note) {

                    return (
                        note.id !==
                        noteId
                    );

                }
            );


    await updateBook(
        book
    );


    await loadReaderNotes();

    await renderAllNotes();

}


// =========================
// Render Main Notes
// =========================

async function renderAllNotes() {

    if (!db || !notesContainer) return;


    const books =
        await getAllBooks();


    notesContainer.innerHTML = "";


    let hasNotes = false;


    books.forEach(
        function (book) {

            if (
                !book.notes ||
                !book.notes.length
            ) {

                return;

            }


            hasNotes = true;


            const bookSection =
                document.createElement(
                    "div"
                );


            bookSection.className =
                "main-notes-book";


            bookSection.innerHTML = `

                <h3>
                    ${escapeHTML(book.title)}
                </h3>

            `;


            book.notes.forEach(
                function (note) {

                    const noteElement =
                        document.createElement(
                            "div"
                        );


                    noteElement.className =
                        "saved-note";


                    noteElement.innerHTML = `

                        <p>
                            ${escapeHTML(
                                note.text
                            )}
                        </p>

                        <small>
                            Page ${note.page}
                        </small>

                    `;


                    bookSection.appendChild(
                        noteElement
                    );

                }
            );


            notesContainer.appendChild(
                bookSection
            );

        }
    );


    if (!hasNotes) {

        notesContainer.innerHTML = `

            <p class="no-notes">
                Your notes will appear here while you read.
            </p>

        `;

    }

}


// =========================
// Dark Mode
// =========================

themeBtn.addEventListener(
    "click",
    function () {

        document.body.classList.toggle(
            "dark"
        );


        if (
            document.body.classList.contains(
                "dark"
            )
        ) {

            themeBtn.textContent =
                "☀️";

        } else {

            themeBtn.textContent =
                "🌙";

        }

    }
);


// =========================
// HTML Escape
// =========================

function escapeHTML(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}

// Search
bookSearch.addEventListener(
    "input",
    filterAndSearchBooks
);


// Filters
filterButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                filterButtons.forEach(
                    function (btn) {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                currentFilter =
                    button.dataset.filter;


                filterAndSearchBooks();

            }
        );

    }
);


// =========================
// Render Filtered Books
// =========================

function renderFilteredBooks(books) {

    booksGrid.innerHTML = "";

    if (!books.length) {

        emptyLibrary.style.display =
            "block";

        emptyLibrary.querySelector("h3").textContent =
            "No books found";

        emptyLibrary.querySelector("p").textContent =
            "There are no books in this category yet.";

        return;

    }

    emptyLibrary.style.display =
        "none";


    books.forEach(function (book) {

        const bookCard =
            document.createElement("div");

        bookCard.classList.add(
            "book-card"
        );


        const coverURL =
            book.cover
                ? URL.createObjectURL(book.cover)
                : null;


        bookCard.innerHTML = `

            <div class="book-card-cover">

                ${
                    coverURL
                        ? `
                            <img
                                src="${coverURL}"
                                alt="Book cover"
                            >
                        `
                        : ""
                }

            </div>


            <div class="book-card-info">

                <h3>
                    ${escapeHTML(book.title)}
                </h3>

                <p>
                    ${escapeHTML(book.author)}
                </p>


                <div class="book-card-progress">

                    <div class="progress-container">

                        <div
                            class="progress-bar"
                            style="width: ${book.progress || 0}%"
                        ></div>

                    </div>

                    <p>
                        ${book.progress || 0}% completed
                    </p>

                </div>


                <div class="book-actions">

                    <button
                        class="continue-btn open-book"
                        data-id="${book.id}"
                    >
                        Open Book
                    </button>


                    <button
                        class="delete-btn delete-book"
                        data-id="${book.id}"
                    >
                        Delete
                    </button>

                </div>

            </div>

        `;


        booksGrid.appendChild(
            bookCard
        );

    });

}

// =========================
// Mobile Menu
// =========================

const menuBtn =
    document.getElementById("menuBtn");

const navbar =
    document.querySelector(".navbar");


menuBtn.addEventListener(
    "click",
    function () {

        navbar.classList.toggle("active");

        if (navbar.classList.contains("active")) {

            menuBtn.textContent = "✕";

        } else {

            menuBtn.textContent = "☰";

        }

    }
);


// Close menu after clicking a link

navbar.querySelectorAll("a").forEach(
    function (link) {

        link.addEventListener(
            "click",
            function () {

                navbar.classList.remove("active");

                menuBtn.textContent = "☰";

            }
        );

    }
);
