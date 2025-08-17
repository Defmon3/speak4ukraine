document.addEventListener('DOMContentLoaded', () => {

    // --- WIDGET & GLOBAL STATE MANAGEMENT ---
    const landingWidget = document.getElementById('landing-widget');
    const emailToolWidget = document.getElementById('email-tool-widget');
    const proceedButton = document.getElementById('proceed-button');
    const backButton = document.getElementById('back-button');

    let allReps = [];
    let currentReps = [];
    let selectedIds = new Set();

    // --- DOM ELEMENTS FOR THE TOOL ---
    const grid = document.getElementById('representatives-grid');
    const countrySelector = document.getElementById('country-selector');
    const selectedCountEl = document.getElementById('selected-count');
    const selectAllButton = document.getElementById('select-all-button');
    const sendEmailsButton = document.getElementById('send-emails-button');
    const copyMessageButton = document.getElementById('copy-message-button');
    const copyEmailsButton = document.getElementById('copy-emails-button');
    const emailBodyEl = document.getElementById('email-body');

    const sendButtonEnabledText = "Send Emails";
    const sendButtonDisabledText = `Please replace "[Your Name]" to continue`;


    // --- CORE LOGIC ---

    async function initializeApp() {
        // Initial setup for the app when it becomes visible
        updateButtonStates(); // Set initial disabled state

        try {
            const response = await fetch('representatives.json');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            allReps = data.representatives.map(rep => ({
                id: rep.id,
                name: rep.fullName,
                party: rep.party,
                country: rep.country,
                email: rep.contactInformation?.email || 'email-not-available',
                photo: rep.imageSource || 'https://via.placeholder.com/50/B0BEC5/455A64?Text=No+Img'
            }));

            populateCountrySelector();
            grid.innerHTML = '<p class="grid-placeholder">Please select a country from the dropdown above.</p>';
        } catch (error) {
            console.error("Fatal Error: Could not initialize app.", error);
            grid.innerHTML = `<p class="error-message">Could not load representative data. Please try refreshing the page.</p>`;
            countrySelector.innerHTML = `<option>Error</option>`;
        }
    }

    function updateButtonStates() {
        const isPlaceholderPresent = emailBodyEl.value.includes('[Your Name]');

        sendEmailsButton.disabled = isPlaceholderPresent;
        copyMessageButton.disabled = isPlaceholderPresent;
        copyEmailsButton.disabled = isPlaceholderPresent;

        if (isPlaceholderPresent) {
            sendEmailsButton.textContent = sendButtonDisabledText;
        } else {
            sendEmailsButton.textContent = sendButtonEnabledText;
        }
    }

    function populateCountrySelector() {
        const countries = [...new Set(allReps.map(rep => rep.country))].sort();
        countrySelector.innerHTML = '';

        const placeholder = document.createElement('option');
        placeholder.value = "";
        placeholder.textContent = "-- Please Select a Country --";
        countrySelector.appendChild(placeholder);

        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelector.appendChild(option);
        });
    }

    function filterAndRenderReps(country) {
        selectedIds.clear();

        if (!country) {
            currentReps = [];
            grid.innerHTML = '<p class="grid-placeholder">Please select a country from the dropdown above.</p>';
            updateSelectionCount();
            return;
        }

        grid.innerHTML = '<p class="grid-placeholder">Loading representatives...</p>';
        currentReps = allReps.filter(rep => rep.country === country);
        renderRepresentatives();
    }

    function renderRepresentatives() {
        grid.innerHTML = '';
        currentReps.forEach(rep => {
            const isSelected = selectedIds.has(rep.id);
            const card = document.createElement('div');
            card.className = `representative-card ${isSelected ? 'selected' : ''}`;
            card.dataset.id = rep.id;

            card.innerHTML = `
                <img src="${rep.photo}" alt="Photo of ${rep.name}" class="rep-photo" loading="lazy">
                <div class="rep-info">
                    <p class="rep-name">${rep.name}</p>
                    <p class="rep-party">${rep.party}</p>
                </div>
                <div class="checkmark-icon">✓</div>
            `;
            grid.appendChild(card);
        });
        updateSelectionCount();
    }

    function updateSelectionCount() {
        selectedCountEl.textContent = selectedIds.size;
    }

    function toggleSelection(card) {
        const id = card.dataset.id;
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
            card.classList.remove('selected');
        } else {
            selectedIds.add(id);
            card.classList.add('selected');
        }
        updateSelectionCount();
    }

    // --- EVENT LISTENERS ---

    proceedButton.addEventListener('click', () => {
        landingWidget.classList.add('hidden');
        emailToolWidget.classList.remove('hidden');
        emailToolWidget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    backButton.addEventListener('click', () => {
        emailToolWidget.classList.add('hidden');
        landingWidget.classList.remove('hidden');
        landingWidget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    emailBodyEl.addEventListener('input', updateButtonStates);

    countrySelector.addEventListener('change', (e) => filterAndRenderReps(e.target.value));

    grid.addEventListener('click', (e) => {
        const card = e.target.closest('.representative-card');
        if (card) toggleSelection(card);
    });

    selectAllButton.addEventListener('click', () => {
        const allCurrentIds = currentReps.map(rep => rep.id);
        if (allCurrentIds.length === 0) return;
        const areAllSelected = allCurrentIds.every(id => selectedIds.has(id));
        if (areAllSelected) {
            selectedIds.clear();
        } else {
            allCurrentIds.forEach(id => selectedIds.add(id));
        }
        renderRepresentatives();
    });

    sendEmailsButton.addEventListener('click', () => {
        if (selectedIds.size === 0) {
            alert('Please select at least one representative.');
            return;
        }
        const bccList = allReps
            .filter(rep => selectedIds.has(rep.id) && rep.email !== 'email-not-available')
            .map(rep => rep.email);

        if (bccList.length === 0) {
            alert('None of the selected representatives have an available email address.');
            return;
        }
        const subject = "A message from your constituent regarding support for Ukraine";
        const body = emailBodyEl.value;
        const mailtoLink = `mailto:?bcc=${bccList.join(',')}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    });

    copyMessageButton.addEventListener('click', () => {
        navigator.clipboard.writeText(emailBodyEl.value)
            .then(() => alert('Message copied to clipboard!'))
            .catch(err => console.error('Failed to copy message:', err));
    });

    copyEmailsButton.addEventListener('click', () => {
        if (selectedIds.size === 0) {
            alert('Please select representatives to copy their emails.');
            return;
        }
        const emailList = allReps
            .filter(rep => selectedIds.has(rep.id) && rep.email !== 'email-not-available')
            .map(rep => rep.email);

        navigator.clipboard.writeText(emailList.join(', '))
            .then(() => alert(`${emailList.length} email address(es) copied to clipboard!`))
            .catch(err => console.error('Failed to copy emails:', err));
    });

    void initializeApp();
});