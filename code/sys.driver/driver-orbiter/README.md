# sys.state.ipfs.orbiter

## Orbiter Driver (IPFS)
State in the cloud over an HTTP bridge from [IPFS](https://ipfs.tech) using [IPCM](https://ipcm.dev) for pinned [CID](https://docs.ipfs.tech/concepts/content-addressing/) mapping and immutable version control.

- https://orbiter.host
- https://ipcm.dev

This module contains tools for managing state deployed to IPFS on the [orbiter.host](https://orbiter.host) service.

## Layers

 ↑  FS (file-system)  
 ↑  I/O: CLI (command-line)  
 ↑  Orbiter (DNS, serve, manage edge server config)  
 ↑  IPCM (CID mapping)  
✨  IPFS  

---

## IPCM
File-mapping on IPFS managed by [IPCM](https://ipcm.dev), where a blockchain is used to map file-paths to [CID](https://docs.ipfs.tech/concepts/content-addressing/)'s.

![ipcm-dev-state-binary-oss-mit-InterPlanetary-CID-Mapping](https://github.com/user-attachments/assets/2dae3f1a-6ab1-483f-9e0c-934aac5ca8b6)


>> With this ["IPCM mapping"] approach the contract address acts as the static address, and the state it holds can be dynamic.  
>> This results in several benefits:
>>
>> - Cryptographically secures ownership and updates to an onchain identity
>> - Events create an onchain history of updates
>> - Can be deployed to any EVM chain
>> - Fetching the latest state is simple and fast
>>
>> — [source](https://ipcm.dev)
