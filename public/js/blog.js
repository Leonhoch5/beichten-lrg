// beichten-tv.js
document.addEventListener('DOMContentLoaded', async function () {
    const track = document.getElementById('beichtenList');
    const container = document.querySelector('.scrolling-container');

    // Configuration
    const scrollSpeed = 50; // pixels per second
    const minConfessions = 30; // minimum items for smooth loop
    let animationId;

    // Format date for display
    function formatDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Create beichte element with your styling
    function createBeichteElement(beichte, index) {
        const div = document.createElement('div');
        div.className = 'beichte';

        let html = `<div class="beichte-text">${beichte.text}</div>`;

        if (beichte.timestamp || beichte.age || beichte.gender) {
            html += `<div class="beichte-meta">`;
            if (beichte.timestamp) html += `<span class="date">${formatDate(beichte.timestamp)}</span>`;

            if (beichte.age || beichte.gender) {
                if (beichte.age) html += `<span class="age">🏫 ${beichte.age}</span>`;
                if (beichte.gender) {
                    const emoji = beichte.gender === 'männlich' ? '👨' :
                        beichte.gender === 'weiblich' ? '👩' : '🧑';
                    html += `<span class="gender">${emoji}</span>`;
                }
            }
            html += `</div>`;
        }

        div.innerHTML = html;
        return div;
    }

    // Fetch approved beichten from API
    async function fetchApprovedBeichten() {
        try {
            const response = await fetch('/api/beichten');
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Error fetching beichten:', error);
            return [];
        }
    }

    // Initialize with data
    async function initBeichten() {
        const approved = await fetchApprovedBeichten();

        // Fallback to sample data if empty
        if (approved.length === 0) {
            console.log('Using sample data');
            return initSampleData();
        }

        track.innerHTML = '';
        approved.forEach(beichte => {
            const div = createBeichteElement(beichte);
            track.appendChild(div);
        });

        prepareForScroll();
    }

    // Sample data fallback
    function initSampleData() {
        const sampleData = [
            { text: "Ich habe heute den letzten Kuchen gegessen und die Verpackung versteckt.", timestamp: Date.now() },
            { text: "Manchmal stelle ich mich krank, um einfach freizunehmen.", timestamp: Date.now() - 86400000 },
            { text: "Ich habe schon mal eine Pflanze sterben lassen und sie ersetzt.", timestamp: Date.now() - 172800000 },
            { text: "Ich lese oft das Ende von Büchern zuerst.", timestamp: Date.now() - 259200000, age: "20", gender: "weiblich" },
            { text: "Ich habe schon Geschenke weiter verschenkt.", timestamp: Date.now() - 345600000, age: "25", gender: "männlich" }
        ];

        track.innerHTML = '';
        sampleData.forEach(beichte => {
            const div = createBeichteElement(beichte);
            track.appendChild(div);
        });

        prepareForScroll();
    }

    // Prepare track for infinite scroll
    function prepareForScroll() {
        const items = track.querySelectorAll('.beichte');

        // Duplicate items if we don't have enough
        if (items.length < minConfessions) {
            const needed = minConfessions - items.length;
            for (let i = 0; i < needed; i++) {
                const clone = items[i % items.length].cloneNode(true);
                track.appendChild(clone);
            }
        }

        // Duplicate all items for seamless looping
        const allItems = track.querySelectorAll('.beichte');
        allItems.forEach(item => {
            const clone = item.cloneNode(true);
            track.appendChild(clone);
        });

        startScrolling();
    }

    // Constant smooth scrolling animation
    function startScrolling() {
        let scrollPos = 0;
        let lastTime = performance.now();

        function animate(time) {
            const deltaTime = time - lastTime;
            lastTime = time;

            // Calculate scroll position
            const deltaScroll = (scrollSpeed * deltaTime) / 1000;
            scrollPos += deltaScroll;

            // Reset scroll position when halfway
            if (scrollPos >= track.scrollHeight / 2) {
                scrollPos = 0;
            }

            track.style.transform = `translateY(-${scrollPos}px)`;
            animationId = requestAnimationFrame(animate);
        }

        animationId = requestAnimationFrame(animate);

        // Handle visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(animationId);
            } else {
                lastTime = performance.now();
                animationId = requestAnimationFrame(animate);
            }
        });
    }

    // Initialize everything
    await initBeichten();

    // Refresh every 5 minutes
    setInterval(() => {
        location.reload();
    }, 300000);
});