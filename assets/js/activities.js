// activities.js
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Use the db instance from firebase-init.js
const db = window.db;

let allPhotos = [];
let currentPhotoIndex = 0;
let isAnimating = false;
let autoRotateInterval;
const PHOTOS_PER_PAGE = 3;

async function fetchAllPhotos() {
	try {
		const activitiesCol = collection(db, "activities");
		const q = query(activitiesCol, orderBy("createdAt", "desc"));
		const snapshot = await getDocs(q);
		
		// Collect all photos from all documents
		let photos = [];
		snapshot.docs.forEach(doc => {
			const data = doc.data();
			if (data.photos && Array.isArray(data.photos)) {
				photos = photos.concat(data.photos);
			}
		});
		
		return photos;
	} catch (error) {
		console.error("Error fetching activities:", error);
		return [];
	}
}

function renderPhotosCarousel(shouldAnimate = false) {
	// Find the section that contains Recent Activity articles
	const articleList = document.getElementById("recent-activities");
	
	if (!articleList) {
		console.warn("Recent activities section not found");
		return;
	}

	if (!allPhotos.length) {
		articleList.innerHTML = '<h2 class="icon fa-file-alt" style="text-align: center;">Recent Activity</h2><p>No photos found.</p>';
		return;
	}

	// If animating from auto-rotate, add fade out effect first
	if (shouldAnimate && articleList.querySelector('.box.excerpt')) {
		const existingCards = articleList.querySelectorAll('.box.excerpt');
		existingCards.forEach(card => {
			card.classList.add('slide-up-fade-out');
		});
		
		// Wait for fade out, then render new photos
		setTimeout(() => {
			renderNewPhotos();
		}, 500);
		return;
	}
	
	renderNewPhotos();
	
	function renderNewPhotos() {
		// Build HTML for the heading
		let articlesHTML = '<h2 class="icon fa-file-alt" style="text-align: center;">Recent Activity</h2>';
		
		// Get 3 photos starting from currentPhotoIndex
		for (let i = 0; i < PHOTOS_PER_PAGE; i++) {
			const photoIndex = (currentPhotoIndex + i) % allPhotos.length;
			const photo = allPhotos[photoIndex];
			
			let imageUrl = 'images/default-activity.jpg';
			let caption = '';
			
			if (photo.imageUrl) {
				imageUrl = photo.imageUrl;
			}
			if (photo.caption) {
				caption = photo.caption;
			}

			const delay = i * 0.1;
			const animationClass = (shouldAnimate || true) ? 'slide-up-fade-in' : '';
			const animationStyle = (shouldAnimate || true) ? `animation-delay: ${delay}s;` : 'opacity: 1; transform: translateY(0);';
			const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e9'];
			const borderColors = ['#05d4e7', '#9c27b0', '#4caf50'];
			const cardColor = colors[i % colors.length];
			const cardBorderColor = borderColors[i % borderColors.length];
			
			articlesHTML += `
				<article class="box excerpt ${animationClass}" style="display: flex; align-items: center; gap: 20px; padding: 20px; border: 3px solid ${cardBorderColor}; border-radius: 8px; background-color: ${cardColor}; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; transition: box-shadow 0.3s ease, transform 0.3s ease; ${animationStyle}" onmouseover="this.style.boxShadow='0 8px 20px rgba(0,0,0,0.2)'; this.style.transform='translateY(-5px)';" onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'; this.style.transform='translateY(0)';">
					<a href="#" class="image" style="flex-shrink: 0; perspective: 1000px;"><img src="${imageUrl}" alt="Activity Photo" style="width: 200px; height: 150px; object-fit: cover; border-radius: 5px; border: 3px solid ${cardBorderColor}; box-shadow: 0 10px 30px rgba(0,0,0,0.3), -5px 5px 15px rgba(0,0,0,0.2), 5px 5px 15px rgba(0,0,0,0.2); transition: transform 0.3s ease, box-shadow 0.3s ease; transform: rotateX(5deg) rotateY(-5deg);" onmouseover="this.style.transform='rotateX(-5deg) rotateY(5deg) scale(1.05)'; this.style.boxShadow='0 20px 50px rgba(0,0,0,0.4), -10px 10px 25px rgba(0,0,0,0.3), 10px 10px 25px rgba(0,0,0,0.3)';" onmouseout="this.style.transform='rotateX(5deg) rotateY(-5deg) scale(1)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.3), -5px 5px 15px rgba(0,0,0,0.2), 5px 5px 15px rgba(0,0,0,0.2)';" /></a>
					<div style="flex: 1; text-align: center;">
					<p style="margin: 0; color: #333; line-height: 1.6; font-size: 1.1em;">${caption}</p>
					</div>
				</article>
			`;
		}

		// Add navigation buttons
		articlesHTML += `
			<div style="display: flex; justify-content: center; gap: 15px; margin-top: 20px;">
				<span id="photo-counter" style="padding: 10px 20px; text-align: center; font-weight: bold;">Photo ${currentPhotoIndex + 1} - ${currentPhotoIndex + PHOTOS_PER_PAGE} of ${allPhotos.length}</span>
			</div>
			<div style="display: flex; justify-content: center; margin-top: 25px;">
				<a href="activity/all-activity.html" style="padding: 15px 45px; background: linear-gradient(135deg, #05d4e7 0%, #00a8cc 100%); color: black; border: none; border-radius: 50px; cursor: pointer; font-weight: bold; text-decoration: none; display: inline-block; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(5, 212, 231, 0.3); font-size: 1.05em; letter-spacing: 0.5px; position: relative; overflow: hidden;" onmouseover="this.style.boxShadow='0 15px 35px rgba(5, 212, 231, 0.5)'; this.style.transform='translateY(-3px) scale(1.05)'; this.style.background='linear-gradient(135deg, #00a8cc 0%, #05d4e7 100%)';" onmouseout="this.style.boxShadow='0 8px 20px rgba(5, 212, 231, 0.3)'; this.style.transform='translateY(0) scale(1)'; this.style.background='linear-gradient(135deg, #05d4e7 0%, #00a8cc 100%)';">
					<span style="display: inline-block;">✨ Explore All Activities ✨</span>
				</a>
			</div>
		`;

		articleList.innerHTML = articlesHTML;
	}
}

