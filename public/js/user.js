document.addEventListener('DOMContentLoaded', async function() {
    const beichteForm = document.getElementById('beichteForm');
    const beichteText = document.getElementById('beichteText');
    const charCount = document.getElementById('charCount');
    
    // Character count update
    beichteText.addEventListener('input', function() {
        charCount.textContent = this.value.length;
    });
    
    // Form submission
    beichteForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newBeichte = {
            text: beichteText.value.trim(),
            age: document.getElementById('class').value || null,
            gender: document.getElementById('gender').value || null
        };
        
        if (!newBeichte.text) {
            alert('Bitte gib eine Beichte ein!');
            return;
        }
        
        try {
            await submitBeichte(newBeichte);
            beichteForm.reset();
            charCount.textContent = '0';
            alert('Deine Beichte wurde eingereicht und wartet auf Freigabe durch den Admin.');
        } catch (error) {
            alert('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
        }
    });
});