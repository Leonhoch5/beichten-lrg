// Database functions
async function submitBeichte(beichte) {
    try {
        const response = await fetch('/api/beichten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(beichte)
        });
        return await response.json();
    } catch (error) {
        console.error('Error submitting beichte:', error);
        throw error;
    }
}

async function fetchPendingBeichten() {
    try {
        const response = await fetch('/api/beichten/pending');
        return await response.json();
    } catch (error) {
        console.error('Error fetching pending beichten:', error);
        throw error;
    }
}

async function fetchApprovedBeichten() {
    try {
        const response = await fetch('/api/beichten/approved');
        return await response.json();
    } catch (error) {
        console.error('Error fetching approved beichten:', error);
        throw error;
    }
}

async function approveBeichte(id) {
    try {
        const response = await fetch(`/api/beichten/${id}/approve`, {
            method: 'PUT'
        });
        return await response.json();
    } catch (error) {
        console.error('Error approving beichte:', error);
        throw error;
    }
}

async function rejectBeichte(id) {
    try {
        const response = await fetch(`/api/beichten/${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error('Error rejecting beichte:', error);
        throw error;
    }
}

// Utility functions
function formatDate(dateString) {
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString('de-DE', options);
}

// Initialize scroll button
function initScrollButton() {
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-top';
    scrollBtn.innerHTML = '↑';
    scrollBtn.title = 'Nach oben';
    document.body.appendChild(scrollBtn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollBtn.classList.add('visible');
        } else {
            scrollBtn.classList.remove('visible');
        }
    });

    scrollBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initScrollButton();
});