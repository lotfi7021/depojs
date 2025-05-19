document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const passwordDisplay = document.getElementById('password');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const qrBtn = document.getElementById('qrBtn');
    const saveBtn = document.getElementById('saveBtn');
    const lengthSlider = document.getElementById('length');
    const lengthValue = document.getElementById('lengthValue');
    const uppercaseCheckbox = document.getElementById('uppercase');
    const lowercaseCheckbox = document.getElementById('lowercase');
    const numbersCheckbox = document.getElementById('numbers');
    const symbolsCheckbox = document.getElementById('symbols');
    const historyList = document.getElementById('historyList');
    const historySection = document.getElementById('historySection');
    const qrContainer = document.getElementById('qrContainer');
    const tipsList = document.getElementById('tipsList');

    // histrique mdp local Storage
    let passwordHistory = JSON.parse(localStorage.getItem('passwordHistory')) || [];
    updateHistoryDisplay();


    // Events
    lengthSlider.addEventListener('input', function() {
        lengthValue.textContent = this.value;
    });

    generateBtn.addEventListener('click', function() {
        generatePassword();
        qrContainer.style.display = "none";
    });

    copyBtn.addEventListener('click', function() {
        const password = passwordDisplay.textContent;
        navigator.clipboard.writeText(password).then(function() {
            showTooltip(copyBtn, "Copié!");
        });
    });

    qrBtn.addEventListener('click', generateQRCode);

    
    saveBtn.addEventListener('click', function() {
        const password = passwordDisplay.textContent;
        if (!passwordHistory.includes(password)) {
            passwordHistory.unshift(password);
            if (passwordHistory.length > 10) {
                passwordHistory.pop();
            }
            localStorage.setItem('passwordHistory', JSON.stringify(passwordHistory));
            updateHistoryDisplay();
            showTooltip(saveBtn, "Sauvegardé!");
        }
    });

    function generatePassword() {
        const length = lengthSlider.value;
        const hasUpper = uppercaseCheckbox.checked;
        const hasLower = lowercaseCheckbox.checked;
        const hasNumber = numbersCheckbox.checked;
        const hasSymbol = symbolsCheckbox.checked;
        let password = generatePasswordString(hasUpper, hasLower, hasNumber, hasSymbol, length);
        passwordDisplay.textContent = password;
        return password;
    }

    function generatePasswordString(upper, lower, number, symbol, length) {
        let chars = '';
        let password = '';
        if (upper) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        if (lower) chars += 'abcdefghijkmnopqrstuvwxyz';
        if (number) chars += '123456789';
        if (symbol) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            password += chars[randomIndex];
        }
        return password;
    }

    function generateQRCode() {
        const password = passwordDisplay.textContent;
        if (!password || password === "Cliquez sur \"Générer\"") {
            showTooltip(qrBtn, "Générez d'abord un mot de passe");
            return;
        }
        
        qrContainer.style.display = "flex";
        qrContainer.style.flexDirection = "column";
        qrContainer.style.alignItems = "center";
        qrContainer.style.justifyContent = "center";
        qrContainer.innerHTML = `
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(password)}&margin=10" 
                 alt="QR Code du mot de passe">
            <p class="qr-hint">Scanner pour mobile</p>
        `;
    }

  

    function updateHistoryDisplay() {
        historyList.innerHTML = '';
        if (passwordHistory.length === 0) {
            historySection.style.display = 'none';
            return;
        }
        
        historySection.style.display = 'block';
        passwordHistory.forEach((password, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `
                <span>${password}</span>
                <div class="history-actions">
                    <button class="action-btn copy-history-btn" data-password="${password}">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="action-btn delete-history-btn" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            historyList.appendChild(item); //melowel hotou
        });
        

        document.querySelectorAll('.copy-history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const password = this.getAttribute('data-password');
                navigator.clipboard.writeText(password).then(() => {
                    showTooltip(this, "Copié!");
                });
            });
        });
        
        document.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                passwordHistory.splice(index, 1);
                localStorage.setItem('passwordHistory', JSON.stringify(passwordHistory));
                updateHistoryDisplay();
            });
        });
    }

    function showTooltip(element, message) {
        const tooltip = element.querySelector('.tooltiptext');
        if (tooltip) {
            const originalText = tooltip.textContent;
            tooltip.textContent = message;
            setTimeout(() => {
                tooltip.textContent = originalText;
            }, 2000);
        }
    }

    generatePassword();
});