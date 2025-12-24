// books.js
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Use the db instance from firebase-init.js
const db = window.db;

let allBooks = [];
let filteredBooks = [];
let categories = new Set();

// Fetch all books from Firestore
async function fetchAllBooks() {
    try {
        const booksCol = collection(db, "books");
        const q = query(booksCol, orderBy("title", "asc"));
        const snapshot = await getDocs(q);
        
        allBooks = [];
        
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            allBooks.push({
                id: doc.id,
                title: data.title || "Untitled",
                coverUrl: data.coverUrl || ""
            });
        });
        
        // Sort categories alphabetically
        categories = new Set([...categories].sort());
        
        return allBooks;
    } catch (error) {
        console.error("Error fetching books:", error);
        displayError("Failed to load books. Please try again later.");
        return [];
    }
}

// Render books to the grid
function renderBooks(books) {
    const booksGrid = document.getElementById("booksGrid");
    
    if (!books || books.length === 0) {
        booksGrid.innerHTML = '<div class="no-books-message">No books found. Please try a different search.</div>';
        return;
    }
    
    let html = "";
    books.forEach(book => {
        html += `
            <div class="book-grid-card" data-book-id="${book.id}">
                <div class="book-grid-image-container">
                    ${book.coverUrl 
                        ? `<img src="${book.coverUrl}" alt="${book.title}" class="book-grid-image">` 
                        : `<div class="book-grid-image" style="display: flex; align-items: center; justify-content: center; font-size: 4em; color: white; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">📖</div>`
                    }
                </div>
                <div class="book-grid-content">
                    <h3 class="book-grid-title">${escapeHtml(book.title)}</h3>
                </div>
            </div>
        `;
    });
    
    booksGrid.innerHTML = html;
    
    // Attach click handlers to cards
    attachCardClickHandlers(books);
}

// Display error message
function displayError(message) {
    const booksGrid = document.getElementById("booksGrid");
    booksGrid.innerHTML = `<div class="no-books">${escapeHtml(message)}</div>`;
}

// Escape HTML special characters
function escapeHtml(text) {
    if (!text) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Open modal with book details
function openBookModal(book) {
    const modal = document.getElementById("bookModal");
    const modalImage = document.getElementById("modalImage");
    const modalTitle = document.getElementById("modalTitle");
    
    // Set image
    if (book.coverUrl) {
        modalImage.src = book.coverUrl;
        modalImage.style.background = "white";
    } else {
        modalImage.src = "";
        modalImage.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        modalImage.innerHTML = "📖";
        modalImage.style.display = "flex";
        modalImage.style.alignItems = "center";
        modalImage.style.justifyContent = "center";
        modalImage.style.fontSize = "80px";
    }
    
    // Set title
    modalTitle.textContent = escapeHtml(book.title);
    
    // Show modal
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

// Close modal
function closeBookModal() {
    const modal = document.getElementById("bookModal");
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
}

// Attach click handlers to book cards
function attachCardClickHandlers(books) {
    const cards = document.querySelectorAll(".book-grid-card");
    
    cards.forEach(card => {
        card.addEventListener("click", (e) => {
            const bookId = card.getAttribute("data-book-id");
            const book = books.find(b => b.id === bookId);
            if (book) {
                openBookModal(book);
            }
        });
    });
}

// Setup modal close handlers
function setupModalHandlers() {
    const modal = document.getElementById("bookModal");
    const closeBtn = document.getElementById("modalClose");
    
    // Close button click
    closeBtn.addEventListener("click", closeBookModal);
    
    // Click outside modal to close
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeBookModal();
        }
    });
    
    // Escape key to close
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeBookModal();
        }
    });
}

// Filter books based on search and category
function filterBooks() {
    const searchTerm = document.getElementById("searchInput")?.value.toLowerCase() || "";
    
    filteredBooks = allBooks.filter(book => {
        const matchesSearch = !searchTerm || 
            book.title.toLowerCase().includes(searchTerm);
        
        return matchesSearch;
    });
    
    renderBooks(filteredBooks);
}

// Setup filter buttons
function setupFilters() {
    // No filters needed with simplified data
    const filterContainer = document.getElementById("filterContainer");
    if (filterContainer) {
        filterContainer.style.display = "none";
    }
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;
    
    searchInput.addEventListener("input", () => {
        filterBooks();
    });
    
    searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            filterBooks();
        }
    });
}

// Initialize the page
async function init() {
    try {
        // Check if db is available (wait a bit for firebase-init.js to load)
        let attempts = 0;
        while (!window.db && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.db) {
            throw new Error("Firebase database not initialized");
        }
        
        // Fetch books
        await fetchAllBooks();
        
        // Setup filters and search
        setupFilters();
        setupSearch();
        setupModalHandlers();
        
        // Initial render
        filteredBooks = allBooks;
        renderBooks(filteredBooks);
        
    } catch (error) {
        console.error("Initialization error:", error);
        displayError("Failed to initialize the books page. Please refresh and try again.");
    }
}

// Start when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
