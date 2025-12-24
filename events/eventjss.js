// eventjss.js
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Use the db instance from firebase-init.js
const db = window.db;

let allEvents = [];
let currentIndex = 0;
let autoScrollInterval;

// Add styling for centered cards
const style = document.createElement('style');
style.innerHTML = `
	#events-grid {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 30px;
		width: 50%;
		margin: 0 auto;
		padding: 40px 20px;
	}
	
	.event-card-link {
		text-decoration: none;
		color: inherit;
	}
	
	.event-card {
		background: white;
		border-radius: 20px;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		min-width: 300px;
		height: 100%;
		border: 3px solid transparent;
		background: linear-gradient(white, white) padding-box,
		            linear-gradient(135deg, #667eea, #764ba2) border-box;
	}
	
	.event-card:hover {
		transform: translateY(-15px) scale(1.02);
		box-shadow: 0 20px 50px rgba(102, 126, 234, 0.4);
		border: 3px solid transparent;
		background: linear-gradient(white, white) padding-box,
		            linear-gradient(135deg, #764ba2, #667eea) border-box;
	}
	
	.event-card-image-container {
		position: relative;
		width: 100%;
		height: 240px;
		overflow: hidden;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.image-carousel {
		position: relative;
		width: 100%;
		height: 100%;
		display: block;
	}
	
	.event-card-image {
		width: 100%;
		height: 240px;
		object-fit: cover;
		display: block;
	}
	
	.event-card img {
		width: 100%;
		height: 240px;
		object-fit: cover;
		transition: transform 0.4s ease-in-out;
	}
	
	.event-card:hover img {
		transform: scale(1.12);
	}
	
	.event-card h2 {
		padding: 25px;
		margin: 0;
		font-size: 1.35em;
		font-weight: 700;
		color: #667eea;
		text-align: center;
		line-height: 1.5;
		flex-grow: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f5f7ff 0%, #f0f0ff 100%);
	}
	
	.learn-more-link {
		display: inline-block;
		padding: 14px 45px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white !important;
		text-decoration: none;
		border-radius: 50px;
		font-size: 1.05em;
		font-weight: 700;
		cursor: pointer;
		border: none;
		position: relative;
		box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}
	
	.learn-more-link:hover {
		transform: translateY(-4px);
		box-shadow: 0 15px 45px rgba(102, 126, 234, 0.5);
		background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
	}
	
	.learn-more-link:active {
		transform: translateY(-1px);
		box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);
	}
`;
document.head.appendChild(style);

// Note: extractImagesFromCustomFields is no longer used - we display only the title image

// Note: initializeCarousel is no longer used - we display only the title image (no carousel needed)

async function fetchEvents() {
	const eventsCol = collection(db, "events");
	const snapshot = await getDocs(eventsCol);
	return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

function renderEvents(events) {
	const grid = document.getElementById("events-grid");
	if (!events.length) {
		grid.innerHTML = '<p>No events found.</p>';
		return;
	}
	const firstThree = events.slice(0, 3);
	grid.innerHTML = firstThree.map(event => {
		const titleImage = event.titleImage || '../images/default-event.jpg';
		
		return `
			<a href="events/event-details.html?id=${event.id}" class="event-card-link">
				<div class="event-card">
					<div class="event-card-image-container">
						<img src="${titleImage}" alt="${event.title || 'Event Image'}" class="event-card-image" />
					</div>
					<h2>${event.title || "Untitled Event"}</h2>
				</div>
			</a>
		`;
	}).join("");

	// Always add 'Learn More' link below the grid
	const existingLearnMore = document.getElementById('learn-more-link');
	if (!existingLearnMore) {
		const learnMoreDiv = document.createElement('div');
		learnMoreDiv.style.textAlign = 'center';
		learnMoreDiv.style.marginTop = '10px';
		learnMoreDiv.style.paddingBottom = '0px';
		// Determine the correct path based on current page location
		const allEventsPath = window.location.pathname.includes('/events/') ? 'all-events.html' : 'events/all-events.html';
		learnMoreDiv.innerHTML = `<a href="${allEventsPath}" id="learn-more-link" class="learn-more-link">View All Events</a>`;
		grid.parentNode.appendChild(learnMoreDiv);
	}
}

function rotateEvents() {
	if (allEvents.length === 0) return;
	
	const grid = document.getElementById("events-grid");
	const displayEvents = [];
	
	// Get the next 3 events in rotation
	for (let i = 0; i < 3; i++) {
		displayEvents.push(allEvents[(currentIndex + i) % allEvents.length]);
	}
	
	currentIndex = (currentIndex + 1) % allEvents.length;
	
	// Update the grid with animation
	grid.style.opacity = '0.3';
	setTimeout(() => {
		grid.innerHTML = displayEvents.map(event => {
			const titleImage = event.titleImage || '../images/default-event.jpg';
			
			return `
				<a href="events/event-details.html?id=${event.id}" class="event-card-link">
					<div class="event-card">
						<div class="event-card-image-container">
							<img src="${titleImage}" alt="${event.title || 'Event Image'}" class="event-card-image" />
						</div>
						<h2>${event.title || "Untitled Event"}</h2>
					</div>
				</a>
			`;
		}).join("");
		
		grid.style.transition = 'opacity 0.3s ease-in-out';
		grid.style.opacity = '1';
	}, 300);
}

function startAutoScroll() {
	// Change events every 5 seconds
	autoScrollInterval = setInterval(rotateEvents, 5000);
}

function stopAutoScroll() {
	if (autoScrollInterval) {
		clearInterval(autoScrollInterval);
	}
}

// Clean up on page unload to prevent memory leaks
window.addEventListener("beforeunload", stopAutoScroll);

// On page load, fetch and render events
document.addEventListener("DOMContentLoaded", async () => {
	try {
		allEvents = await fetchEvents();
		if (allEvents.length > 0) {
			renderEvents(allEvents);
			
			// Only animate if there are more than 3 events
			if (allEvents.length > 3) {
				startAutoScroll();
				
				// Stop auto-scroll when user hovers over events, resume when they leave
				const grid = document.getElementById("events-grid");
				if (grid) {
					grid.addEventListener("mouseenter", stopAutoScroll);
					grid.addEventListener("mouseleave", startAutoScroll);
				}
			}
		}
	} catch (err) {
		const grid = document.getElementById("events-grid");
		if (grid) {
			grid.innerHTML = `<p style="color:red">Failed to load events: ${err.message}</p>`;
		}
		console.error(err);
	}
});
