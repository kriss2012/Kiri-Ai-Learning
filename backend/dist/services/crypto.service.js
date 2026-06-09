"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signData = signData;
exports.verifySignature = verifySignature;
exports.getPublicKeyPem = getPublicKeyPem;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const CERTS_DIR = path_1.default.join(__dirname, "../../certs");
const PRIVATE_KEY_PATH = path_1.default.join(CERTS_DIR, "private.pem");
const PUBLIC_KEY_PATH = path_1.default.join(CERTS_DIR, "public.pem");
// Initialize keys
ensureKeysExist();
function ensureKeysExist() {
    try {
        if (!fs_1.default.existsSync(CERTS_DIR)) {
            fs_1.default.mkdirSync(CERTS_DIR, { recursive: true });
        }
        if (!fs_1.default.existsSync(PRIVATE_KEY_PATH) || !fs_1.default.existsSync(PUBLIC_KEY_PATH)) {
            console.log("🔑 Generating new 2048-bit RSA keypair for certificate signing...");
            const { publicKey, privateKey } = crypto_1.default.generateKeyPairSync("rsa", {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: "spki",
                    format: "pem",
                },
                privateKeyEncoding: {
                    type: "pkcs8",
                    format: "pem",
                },
            });
            fs_1.default.writeFileSync(PRIVATE_KEY_PATH, privateKey);
            fs_1.default.writeFileSync(PUBLIC_KEY_PATH, publicKey);
            console.log("✅ RSA keys generated and saved to certs/ directory.");
        }
    }
    catch (error) {
        console.error("❌ Failed to initialize RSA keys:", error);
    }
}
function signData(data) {
    try {
        const privateKey = fs_1.default.readFileSync(PRIVATE_KEY_PATH, "utf8");
        const signer = crypto_1.default.createSign("SHA256");
        signer.update(data);
        signer.end();
        return signer.sign(privateKey, "hex");
    }
    catch (error) {
        console.error("Signing Error:", error);
        throw new Error("Failed to cryptographically sign certificate.");
    }
}
function verifySignature(data, signatureHex) {
    try {
        const publicKey = fs_1.default.readFileSync(PUBLIC_KEY_PATH, "utf8");
        const verifier = crypto_1.default.createVerify("SHA256");
        verifier.update(data);
        verifier.end();
        return verifier.verify(publicKey, signatureHex, "hex");
    }
    catch (error) {
        console.error("Signature Verification Error:", error);
        return false;
    }
}
function getPublicKeyPem() {
    try {
        return fs_1.default.readFileSync(PUBLIC_KEY_PATH, "utf8");
    }
    catch (error) {
        console.error("Failed to read public key:", error);
        throw new Error("Public key not available.");
    }
}
