import Contract from "./Contract.js";

import erc20Abi from "../../config/abis/erc20.js";
import exchangeAbi from "../../config/abis/exchange.js";
import contractWalletAbi from "../../config/abis/contractWallet.js";

const ERC20Token = new Contract(erc20Abi);
const ExchangeContract = new Contract(exchangeAbi);
const ContractWallet = new Contract(contractWalletAbi);

export default {
  ERC20Token,
  ExchangeContract,
  ContractWallet,
};
