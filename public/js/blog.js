document.addEventListener('DOMContentLoaded', async function() {
    const beichtenList = document.getElementById('beichtenList');
    const loadMoreBtn = document.getElementById('loadMore');
    let visibleCount = 5;
    
    async function renderBeichten() {
        try {
            beichtenList.innerHTML = '';
            const approved = await fetchApprovedBeichten();
            
            if (approved.length === 0) {
                beichtenList.innerHTML = '<p class="no-beichten">Noch keine freigegebenen Beichten. Komm später wieder!</p>';
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
                return;
            }
            
            approved.slice(0, visibleCount).forEach((beichte, index) => {
                const beichteEl = createBeichteElement(beichte, index);
                beichtenList.appendChild(beichteEl);
            });
            
            if (loadMoreBtn) {
                loadMoreBtn.style.display = visibleCount >= approved.length ? 'none' : 'block';
            }
        } catch (error) {
            console.error('Error rendering beichten:', error);
        }
    }
    
    function createBeichteElement(beichte, index) {
        const div = document.createElement('div');
        const alternateClass = index % 2 === 0 ? '' : 'right-aligned';
        div.className = `beichte ${alternateClass}`;
        
        let html = `
            <div class="beichte-text">${beichte.text}</div>
            <div class="beichte-meta">
                <span class="date">${formatDate(beichte.timestamp)}</span>
        `;
        
        if (beichte.age || beichte.gender) {
            if (beichte.age) html += `<span class="age">🏫 ${beichte.age}</span>`;
            if (beichte.gender) {
                const emoji = beichte.gender === 'männlich' ? '👨' : 
                             beichte.gender === 'weiblich' ? '👩' : '🧑';
                html += `<span class="gender">${emoji}</span>`;
            }
        }
        
        html += `</div>`;
        div.innerHTML = html;
        
        return div;
    }
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            visibleCount += 5;
            renderBeichten();
            setTimeout(() => {
                loadMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        });
    }
    
    await renderBeichten();
});