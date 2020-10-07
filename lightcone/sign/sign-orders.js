import * as Poseidon from "../sign/poseidon.js";
import * as fm from "../common/formatter.js";
import EdDSA from "./eddsa.js";
import config from "../config/index.js";
import sha256 from "crypto-js/sha256.js";

export function generateKeyPair(seed) {
  return EdDSA.generateKeyPair(seed);
}

export function verify(publicKeyX, publicKeyY, seed) {
  const keyPair = generateKeyPair(seed);
  return keyPair.publicKeyX === publicKeyX && keyPair.publicKeyY === publicKeyY;
}

export function signOrder(_order, keyPair, tokens) {
  if (_order.signature !== undefined) {
    return;
  }

  const order = setupOrder(_order, tokens);
  const hasher = Poseidon.createHash(14, 6, 53);

  // Calculate hash
  const inputs = [
    order.exchangeId,
    order.orderId,
    order.accountId,
    order.tokenSId,
    order.tokenBId,
    order.amountSInBN,
    order.amountBInBN,
    order.allOrNone ? 1 : 0,
    order.validSince,
    order.validUntil,
    order.maxFeeBips,
    order.buy ? 1 : 0,
    order.label,
  ];
  // console.log(`exchange.js hash inputs`, inputs)

  order.hash = hasher(inputs).toString(10);

  // console.log(`exchange.js hash`, order.hash)

  // Create signature
  const signature = EdDSA.sign(keyPair.secretKey, order.hash);
  // console.log(`exchange.js signature`, signature)

  order.signature = signature;
  order.signatureRx = signature.Rx;
  order.signatureRy = signature.Ry;
  order.signatureS = signature.s;

  /**
  // Verify signature
  const success = EdDSA.verify(order.hash, order.signature, [
    keyPair.publicKeyX,
    keyPair.publicKeyY
  ]);
  */

  order.clientOrderId = ''
  order.orderType = 'LIMIT_ORDER'

  return order;
}

function setupOrder(order, tokens) {
  let tokenBuy, tokenSell;
  if (!order.tokenS.startsWith("0x")) {
    tokenSell = config.getTokenBySymbol(order.tokenS, tokens);
  } else {
    tokenSell = config.getTokenByAddress(order.tokenS, tokens);
  }
  if (!order.tokenB.startsWith("0x")) {
    tokenBuy = config.getTokenBySymbol(order.tokenB, tokens);
  } else {
    tokenBuy = config.getTokenByAddress(order.tokenB, tokens);
  }
  order.tokenS = tokenSell.address;
  order.tokenB = tokenBuy.address;
  order.tokenSId = tokenSell.tokenId;
  order.tokenBId = tokenBuy.tokenId;

  order.amountSInBN = config.toWEI(tokenSell.symbol, order.amountS, tokens);
  order.amountS = order.amountSInBN;

  order.amountBInBN = config.toWEI(tokenBuy.symbol, order.amountB, tokens);
  order.amountB = order.amountBInBN;

  order.buy = order.buy !== undefined ? !!order.buy : false;

  order.maxFeeBips =
    order.maxFeeBips !== undefined ? order.maxFeeBips : config.getMaxFeeBips();
  order.allOrNone = order.allOrNone !== undefined ? !!order.allOrNone : false;

  order.feeBips =
    order.feeBips !== undefined ? order.feeBips : order.maxFeeBips;
  order.rebateBips = order.rebateBips !== undefined ? order.rebateBips : 0;
  order.label = order.label !== undefined ? order.label : config.getLabel();

  // Sign the order
  return order;
}

export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function signCancelOrdersByHash(request, keyPair) {
  if (request.signature !== undefined) return;
  let base = 'DELETE&';
  base += encodeURIComponent(`${config.getServer()}/api/v2/orders/byHash`);
  base += '&'
  base += encodeURIComponent(`accountId=${request.accountId}&orderHash=` + encodeURIComponent(request.orderHash));

  request.signature = EdDSA.sign(keyPair.secretKey, fm.addHexPrefix(sha256(base).toString()));
  return request;
}
