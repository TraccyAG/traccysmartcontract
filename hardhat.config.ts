import { HardhatUserConfig } from "hardhat/types";
import "@nomicfoundation/hardhat-toolbox";


//const { pkey } = require('./secret.json');

const config: HardhatUserConfig = {
    solidity: {
        compilers: [{ version: "0.8.17", settings: {optimizer : { enabled: true, runs: 1500}} }],
    },
    networks: {
        ganache: {
            url: "http://127.0.0.1:7545",
        },
        hardhat_node: {
            url: "http://127.0.0.1:8545"
        },
        hardhat: {
            chainId: 0xa86a,
            initialBaseFeePerGas: 0,
            forking: {
               url: "https://avalanche-mainnet.infura.io/v3/<yourkey>"
            },
            // mining: {
            //     auto: false,
            //     interval: 5000
            // }
            // note: enable mining only when testing UI. disable when testing via unit tests as it slows them down and might lead to erroes
        }        
    },
    defaultNetwork: "hardhat", 
};
        
export default config;
