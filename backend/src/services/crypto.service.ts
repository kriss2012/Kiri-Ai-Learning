import crypto from "crypto";
import fs from "fs";
import path from "path";

const CERTS_DIR = path.join(__dirname, "../../certs");
const PRIVATE_KEY_PATH = path.join(CERTS_DIR, "private.pem");
const PUBLIC_KEY_PATH = path.join(CERTS_DIR, "public.pem");

// Initialize keys
ensureKeysExist();

function ensureKeysExist() {
  try {
    if (!fs.existsSync(CERTS_DIR)) {
      fs.mkdirSync(CERTS_DIR, { recursive: true });
    }

    if (!fs.existsSync(PRIVATE_KEY_PATH) || !fs.existsSync(PUBLIC_KEY_PATH)) {
      console.log("🔑 Generating new 2048-bit RSA keypair for certificate signing...");
      const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
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

      fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
      fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
      console.log("✅ RSA keys generated and saved to certs/ directory.");
    }
  } catch (error) {
    console.error("❌ Failed to initialize RSA keys:", error);
  }
}

export function signData(data: string): string {
  try {
    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
    const signer = crypto.createSign("SHA256");
    signer.update(data);
    signer.end();
    return signer.sign(privateKey, "hex");
  } catch (error) {
    console.error("Signing Error:", error);
    throw new Error("Failed to cryptographically sign certificate.");
  }
}

export function verifySignature(data: string, signatureHex: string): boolean {
  try {
    const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, "utf8");
    const verifier = crypto.createVerify("SHA256");
    verifier.update(data);
    verifier.end();
    return verifier.verify(publicKey, signatureHex, "hex");
  } catch (error) {
    console.error("Signature Verification Error:", error);
    return false;
  }
}

export function getPublicKeyPem(): string {
  try {
    return fs.readFileSync(PUBLIC_KEY_PATH, "utf8");
  } catch (error) {
    console.error("Failed to read public key:", error);
    throw new Error("Public key not available.");
  }
}
