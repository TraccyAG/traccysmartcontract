# Traccy Smart Contracts 
This project contains smart contracts belonging to Traccy. The following list provides a brief overview of these
smart contracts and their functionality:
* `TRCYN` - the TRCYN token contract itself. It is a simple, IERC20-compatible token.
* `PhaseableSale` - an extended sale contract that supports multiple sale phases. Supported payment options are USDT and USDC.
<br/>
All contracts are implemented in the **Solidity** programming language. You can find the contract implementations in the subdirectory
`contracts/`. For each of these contracts there is a dedicated test suite in the subdirectory `test/`. These tests are written in **Typescript** and
are, beside their obvious purpose to ensure correct behavior of the contracts, a great resource for frontend devs in order to see how one can interact
with these contracts from an off-chain position.

## Sale Contract Administration Guite
This chapter provides some answers on common question towards an integration of the sale contract into a UI.
<br><br>
<b>How to start a new phase</b><br>
A new phase is started via the function `createPhase`, which takes the following two parameters:
* `priceUsd`: Is the price in USDT/C for 1 full token unit (10^18). Since USDT and USDC support 6 decimals uint, this needs to be be specified with 6 decimals uint, which means a value of 1 USDT/C needs to be specified as `1000000` or a value of 0.5 USDT/C needs to be specigied as `500000`.
* `amount`: Token volume of the phase in the tokens decimals unit, which is 18 digits. For example, a phase sale amount of 1000 full token units needs to be specified as `1000 * 10^18`.

Note, that before a new phase can be started, the previous phase must be closed via function `closePhase`. Furthermore, the amount of the phase volume needs to be send to the sale contract before a new phase is started.

<br>
<b>How do I get info regarding phases?</b><br>
You can get the total amount of phases via the function `phaseCounter`. For dedicated phases, you can query information by passing the corresponding *phase id* to function `phaseInfo`. The phase id of the latest phase is `phaseCounter-1`. You will retrieve the following information:

* Timestamp in seconds of the phase start
* Timestamp in seconds of the phase end (in case it is a closed phase)
* Token price in the `10^6` format that is supported by USDC and USDT.
* Token volume of the phase in `10^18` format.
* Total amount of sold tokens during this phase in `10^18` format.
* Flag that indicates, wheter the phase is closed or not.

<br><br>
<b>How do I withdraw remaining tokens?</b><br>
Tokens that not have been sold, can be resent to the sale token owner via function `withdrawTokens`. 
<br><br>


## Execute Test Suite
You can execute the test suite of this project by first installing all NodeJS dependencies via:
```
yarn
```
And then run the hardhat execution command via:
```
npx hardhat test
```

## Deploy the Smart Contracts
The script `scripts/deploy.ts` can be used to deploy both, the TRCYN token as well as the sale contract:
1. Configure the connection to the target network with the wallet that should deploy the contract and act as contract owner in the config file `hardhat.config.ts`.
2. Execute the following command:
    ```
    npx hardhat run scripts/deploy.ts --network <target_network_id>
    ```

## Start a Test Network for UI Development
You can run a forked network with the deployed project in a Docker container. This is especially helpful for UI development.
First, build the Docker image from the project:
```
docker build -t myid/testenv .
```
Then, spin up a container via:
```
docker run -it -p 8545:8545 myid/testenv
```
This will start the network in the container and automatically deploys the contract to that network.
You can reach the network's RPC endpoint at `http://localhost:8545`. The configured network id is `31137`.

Alternatively, you can use Docker Compose to create an additional Docker network in which the network is running.
This can be helpful if you want to test additional non-UI services that need to connect with the network and are 
also running in Docker containers.

To start the service via Docker Compose including its own network, execute the following command:
```
docker-compose up
```
If you want made changes to the network config, rebuild via Docker Compose first:
```
docker-compose build
```