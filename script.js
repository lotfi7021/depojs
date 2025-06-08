document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const passwordDisplay = document.getElementById('password');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const qrBtn = document.getElementById('qrBtn');
    const saveBtn = document.getElementById('saveBtn');
    const shareBtn = document.getElementById('shareBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const lengthSlider = document.getElementById('length');
    const lengthValue = document.getElementById('lengthValue');
    const uppercaseCheckbox = document.getElementById('uppercase');
    const lowercaseCheckbox = document.getElementById('lowercase');
    const numbersCheckbox = document.getElementById('numbers');
    const symbolsCheckbox = document.getElementById('symbols');
    const memorableCheckbox = document.getElementById('memorable');
    const historyList = document.getElementById('historyList');
    const historySection = document.getElementById('historySection');
    const qrContainer = document.getElementById('qrContainer');
    const strengthLabel = document.getElementById('strengthLabel');
    const strengthMessage = document.getElementById('strengthMessage');
    const strengthBars = [
        document.getElementById('strengthBar1'),
        document.getElementById('strengthBar2'),
        document.getElementById('strengthBar3'),
        document.getElementById('strengthBar4')
    ];
    const tipsList = document.getElementById('tipsList');

    // Password history from localStorage
    let passwordHistory = JSON.parse(localStorage.getItem('passwordHistory')) || [];
    updateHistoryDisplay();

    // Event Listeners
    lengthSlider.addEventListener('input', updateLengthValue);
    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyPassword);
    qrBtn.addEventListener('click', generateQRCode);
    saveBtn.addEventListener('click', savePassword);
    shareBtn.addEventListener('click', sharePassword);
    clearHistoryBtn.addEventListener('click', clearHistory);

    // Initialize
    updateLengthValue();
    generatePassword();
    loadSecurityTips();

    // Functions
    function updateLengthValue() {
        lengthValue.textContent = lengthSlider.value;
    }

    async function generatePassword() {
        const length = lengthSlider.value;
        const hasUpper = uppercaseCheckbox.checked;
        const hasLower = lowercaseCheckbox.checked;
        const hasNumber = numbersCheckbox.checked;
        const hasSymbol = symbolsCheckbox.checked;
        const isMemorable = memorableCheckbox.checked;

        let password;
        
        if (isMemorable) {
            password = await generateMemorablePassword();
        } else {
            password = generateRandomPassword(hasUpper, hasLower, hasNumber, hasSymbol, length);
        }

        passwordDisplay.textContent = password;
        checkPasswordStrength(password);
        return password;
    }

    function generateRandomPassword(upper, lower, number, symbol, length) {
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

    async function generateMemorablePassword() {
        try {
            // Try to fetch random words from API
            const response = await fetch('https://random-word-api.herokuapp.com/word?number=3');
            const words = await response.json();
            
            // Combine words with numbers/symbols
            const separator = Math.random() > 0.5 ? '-' : '_';
            const randomNum = Math.floor(Math.random() * 100);
            const randomSymbol = '!@#$%^&*'[Math.floor(Math.random() * 8)];
            
            return words.join(separator) + randomNum + randomSymbol;
        } catch (error) {
            console.error("Error fetching words, using fallback:", error);
            // Fallback if API fails
            const fallbackWords = ['sunshine', 'mountain', 'keyboard'];
            const separator = Math.random() > 0.5 ? '-' : '_';
            const randomNum = Math.floor(Math.random() * 100);
            const randomSymbol = '!@#$%^&*'[Math.floor(Math.random() * 8)];
            
            return fallbackWords.join(separator) + randomNum + randomSymbol;
        }
    }

    async function checkPasswordStrength(password) {
        try {
            // Check if password has been pwned
            const isPwned = await checkPwnedPassword(password);
            
            if (isPwned) {
                updateStrengthUI(0, "This password has been compromised in data breaches!");
                return;
            }

            // Calculate strength (simple algorithm for demo)
            let strength = 0;
            if (password.length >= 12) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            const messages = [
                "Very Weak - Easy to crack",
                "Weak - Can be improved",
                "Moderate - Could be stronger",
                "Strong - Good password",
                "Very Strong - Excellent password"
            ];
            
            updateStrengthUI(strength, messages[strength]);
        } catch (error) {
            console.error("Error checking password strength:", error);
            updateStrengthUI(-1, "Error checking password strength");
        }
    }

    function updateStrengthUI(strength, message) {
        strengthLabel.textContent = ["Very Weak", "Weak", "Moderate", "Strong", "Very Strong"][strength] || "Unknown";
        strengthMessage.textContent = message;
        
        // Update strength bars
        strengthBars.forEach((bar, index) => {
            if (index <= strength) {
                bar.style.backgroundColor = 
                    strength < 1 ? "var(--danger)" :
                    strength < 2 ? "var(--warning)" :
                    strength < 3 ? "#ffcc00" :
                    strength < 4 ? "var(--success)" : "var(--accent)";
            } else {
                bar.style.backgroundColor = "#eee";
            }
        });
    }

    async function checkPwnedPassword(password) {
        try {
            // SHA-1 hash the password
            const hash = await sha1(password);
            const prefix = hash.substring(0, 5);
            const suffix = hash.substring(5).toUpperCase();
            
            // Check against HIBP API
            const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
            const results = await response.text();
            
            return results.includes(suffix);
        } catch (error) {
            console.error("Error checking pwned passwords:", error);
            return false;
        }
    }

    async function sha1(str) {
        const buffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function copyPassword() {
        const password = passwordDisplay.textContent;
        
        navigator.clipboard.writeText(password).then(() => {
            showTooltip(copyBtn, "Copied!");
        }).catch(err => {
            console.error("Failed to copy:", err);
            showTooltip(copyBtn, "Failed to copy");
        });
    }

    function generateQRCode() {
        const password = passwordDisplay.textContent;
        if (!password) return;
        
        qrContainer.style.display = "block";
        qrContainer.innerHTML = `
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(password)}" 
                 alt="Password QR Code">
            <p class="qr-hint">Scan to transfer to mobile</p>
        `;
    }

    function savePassword() {
        const password = passwordDisplay.textContent;
        
        if (password && !passwordHistory.includes(password)) {
            passwordHistory.unshift(password);
            
            if (passwordHistory.length > 10) {
                passwordHistory.pop();
            }
            
            localStorage.setItem('passwordHistory', JSON.stringify(passwordHistory));
            updateHistoryDisplay();
            showTooltip(saveBtn, "Saved!");
        }
    }

    async function sharePassword() {
        const password = passwordDisplay.textContent;
        
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Generated Password',
                    text: 'Here is your secure password:',
                    url: `data:,${encodeURIComponent(password)}`
                });
            } else {
                // Fallback for browsers without Web Share API
                await navigator.clipboard.writeText(password);
                showTooltip(shareBtn, "Copied to clipboard");
            }
        } catch (error) {
            console.error("Error sharing:", error);
            showTooltip(shareBtn, "Failed to share");
        }
    }

    function clearHistory() {
        passwordHistory = [];
        localStorage.setItem('passwordHistory', JSON.stringify(passwordHistory));
        updateHistoryDisplay();
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
            historyList.appendChild(item);
        });
        
        // Add event listeners for new buttons
        document.querySelectorAll('.copy-history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const password = this.getAttribute('data-password');
                navigator.clipboard.writeText(password).then(() => {
                    showTooltip(this, "Copied!");
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

    async function loadSecurityTips() {
        try {
            // Simulate API call with timeout
            setTimeout(() => {
                const tips = [
                    "Change passwords every 3-6 months",
                    "Use a different password for each account",
                    "Enable two-factor authentication where available",
                    "Consider using a password manager",
                    "Never share passwords via email or messaging"
                ];
                
                tipsList.innerHTML = tips.map(tip => 
                    `<div class="tip-item">${tip}</div>`
                ).join('');
            }, 1000);
        } catch (error) {
            console.error("Error loading security tips:", error);
            tipsList.innerHTML = "<div>Could not load security tips</div>";
        }
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
});