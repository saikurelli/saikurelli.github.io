(function () {
	var POSTS_URL = '/blog/data/posts.json';
	var AUTOPLAY_INTERVAL = 5000;

	var posts = [];
	var filteredPosts = [];
	var activeTag = 'all';
	var sliderIndex = 0;
	var autoplayTimer = null;

	// ── DOM refs ─────────────────────────────────────────

	var sliderEl = document.getElementById('blog-slider');
	var trackEl = document.getElementById('slider-track');
	var dotsEl = document.getElementById('slider-dots');
	var prevBtn = document.getElementById('slider-prev');
	var nextBtn = document.getElementById('slider-next');
	var tagFilterEl = document.getElementById('tag-filter');
	var postGridEl = document.getElementById('post-grid');

	if (!trackEl || !postGridEl) {
		return;
	}

	// ── Helpers ──────────────────────────────────────────

	function formatDate(dateStr) {
		var parts = dateStr.split('-');
		var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
		return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	}

	function escapeHtml(text) {
		return String(text)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	// ── Slider ───────────────────────────────────────────

	function buildSlider() {
		if (!posts.length) {
			return;
		}

		trackEl.innerHTML = '';
		dotsEl.innerHTML = '';

		posts.forEach(function (post, i) {
			var slide = document.createElement('div');
			slide.className = 'slider-slide' + (i === 0 ? ' active' : '');
			slide.setAttribute('aria-hidden', i !== 0 ? 'true' : 'false');
			slide.innerHTML =
				'<div class="slider-post-title">' + escapeHtml(post.title) + '</div>' +
				'<p class="slider-summary-text">' + escapeHtml(post.ai_summary) + '</p>' +
				'<a href="' + escapeHtml(post.url) + '" class="slider-read-link">Read post →</a>';
			trackEl.appendChild(slide);

			var dot = document.createElement('button');
			dot.type = 'button';
			dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
			dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
			dot.addEventListener('click', function () {
				goTo(i);
				resetAutoplay();
			});
			dotsEl.appendChild(dot);
		});

		sliderIndex = 0;
		startAutoplay();
	}

	function goTo(index) {
		var slides = trackEl.querySelectorAll('.slider-slide');
		var dots = dotsEl.querySelectorAll('.slider-dot');

		if (!slides.length) {
			return;
		}

		sliderIndex = (index + slides.length) % slides.length;

		slides.forEach(function (slide, i) {
			slide.classList.toggle('active', i === sliderIndex);
			slide.setAttribute('aria-hidden', i !== sliderIndex ? 'true' : 'false');
		});

		dots.forEach(function (dot, i) {
			dot.classList.toggle('active', i === sliderIndex);
		});
	}

	function startAutoplay() {
		clearInterval(autoplayTimer);
		autoplayTimer = setInterval(function () {
			goTo(sliderIndex + 1);
		}, AUTOPLAY_INTERVAL);
	}

	function resetAutoplay() {
		clearInterval(autoplayTimer);
		startAutoplay();
	}

	if (prevBtn) {
		prevBtn.addEventListener('click', function () {
			goTo(sliderIndex - 1);
			resetAutoplay();
		});
	}

	if (nextBtn) {
		nextBtn.addEventListener('click', function () {
			goTo(sliderIndex + 1);
			resetAutoplay();
		});
	}

	// Pause autoplay on hover
	if (sliderEl) {
		sliderEl.addEventListener('mouseenter', function () {
			clearInterval(autoplayTimer);
		});

		sliderEl.addEventListener('mouseleave', function () {
			startAutoplay();
		});
	}

	// Keyboard navigation (left/right arrow keys when slider is focused)
	if (sliderEl) {
		sliderEl.addEventListener('keydown', function (event) {
			if (event.key === 'ArrowLeft') {
				event.preventDefault();
				goTo(sliderIndex - 1);
				resetAutoplay();
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				goTo(sliderIndex + 1);
				resetAutoplay();
			}
		});
	}

	// ── Tag filter ───────────────────────────────────────

	function buildTagFilter() {
		if (!tagFilterEl) {
			return;
		}

		var allTags = [];
		posts.forEach(function (post) {
			(post.tags || []).forEach(function (tag) {
				if (allTags.indexOf(tag) < 0) {
					allTags.push(tag);
				}
			});
		});

		// Clear existing dynamic tags (keep "All" button)
		var existingAll = tagFilterEl.querySelector('[data-tag="all"]');
		tagFilterEl.innerHTML = '';

		var allBtn = document.createElement('button');
		allBtn.type = 'button';
		allBtn.className = 'tag-pill active';
		allBtn.setAttribute('data-tag', 'all');
		allBtn.textContent = 'All';
		allBtn.addEventListener('click', function () { setActiveTag('all'); });
		tagFilterEl.appendChild(allBtn);

		allTags.forEach(function (tag) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'tag-pill';
			btn.setAttribute('data-tag', tag);
			btn.textContent = tag;
			btn.addEventListener('click', function () { setActiveTag(tag); });
			tagFilterEl.appendChild(btn);
		});
	}

	function setActiveTag(tag) {
		activeTag = tag;

		if (tagFilterEl) {
			tagFilterEl.querySelectorAll('.tag-pill').forEach(function (btn) {
				btn.classList.toggle('active', btn.getAttribute('data-tag') === tag);
			});
		}

		filteredPosts = tag === 'all'
			? posts.slice()
			: posts.filter(function (p) { return (p.tags || []).indexOf(tag) >= 0; });

		renderGrid();
	}

	// ── Post grid ────────────────────────────────────────

	function renderGrid() {
		postGridEl.innerHTML = '';

		if (!filteredPosts.length) {
			var empty = document.createElement('p');
			empty.className = 'post-grid-empty';
			empty.textContent = 'No posts found for this tag.';
			postGridEl.appendChild(empty);
			return;
		}

		filteredPosts.forEach(function (post) {
			var tagsHtml = (post.tags || []).map(function (tag) {
				return '<span class="post-card-tag">' + escapeHtml(tag) + '</span>';
			}).join('');

			var card = document.createElement('a');
			card.href = post.url;
			card.className = 'post-card';
			card.innerHTML =
				'<div class="post-card-date">' + escapeHtml(formatDate(post.date)) + '</div>' +
				'<div class="post-card-title">' + escapeHtml(post.title) + '</div>' +
				'<p class="post-card-excerpt">' + escapeHtml(post.excerpt) + '</p>' +
				'<div class="post-card-tags">' + tagsHtml + '</div>';
			postGridEl.appendChild(card);
		});
	}

	// ── Bootstrap ────────────────────────────────────────

	fetch(POSTS_URL)
		.then(function (response) {
			if (!response.ok) {
				throw new Error('Failed to load posts.json: ' + response.status);
			}
			return response.json();
		})
		.then(function (data) {
			posts = Array.isArray(data) ? data : [];
			filteredPosts = posts.slice();
			buildSlider();
			buildTagFilter();
			renderGrid();
		})
		.catch(function (err) {
			postGridEl.innerHTML = '<p class="post-grid-empty">Could not load posts. Please try again later.</p>';
			console.error('blog.js:', err);
		});
})();
