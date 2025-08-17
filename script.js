document.addEventListener('DOMContentLoaded', () => {

    // --- WIDGET & GLOBAL STATE MANAGEMENT ---
    const landingWidget = document.getElementById('landing-widget');
    const emailToolWidget = document.getElementById('email-tool-widget');
    const proceedButton = document.getElementById('proceed-button');
    const backButton = document.getElementById('back-button');

    // --- NEW: Array of email templates ---
    const emailTemplates = [
        // Template 1: The original, direct approach
        `Dear Representative,

I am writing as your constituent to urge you to increase support for Ukraine. The defense of Ukraine's sovereignty is a critical global issue that demands our unwavering commitment.

We must provide robust security, humanitarian, and economic aid. Please vote in favor of all measures that strengthen Ukraine's ability to defend itself and advocate for stronger sanctions against the aggressor.

Your leadership on this is essential. I am counting on you to stand firmly with Ukraine.

Sincerely,`,

        // Template 2: Focus on democratic values
        `Hello,

As your constituent, I am writing to express my strong support for Ukraine and to ask you to take further action. The struggle for Ukraine's freedom is a fight for the democratic principles and international stability that we all hold dear.

I urge you to support all legislative efforts that provide military, financial, and humanitarian assistance to Ukraine. It is vital that we send a clear and resolute message that aggression will not be tolerated.

Your voice in the legislature is powerful. Please use it to champion the cause of a free and sovereign Ukraine.

Best regards,`,

        // Template 3: A more concise and urgent tone
        `Hi

I am writing to you today as a concerned constituent to demand more decisive action for Ukraine. The situation is critical, and continued, robust support from our government is non-negotiable.

Please prioritize and vote for any and all aid packages for Ukraine. We must provide them with the necessary tools to win this fight for their existence and for the security of Europe.

Please know that your voters are watching and expect strong leadership on this matter. We stand with Ukraine.

Thank you for your attention to this matter,`
    ];

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
    const userNameInput = document.getElementById('user-name');
    const userCityInput = document.getElementById('user-city');

    // --- CORE LOGIC ---

    async function initializeApp() {
        updateProceedButtonState();
        try {
            const response = await fetch('representatives.json');
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            const data = await response.json();

            allReps = data.representatives.map(rep => ({
                id: rep.id, name: rep.fullName, party: rep.party, country: rep.country,
                email: rep.contactInformation?.email || 'email-not-available',
                photo: rep.imageSource || 'https://via.placeholder.com/50/B0BEC5/455A64?Text=No+Img'
            }));

            populateCountrySelector();
            grid.innerHTML = '<p class="grid-placeholder">Please select a country from the dropdown above.</p>';
        } catch (error) {
            console.error("Fatal Error: Could not initialize app.", error);
            grid.innerHTML = `<p class="error-message">Could not load representative data.</p>`;
            countrySelector.innerHTML = `<option>Error</option>`;
        }
    }

    function updateProceedButtonState() {
        proceedButton.disabled = !userNameInput.value.trim();
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
            card.innerHTML = `<img src="${rep.photo}" alt="Photo of ${rep.name}" class="rep-photo" loading="lazy"><div class="rep-info"><p class="rep-name">${rep.name}</p><p class="rep-party">${rep.party}</p></div><div class="checkmark-icon">✓</div>`;
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
        // **UPDATED**: Select a random template and build the final text
        const randomIndex = Math.floor(Math.random() * emailTemplates.length);
        const randomTemplate = emailTemplates[randomIndex];

        const userName = userNameInput.value.trim();
        const userCity = userCityInput.value.trim();
        const date = new Date().toLocaleDateString();

        let signatureLine1 = `${userName}`;
        if (userCity) {
            signatureLine1 += `, ${userCity}`;
        }

        // Combine the base message, signature, and date
        emailBodyEl.value = `${randomTemplate}\n${signatureLine1}\n${date}`;

        landingWidget.classList.add('hidden');
        emailToolWidget.classList.remove('hidden');
        emailToolWidget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    backButton.addEventListener('click', () => {
        emailToolWidget.classList.add('hidden');
        landingWidget.classList.remove('hidden');
        landingWidget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    userNameInput.addEventListener('input', updateProceedButtonState);
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
        const body = emailBodyEl.value; // The body is now pre-formatted with the random template and signature
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