function showNextPhotos() {
	currentPhotoIndex = (currentPhotoIndex + PHOTOS_PER_PAGE) % allPhotos.length;
	renderPhotosCarousel(true);
}

function showPreviousPhotos() {
	currentPhotoIndex = (currentPhotoIndex - PHOTOS_PER_PAGE + allPhotos.length) % allPhotos.length;
	renderPhotosCarousel(true);
}

function startAutoRotate() {
	autoRotateInterval = setInterval(() => {
		currentPhotoIndex = (currentPhotoIndex + 1) % allPhotos.length;
		renderPhotosCarousel(true);
	}, 5000);
}

function stopAutoRotate() {
	if (autoRotateInterval) {
		clearInterval(autoRotateInterval);
	}
}

function setupIntersectionObserver() {
	const articleList = document.getElementById("recent-activities");
	
	if (!articleList) {
		console.warn("Recent activities section not found");
		return;
	}

	const observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			// Trigger animation when section comes into view
			if (entry.isIntersecting && !isAnimating) {
				isAnimating = true;
				// Re-render with animation enabled
				renderPhotosCarousel(true);
				
				// Reset flag after animation completes (0.6s + last card delay)
				setTimeout(() => {
					isAnimating = false;
				}, 1050);
				
				// Start auto-rotate
				startAutoRotate();
			} else if (!entry.isIntersecting) {
				// Stop auto-rotate when section is out of view
				stopAutoRotate();
			}
		});
	}, {
		threshold: 0 // Trigger as soon as element comes into view
	});

	observer.observe(articleList);
}

// On page load, fetch and render activities
document.addEventListener("DOMContentLoaded", async () => {
	try {
		allPhotos = await fetchAllPhotos();
		if (allPhotos.length > 0) {
			// Initial render without animation
			renderPhotosCarousel(false);
			// Setup observer for scroll-triggered animation
			setupIntersectionObserver();
		} else {
			console.log("No photos to display");
		}
	} catch (error) {
		console.error("Error in activities script:", error);
	}
});
