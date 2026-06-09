"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRouter = void 0;
const express_1 = require("express");
const verify_controller_1 = require("../controllers/verify.controller");
const crypto_service_1 = require("../services/crypto.service");
const verifyRouter = (0, express_1.Router)();
exports.verifyRouter = verifyRouter;
// QR Scan public verification route
verifyRouter.get("/cert/:cert_id", verify_controller_1.verifyCertificate);
// Serving the public key for independent validation
verifyRouter.get("/.well-known/cert-pubkey.pem", (req, res) => {
    try {
        const pem = (0, crypto_service_1.getPublicKeyPem)();
        res.setHeader("Content-Type", "application/x-pem-file");
        res.status(200).send(pem);
    }
    catch (error) {
        res.status(500).json({ error: "Server Error", message: error.message });
    }
});
