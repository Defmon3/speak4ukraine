// --- SCRIPT INITIALIZATION ---
// This main event listener waits for the HTML to be fully loaded before running any code.
document.addEventListener('DOMContentLoaded', () => {

    // --- WIDGET SWITCHING LOGIC ---
    const landingWidget = document.getElementById('landing-widget');
    const emailToolWidget = document.getElementById('email-tool-widget');
    const proceedButton = document.getElementById('proceed-button');
    const backButton = document.getElementById('back-button');

    proceedButton.addEventListener('click', () => {
        landingWidget.classList.add('hidden');
        emailToolWidget.classList.remove('hidden');
        emailToolWidget.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // After showing the tool, trigger the initial data load
        // Using `void` to explicitly ignore the returned promise.
        void fetchAndRenderRepresentatives(countrySelector.value);
    });

    backButton.addEventListener('click', () => {
        landingWidget.classList.remove('hidden');
        emailToolWidget.classList.add('hidden');
        landingWidget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // --- EMAIL TOOL LOGIC STARTS HERE ---

    // State Management: Variables to hold our data
    let allRepsData = {}; // Cache to store fetched data to avoid re-loading
    let currentReps = []; // Array of representatives for the currently selected legislature
    let selectedIds = new Set(); // A Set to efficiently track selected representative IDs

    // DOM Elements for the email tool
    const grid = document.getElementById('representatives-grid');
    const countrySelector = document.getElementById('country-selector');
    const selectedCountEl = document.getElementById('selected-count');
    const selectAllButton = document.getElementById('select-all-button');
    const sendEmailsButton = document.getElementById('send-emails-button');
    const copyMessageButton = document.getElementById('copy-message-button');
    const copyEmailsButton = document.getElementById('copy-emails-button');
    const emailBodyEl = document.getElementById('email-body');

    /**
     * Fetches representative data from a JSON file.
     * Caches results to avoid re-fetching the same file.
     * @param {string} legislatureCode - The identifier (e.g., 'eu-sweden').
     */
    async function fetchAndRenderRepresentatives(legislatureCode) {
        grid.innerHTML = '<p>Loading representatives...</p>';

        if (allRepsData[legislatureCode]) {
            currentReps = allRepsData[legislatureCode];
            renderRepresentatives();
            return;
        }

        try {
            const response = await fetch(`data/${legislatureCode}.json`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            const rawData = await response.json();

            // Transform raw data into the format our app uses
            currentReps = rawData.map(rep => ({
                id: rep.id,
                name: rep.fullName,
                party: rep.party,
                email: rep.contactInformation?.email || 'email-not-available', // Safely access nested email
                photo: rep.imageSource
            }));

            allRepsData[legislatureCode] = currentReps; // Cache the processed data
            renderRepresentatives();
        } catch (error) {
            console.error("Failed to fetch representatives:", error);
            grid.innerHTML = `<p class="error-message">Error: Could not load representative data. Please try refreshing the page.</p>`;
        }
    }

    /**
     * Renders the representative cards into the grid based on the `currentReps` array.
     */
    function renderRepresentatives() {
        grid.innerHTML = '';
        if (!currentReps || currentReps.length === 0) {
            grid.innerHTML = '<p>No representatives found for this selection.</p>';
            return;
        }

        currentReps.forEach(rep => {
            const isSelected = selectedIds.has(rep.id);
            const card = document.createElement('div');
            card.className = `representative-card ${isSelected ? 'selected' : ''}`;
            card.dataset.id = rep.id;

            card.innerHTML = `
                <img src="${rep.photo}" alt="Photo of ${rep.name}" class="rep-photo">
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

    // --- EVENT LISTENERS for the Email Tool ---

    // Handle legislature changes
    countrySelector.addEventListener('change', (e) => {
        selectedIds.clear();
        // Using `void` to explicitly ignore the returned promise.
        void fetchAndRenderRepresentatives(e.target.value);
    });

    // Handle clicks on representative cards
    grid.addEventListener('click', (e) => {
        const card = e.target.closest('.representative-card');
        if (card) {
            toggleSelection(card);
        }
    });

    // Handle "Select All" button
    selectAllButton.addEventListener('click', () => {
        const allIds = currentReps.map(rep => rep.id);
        const areAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));

        if (areAllSelected) {
            selectedIds.clear();
        } else {
            allIds.forEach(id => selectedIds.add(id));
        }
        renderRepresentatives();
    });

    // Handle "Send Emails" button
    sendEmailsButton.addEventListener('click', () => {
        if (selectedIds.size === 0) {
            alert('Please select at least one representative to email.');
            return;
        }

        const bccList = currentReps
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

    // Handle "Copy Message" button
    copyMessageButton.addEventListener('click', () => {
        // Here we DO handle the promise with .then(), so `void` is not needed.
        navigator.clipboard.writeText(emailBodyEl.value).then(() => {
            alert('Message copied to clipboard!');
        }).catch(err => console.error('Failed to copy message:', err));
    });

    // Handle "Copy Email Addresses" button
    copyEmailsButton.addEventListener('click', () => {
        if (selectedIds.size === 0) {
            alert('Please select representatives to copy their emails.');
            return;
        }
        const emailList = currentReps
            .filter(rep => selectedIds.has(rep.id) && rep.email !== 'email-not-available')
            .map(rep => rep.email);

        // We also handle this promise, so no `void` needed.
        navigator.clipboard.writeText(emailList.join(', ')).then(() => {
            alert(`${emailList.length} email address(es) copied to clipboard!`);
        }).catch(err => console.error('Failed to copy emails:', err));
    });

}); // End of DOMContentLoaded listener