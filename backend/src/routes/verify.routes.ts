import { Router } from "express";
import { verifyCertificate } from "../controllers/verify.controller";
import { getPublicKeyPem } from "../services/crypto.service";

const verifyRouter = Router();

// QR Scan public verification route
verifyRouter.get("/cert/:cert_id", verifyCertificate);

// Serving the public key for independent validation
verifyRouter.get("/.well-known/cert-pubkey.pem", (req, res) => {
  try {
    const pem = getPublicKeyPem();
    res.setHeader("Content-Type", "application/x-pem-file");
    res.status(200).send(pem);
  } catch (error: any) {
    res.status(500).json({ error: "Server Error", message: error.message });
  }
});

export { verifyRouter };
