#!/bin/bash
  
# turn on bash's job control
set -m

# start the local node and put it to background
npx hardhat node &
# wait 10 seconds until local chain is up and running
sleep 10

# Start the helper process
npx hardhat run scripts/setup_testenv.ts --network hardhat_node
  
# now we bring the primary process back into the foreground
# and leave it there
fg %1