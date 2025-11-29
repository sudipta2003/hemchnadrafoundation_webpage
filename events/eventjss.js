// eventjss.js
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Use the db instance from firebase-init.js
const db = window.db;

async function fetchEvents() {
	const eventsCol = collection(db, "events");
	const q = query(eventsCol, orderBy("date", "desc"));
	const snapshot = await getDocs(q);
	return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

function renderEvents(events) {
	const grid = document.getElementById("events-grid");
	if (!events.length) {
		grid.innerHTML = '<p>No events found.</p>';
		return;
	}
	const firstThree = events.slice(0, 3);
	grid.innerHTML = firstThree.map(event => `
		<a href="event-details.html?id=${event.id}" class="event-card-link">
			<div class="event-card">
				<img src="${event.image || '../images/default-event.jpg'}" alt="${event.title || 'Event Image'}">
				<h2>${event.title || "Untitled Event"}</h2>
			</div>
		</a>
	`).join("");

	// Always add 'Learn More' link below the grid
	const existingLearnMore = document.getElementById('learn-more-link');
	if (!existingLearnMore) {
		const learnMoreDiv = document.createElement('div');
		learnMoreDiv.style.textAlign = 'center';
		learnMoreDiv.style.marginTop = '20px';
		// Determine the correct path based on current page location
		const allEventsPath = window.location.pathname.includes('/events/') ? 'all-events.html' : 'events/all-events.html';
		learnMoreDiv.innerHTML = `<a href="${allEventsPath}" id="learn-more-link" class="learn-more-link">Learn More</a>`;
		grid.parentNode.appendChild(learnMoreDiv);
	}
}

// On page load, fetch and render events
document.addEventListener("DOMContentLoaded", async () => {
	try {
		const events = await fetchEvents();
		renderEvents(events);
	} catch (err) {
		document.getElementById("events-grid").innerHTML = `<p style="color:red">Failed to load events: ${err.message}</p>`;
		console.error(err);
	}
});
